// src/controllers/earningsController.js — Earnings lifecycle & queries
'use strict';

const { query } = require('../db/pool');
const { getEarningByRedemptionId } = require('../services/earningsService');

/**
 * GET /api/earnings/creator
 * Creator's earnings summary + breakdown.
 * Maps to: "Earnings" screen.
 */
async function getCreatorEarnings(req, res, next) {
  try {
    const { status, campaign_id, from, to, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Summary totals
    const summaryResult = await query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE status = 'pending'),   0) AS pending_amount,
         COALESCE(SUM(amount) FILTER (WHERE status = 'available'), 0) AS available_amount,
         COALESCE(SUM(amount) FILTER (WHERE status = 'paid'),      0) AS paid_amount,
         COALESCE(SUM(amount) FILTER (WHERE status NOT IN ('reversed')), 0) AS total_earned,
         COUNT(*) FILTER (WHERE status = 'pending')   AS pending_count,
         COUNT(*) FILTER (WHERE status = 'available') AS available_count,
         COUNT(*) FILTER (WHERE status = 'paid')      AS paid_count
       FROM earnings
       WHERE creator_id = $1`,
      [req.user.id]
    );

    // Detailed list with filters
    let sql = `
      SELECT e.id, e.amount, e.status, e.created_at, e.available_at, e.paid_at,
             c.name AS campaign_name, c.offer_details,
             bp.business_name,
             r.redemption_code, r.confirmed_at
      FROM earnings e
      JOIN campaigns c ON c.id = e.campaign_id
      JOIN business_profiles bp ON bp.user_id = c.business_id
      JOIN redemptions r ON r.id = e.redemption_id
      WHERE e.creator_id = $1
    `;
    const params = [req.user.id];

    if (status) { params.push(status); sql += ` AND e.status = $${params.length}`; }
    if (campaign_id) { params.push(campaign_id); sql += ` AND e.campaign_id = $${params.length}`; }
    if (from) { params.push(from); sql += ` AND e.created_at >= $${params.length}`; }
    if (to)   { params.push(to);   sql += ` AND e.created_at <= $${params.length}`; }

    sql += ` ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), offset);

    const listResult = await query(sql, params);

    return res.json({
      success: true,
      data: {
        summary: summaryResult.rows[0],
        earnings: listResult.rows,
        meta: { page: parseInt(page, 10), limit: parseInt(limit, 10) },
      },
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/earnings/creator/timeline
 * Earnings grouped by day for the chart.
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&group=day|week|month
 */
async function getEarningsTimeline(req, res, next) {
  try {
    const { from, to, group = 'day' } = req.query;
    const groupMap = { day: 'day', week: 'week', month: 'month' };
    const trunc = groupMap[group] || 'day';

    const params = [req.user.id];
    let dateCond = '';
    if (from) { params.push(from); dateCond += ` AND e.created_at >= $${params.length}`; }
    if (to)   { params.push(to);   dateCond += ` AND e.created_at <= $${params.length}`; }

    const result = await query(
      `SELECT
         DATE_TRUNC('${trunc}', e.created_at) AS period,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status != 'reversed'), 0) AS amount,
         COUNT(*) AS redemptions
       FROM earnings e
       WHERE e.creator_id = $1 ${dateCond}
       GROUP BY period
       ORDER BY period ASC`,
      params
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

/**
 * GET /api/earnings/creator/by-campaign
 * Earnings grouped per campaign for the "Earnings by Campaign" table.
 */
async function getEarningsByCampaign(req, res, next) {
  try {
    const result = await query(
      `SELECT
         c.id AS campaign_id, c.name AS campaign_name, c.offer_details,
         bp.business_name,
         COUNT(e.id)                                       AS redemptions,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status != 'reversed'), 0) AS total_earnings,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'paid'), 0)      AS paid_earnings,
         COALESCE(AVG(e.amount), 0)                         AS avg_per_redemption
       FROM earnings e
       JOIN campaigns c ON c.id = e.campaign_id
       JOIN business_profiles bp ON bp.user_id = c.business_id
       WHERE e.creator_id = $1
       GROUP BY c.id, c.name, c.offer_details, bp.business_name
       ORDER BY total_earnings DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

/**
 * GET /api/earnings/business
 * Business sees total earnings paid to all creators for their campaigns.
 */
async function getBusinessEarnings(req, res, next) {
  try {
    const result = await query(
      `SELECT
         COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'paid'), 0)      AS total_paid_out,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'pending'), 0)   AS pending_amount,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'available'), 0) AS available_amount,
         COUNT(e.id) AS total_redemptions,
         COUNT(DISTINCT e.creator_id) AS unique_creators,
         COALESCE(AVG(e.amount), 0) AS avg_per_redemption,
         (SELECT COUNT(*) * 100.0 / NULLIF(SUM(total_claims), 0)
          FROM campaigns WHERE business_id = $1) AS conversion_rate
       FROM earnings e
       JOIN campaigns c ON c.id = e.campaign_id
       WHERE c.business_id = $1`,
      [req.user.id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

/**
 * GET /api/earnings/:redemptionId
 */
async function getEarningByRedemption(req, res, next) {
  try {
    const earning = await getEarningByRedemptionId(req.params.redemptionId, req.user.id);
    if (!earning) {
      return res.status(404).json({ success: false, message: 'Earning not found for this redemption.' });
    }
    return res.json({ success: true, data: earning });
  } catch (err) { next(err); }
}

module.exports = {
  getCreatorEarnings,
  getEarningsTimeline,
  getEarningsByCampaign,
  getBusinessEarnings,
  getEarningByRedemption,
};
