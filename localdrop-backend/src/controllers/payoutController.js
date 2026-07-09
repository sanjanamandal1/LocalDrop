// src/controllers/payoutController.js — Payout request, eligibility, history
'use strict';

const { query, getClient } = require('../db/pool');

const PAYOUT_MIN_AMOUNT = parseFloat(process.env.PAYOUT_MIN_AMOUNT) || 1000;

/**
 * GET /api/payouts/eligibility
 * Returns how much is available to withdraw + whether eligible.
 * Maps to: "Payouts" screen summary cards.
 */
async function getPayoutEligibility(req, res, next) {
  try {
    const availableResult = await query(
      `SELECT COALESCE(SUM(amount), 0) AS available_amount
       FROM earnings
       WHERE creator_id = $1 AND status = 'available'`,
      [req.user.id]
    );

    const pendingPayoutResult = await query(
      `SELECT id FROM payouts WHERE creator_id = $1 AND status IN ('pending', 'processing')`,
      [req.user.id]
    );

    const availableAmount = parseFloat(availableResult.rows[0].available_amount);
    const hasPendingPayout = pendingPayoutResult.rows.length > 0;

    return res.json({
      success: true,
      data: {
        available_amount: availableAmount,
        minimum_payout: PAYOUT_MIN_AMOUNT,
        is_eligible: availableAmount >= PAYOUT_MIN_AMOUNT && !hasPendingPayout,
        has_pending_payout: hasPendingPayout,
        reason: hasPendingPayout
          ? 'A payout request is already being processed.'
          : availableAmount < PAYOUT_MIN_AMOUNT
          ? `Minimum payout amount is ₹${PAYOUT_MIN_AMOUNT}. You have ₹${availableAmount} available.`
          : null,
      },
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/payouts/request
 * Creator requests a payout of all AVAILABLE earnings.
 * Maps to: "Request Payout" button on Payouts screen.
 */
async function requestPayout(req, res, next) {
  try {
    // 1. Validate eligibility
    const availableResult = await query(
      `SELECT id, amount FROM earnings WHERE creator_id = $1 AND status = 'available'`,
      [req.user.id]
    );

    if (availableResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No available earnings to pay out.' });
    }

    const totalAmount = availableResult.rows.reduce((sum, r) => sum + parseFloat(r.amount), 0);

    if (totalAmount < PAYOUT_MIN_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout is ₹${PAYOUT_MIN_AMOUNT}. You have ₹${totalAmount.toFixed(2)} available.`,
      });
    }

    // 2. No existing pending/processing payout
    const existingPayout = await query(
      `SELECT id FROM payouts WHERE creator_id = $1 AND status IN ('pending', 'processing')`,
      [req.user.id]
    );
    if (existingPayout.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'A payout is already being processed.' });
    }

    // 3. Fetch payout method from creator profile
    const profileResult = await query(
      `SELECT payout_method, bank_account, bank_ifsc, upi_id FROM creator_profiles WHERE user_id = $1`,
      [req.user.id]
    );
    if (profileResult.rows.length === 0 || !profileResult.rows[0].payout_method) {
      return res.status(400).json({ success: false, message: 'Please set up your payout method in Settings before withdrawing.' });
    }
    const profile = profileResult.rows[0];

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 4. Create payout record
      const payoutResult = await client.query(
        `INSERT INTO payouts (creator_id, amount, status, payout_method, bank_account, bank_ifsc, upi_id)
         VALUES ($1, $2, 'pending', $3, $4, $5, $6)
         RETURNING id, amount, status, requested_at`,
        [req.user.id, totalAmount, profile.payout_method,
         profile.bank_account || null, profile.bank_ifsc || null, profile.upi_id || null]
      );
      const payout = payoutResult.rows[0];

      // 5. Mark all eligible earnings as PAID, link to this payout
      const earningIds = availableResult.rows.map((r) => r.id);
      await client.query(
        `UPDATE earnings
         SET status = 'paid', payout_id = $1, paid_at = NOW(), updated_at = NOW()
         WHERE id = ANY($2::uuid[])`,
        [payout.id, earningIds]
      );

      // 6. Update creator profile balances
      await client.query(
        `UPDATE creator_profiles
         SET total_paid = total_paid + $1,
             pending_payout = GREATEST(0, pending_payout - $1)
         WHERE user_id = $2`,
        [totalAmount, req.user.id]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        message: 'Payout request submitted. Payment will be processed within 24-48 hours.',
        data: { ...payout, earnings_count: earningIds.length },
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
 * GET /api/payouts/creator
 * Creator's payout history.
 * Maps to: "Payouts" screen payout history table.
 */
async function getCreatorPayouts(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = `
      SELECT p.id, p.amount, p.status, p.payout_method, p.utr_number,
             p.requested_at, p.paid_at, p.admin_notes
      FROM payouts p
      WHERE p.creator_id = $1
    `;
    const params = [req.user.id];
    if (status) { params.push(status); sql += ` AND p.status = $${params.length}`; }
    sql += ` ORDER BY p.requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), offset);

    const result = await query(sql, params);

    // Summary
    const summaryResult = await query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS total_paid,
         COALESCE(SUM(amount) FILTER (WHERE status IN ('pending','processing')), 0) AS pending_amount,
         COUNT(*) AS total_payouts
       FROM payouts WHERE creator_id = $1`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: {
        summary: summaryResult.rows[0],
        payouts: result.rows,
        meta: { page: parseInt(page, 10), limit: parseInt(limit, 10) },
      },
    });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/payouts/:id/process  [Admin only]
 * Admin marks a payout as PAID with UTR number.
 * Maps to: "Admin Payout Queue"
 */
async function processPayout(req, res, next) {
  try {
    const { utr_number, admin_notes } = req.body;
    if (!utr_number) return res.status(400).json({ success: false, message: 'utr_number is required.' });

    const payoutResult = await query('SELECT * FROM payouts WHERE id = $1', [req.params.id]);
    if (payoutResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Payout not found.' });

    const payout = payoutResult.rows[0];
    if (payout.status === 'paid') return res.status(400).json({ success: false, message: 'Payout already marked as paid.' });

    await query(
      `UPDATE payouts
       SET status = 'paid', utr_number = $1, admin_id = $2, admin_notes = $3,
           paid_at = NOW(), processed_at = NOW()
       WHERE id = $4`,
      [utr_number, req.user.id, admin_notes || null, req.params.id]
    );

    return res.json({ success: true, message: 'Payout marked as PAID.', data: { utr_number } });
  } catch (err) { next(err); }
}

module.exports = { getPayoutEligibility, requestPayout, getCreatorPayouts, processPayout };
