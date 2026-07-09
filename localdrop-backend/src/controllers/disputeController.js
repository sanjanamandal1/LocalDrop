// src/controllers/disputeController.js — Dispute lifecycle
'use strict';

const { query, getClient } = require('../db/pool');
const { createError } = require('../middleware/errorHandler');

const DISPUTE_WINDOW_HOURS = parseInt(process.env.DISPUTE_WINDOW_HOURS, 10) || 48;

/**
 * POST /api/disputes
 * Business raises a dispute on a confirmed redemption.
 * Body: { redemption_id, reason, evidence_urls? }
 * Maps to: "Raise Dispute" action on Business Redemptions Feed.
 */
async function createDispute(req, res, next) {
  try {
    const { redemption_id, reason, evidence_urls } = req.body;

    if (!redemption_id || !reason) {
      return res.status(400).json({ success: false, message: 'redemption_id and reason are required.' });
    }

    // Fetch redemption + earning
    const redResult = await query(
      `SELECT r.id, r.status, r.confirmed_at, r.campaign_id,
              c.business_id,
              e.id AS earning_id, e.status AS earning_status
       FROM redemptions r
       JOIN campaigns c ON c.id = r.campaign_id
       JOIN earnings e ON e.redemption_id = r.id
       WHERE r.id = $1`,
      [redemption_id]
    );

    if (redResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Redemption not found.' });
    }

    const red = redResult.rows[0];

    // Authorization
    if (red.business_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to dispute this redemption.' });
    }

    // Must be confirmed
    if (red.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: `Only confirmed redemptions can be disputed. Status: ${red.status}.` });
    }

    // Earning must be pending (if available/paid, window passed or already paid out)
    if (red.earning_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Earning is already paid and cannot be disputed.' });
    }

    if (red.earning_status === 'disputed') {
      return res.status(409).json({ success: false, message: 'A dispute already exists for this redemption.' });
    }

    // Enforce 48-hour window
    const windowExpiry = new Date(red.confirmed_at);
    windowExpiry.setHours(windowExpiry.getHours() + DISPUTE_WINDOW_HOURS);
    if (new Date() > windowExpiry) {
      return res.status(400).json({
        success: false,
        message: `Dispute window has expired. Disputes must be filed within ${DISPUTE_WINDOW_HOURS} hours of confirmation.`,
      });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Create dispute
      const disputeResult = await client.query(
        `INSERT INTO disputes (redemption_id, earning_id, business_id, reason, evidence_urls, status)
         VALUES ($1, $2, $3, $4, $5, 'open')
         RETURNING id, status, filed_at`,
        [redemption_id, red.earning_id, req.user.id, reason,
         evidence_urls && evidence_urls.length > 0 ? evidence_urls : null]
      );

      // 2. Freeze the earning (mark as disputed)
      await client.query(
        `UPDATE earnings SET status = 'disputed', updated_at = NOW() WHERE id = $1`,
        [red.earning_id]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        message: 'Dispute filed. The earning is frozen pending admin review.',
        data: disputeResult.rows[0],
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
}

/**
 * GET /api/disputes/business
 * Business views their own disputes.
 */
async function getBusinessDisputes(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = `
      SELECT d.id, d.status, d.reason, d.filed_at, d.resolved_at, d.admin_notes,
             r.redemption_code, r.confirmed_at,
             c.name AS campaign_name,
             e.amount
      FROM disputes d
      JOIN redemptions r ON r.id = d.redemption_id
      JOIN campaigns c ON c.id = r.campaign_id
      JOIN earnings e ON e.id = d.earning_id
      WHERE d.business_id = $1
    `;
    const params = [req.user.id];
    if (status) { params.push(status); sql += ` AND d.status = $${params.length}`; }
    sql += ` ORDER BY d.filed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), offset);

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

/**
 * GET /api/disputes/:id
 * Get single dispute detail.
 */
async function getDisputeById(req, res, next) {
  try {
    const result = await query(
      `SELECT d.*, r.redemption_code, r.confirmed_at, r.claim_lat, r.claim_lng,
              r.confirm_lat, r.confirm_lng, r.geo_verified, r.geo_distance_m,
              c.name AS campaign_name, c.offer_details,
              bp.business_name,
              cp.name AS creator_name, cp.avatar_url AS creator_avatar,
              e.amount, e.status AS earning_status
       FROM disputes d
       JOIN redemptions r ON r.id = d.redemption_id
       JOIN campaigns c ON c.id = r.campaign_id
       JOIN business_profiles bp ON bp.user_id = c.business_id
       JOIN creator_profiles cp ON cp.user_id = r.creator_id
       JOIN earnings e ON e.id = d.earning_id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Dispute not found.' });

    const dispute = result.rows[0];
    // Access control: business, creator, or admin
    const isAllowed = req.user.role === 'admin'
      || dispute.business_id === req.user.id
      || (req.user.role === 'creator' && dispute.creator_id === req.user.id);

    if (!isAllowed) return res.status(403).json({ success: false, message: 'Access denied.' });

    return res.json({ success: true, data: dispute });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/disputes/:id/resolve  [Admin only]
 * Admin resolves a dispute as APPROVED or REJECTED.
 * Body: { resolution: 'approved' | 'rejected', admin_notes? }
 *
 * APPROVED → earning REVERSED, creator balance corrected
 * REJECTED → earning returns to AVAILABLE
 *
 * Maps to: "Admin Dispute Panel"
 */
async function resolveDispute(req, res, next) {
  try {
    const { resolution, admin_notes } = req.body;
    if (!['approved', 'rejected'].includes(resolution)) {
      return res.status(400).json({ success: false, message: 'resolution must be "approved" or "rejected".' });
    }

    const disputeResult = await query(
      `SELECT d.*, e.amount, e.creator_id
       FROM disputes d
       JOIN earnings e ON e.id = d.earning_id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (disputeResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Dispute not found.' });

    const dispute = disputeResult.rows[0];
    if (dispute.status === 'approved' || dispute.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Dispute already resolved.' });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Update dispute record
      await client.query(
        `UPDATE disputes
         SET status = $1, admin_id = $2, admin_notes = $3, resolved_at = NOW()
         WHERE id = $4`,
        [resolution, req.user.id, admin_notes || null, req.params.id]
      );

      if (resolution === 'approved') {
        // APPROVED: reverse the earning
        await client.query(
          `UPDATE earnings SET status = 'reversed', updated_at = NOW() WHERE id = $1`,
          [dispute.earning_id]
        );

        // Reverse redemption
        await client.query(
          `UPDATE redemptions SET status = 'reversed' WHERE id = $1`,
          [dispute.redemption_id]
        );

        // Deduct from creator's total_earnings
        await client.query(
          `UPDATE creator_profiles
           SET total_earnings = GREATEST(0, total_earnings - $1),
               pending_payout = GREATEST(0, pending_payout - $1)
           WHERE user_id = $2`,
          [dispute.amount, dispute.creator_id]
        );

        // Refund campaign's spent_budget
        await client.query(
          `UPDATE campaigns SET spent_budget = GREATEST(0, spent_budget - $1) WHERE id = (
             SELECT campaign_id FROM earnings WHERE id = $2
           )`,
          [dispute.amount, dispute.earning_id]
        );
      } else {
        // REJECTED: dispute was invalid → earning back to available
        await client.query(
          `UPDATE earnings SET status = 'available', updated_at = NOW() WHERE id = $1`,
          [dispute.earning_id]
        );
      }

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: `Dispute ${resolution}. Earning ${resolution === 'approved' ? 'reversed' : 'released to AVAILABLE'}.`,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
}

module.exports = { createDispute, getBusinessDisputes, getDisputeById, resolveDispute };
