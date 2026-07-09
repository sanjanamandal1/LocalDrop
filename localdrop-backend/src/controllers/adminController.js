// src/controllers/adminController.js — Admin-only endpoints
'use strict';

const { query } = require('../db/pool');

/**
 * GET /api/admin/disputes
 * All disputes (filterable by status).
 * Maps to: Admin Dispute Panel screen.
 */
async function getAllDisputes(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let sql = `
      SELECT d.id, d.status, d.reason, d.filed_at, d.resolved_at, d.evidence_urls,
             d.admin_notes,
             r.redemption_code, r.confirmed_at, r.commission_amount,
             c.name AS campaign_name,
             bp.business_name,
             cp.name AS creator_name,
             e.amount AS earning_amount
      FROM disputes d
      JOIN redemptions r ON r.id = d.redemption_id
      JOIN campaigns c ON c.id = r.campaign_id
      JOIN business_profiles bp ON bp.user_id = d.business_id
      JOIN creator_profiles cp ON cp.user_id = r.creator_id
      JOIN earnings e ON e.id = d.earning_id
    `;
    const params = [];
    if (status) { params.push(status); sql += ` WHERE d.status = $${params.length}`; }
    sql += ` ORDER BY d.filed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), offset);

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows, meta: { page: parseInt(page, 10), limit: parseInt(limit, 10) } });
  } catch (err) { next(err); }
}

/**
 * GET /api/admin/users
 * List all users with their profiles.
 */
async function getAllUsers(req, res, next) {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let sql = `
      SELECT u.id, u.email, u.role, u.is_active, u.is_verified, u.created_at,
             COALESCE(cp.name, bp.business_name) AS display_name,
             COALESCE(cp.city, bp.city) AS city
      FROM users u
      LEFT JOIN creator_profiles cp ON cp.user_id = u.id
      LEFT JOIN business_profiles bp ON bp.user_id = u.id
    `;
    const params = [];
    if (role) { params.push(role); sql += ` WHERE u.role = $${params.length}`; }
    sql += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), offset);

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/admin/users/:id/status
 * Ban or re-activate a user.
 */
async function setUserStatus(req, res, next) {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'is_active must be a boolean.' });
    }
    const result = await query(
      `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, is_active`,
      [is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

/**
 * GET /api/admin/payouts/pending
 * All pending/processing payouts for the admin payout queue.
 */
async function getPendingPayouts(req, res, next) {
  try {
    const result = await query(
      `SELECT p.id, p.amount, p.status, p.payout_method,
              p.bank_account, p.bank_ifsc, p.upi_id, p.requested_at,
              cp.name AS creator_name, u.email AS creator_email
       FROM payouts p
       JOIN users u ON u.id = p.creator_id
       JOIN creator_profiles cp ON cp.user_id = p.creator_id
       WHERE p.status IN ('pending', 'processing')
       ORDER BY p.requested_at ASC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

/**
 * GET /api/admin/stats
 * Platform-wide stats for admin dashboard.
 */
async function getPlatformStats(req, res, next) {
  try {
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'creator') AS total_creators,
        (SELECT COUNT(*) FROM users WHERE role = 'business') AS total_businesses,
        (SELECT COUNT(*) FROM campaigns) AS total_campaigns,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'active') AS active_campaigns,
        (SELECT COUNT(*) FROM redemptions WHERE status = 'confirmed') AS total_redemptions,
        (SELECT COALESCE(SUM(amount),0) FROM earnings WHERE status != 'reversed') AS total_earnings_platform,
        (SELECT COALESCE(SUM(amount),0) FROM payouts WHERE status = 'paid') AS total_paid_out,
        (SELECT COUNT(*) FROM disputes WHERE status = 'open') AS open_disputes
    `);
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

module.exports = { getAllDisputes, getAllUsers, setUserStatus, getPendingPayouts, getPlatformStats };
