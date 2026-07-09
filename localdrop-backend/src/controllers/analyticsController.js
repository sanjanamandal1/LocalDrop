// src/controllers/analyticsController.js — Creator & Business analytics
'use strict';

const { query } = require('../db/pool');

// ──────────────────────────────────────────────────────────
// CREATOR ANALYTICS
// ──────────────────────────────────────────────────────────

/**
 * GET /api/analytics/creator/overview
 * Maps to: Creator Dashboard overview cards + Campaign Performance screen.
 */
async function creatorOverview(req, res, next) {
  try {
    const { from, to } = req.query;
    const params = [req.user.id];
    let dateCond = '';
    if (from) { params.push(from); dateCond += ` AND r.confirmed_at >= $${params.length}`; }
    if (to)   { params.push(to);   dateCond += ` AND r.confirmed_at <= $${params.length}`; }

    const result = await query(
      `SELECT
         COUNT(DISTINCT qr.id)             AS total_campaigns_joined,
         COALESCE(SUM(qr.scan_count), 0)  AS total_qr_views,
         COALESCE(SUM(qr.claim_count), 0) AS total_claims,
         COUNT(r.id)                       AS total_redemptions,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status != 'reversed'), 0) AS total_earnings,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'pending'), 0)   AS pending_earnings,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'available'), 0) AS available_earnings,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'paid'), 0)      AS paid_earnings,
         ROUND(
           COUNT(r.id) * 100.0 / NULLIF(SUM(qr.claim_count), 0), 1
         ) AS conversion_rate,
         COALESCE(AVG(e.amount), 0) AS avg_earning_per_redemption
       FROM campaign_creators cc
       JOIN qr_codes qr ON qr.campaign_id = cc.campaign_id AND qr.creator_id = cc.creator_id
       LEFT JOIN redemptions r ON r.qr_id = qr.id AND r.status = 'confirmed' ${dateCond}
       LEFT JOIN earnings e ON e.redemption_id = r.id
       WHERE cc.creator_id = $1`,
      params
    );

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

/**
 * GET /api/analytics/creator/campaigns
 * Per-campaign funnel stats for Campaign Performance screen.
 */
async function creatorCampaignStats(req, res, next) {
  try {
    const result = await query(
      `SELECT
         c.id AS campaign_id, c.name, c.offer_details, c.status,
         bp.business_name,
         qr.scan_count AS qr_views, qr.claim_count AS claims,
         COUNT(r.id)    AS redemptions,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status != 'reversed'), 0) AS earnings,
         ROUND(COUNT(r.id) * 100.0 / NULLIF(qr.claim_count, 0), 1)        AS conversion_rate,
         COALESCE(AVG(e.amount), 0)                                         AS avg_per_redemption
       FROM campaign_creators cc
       JOIN campaigns c         ON c.id   = cc.campaign_id
       JOIN business_profiles bp ON bp.user_id = c.business_id
       JOIN qr_codes qr          ON qr.campaign_id = cc.campaign_id AND qr.creator_id = $1
       LEFT JOIN redemptions r   ON r.qr_id = qr.id AND r.status = 'confirmed'
       LEFT JOIN earnings e      ON e.redemption_id = r.id
       WHERE cc.creator_id = $1
       GROUP BY c.id, c.name, c.offer_details, c.status, bp.business_name,
                qr.scan_count, qr.claim_count
       ORDER BY earnings DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

/**
 * GET /api/analytics/creator/heatmap
 * Returns geo-points of redemptions for the Audience Heatmap.
 */
async function creatorHeatmap(req, res, next) {
  try {
    const result = await query(
      `SELECT r.confirm_lat AS lat, r.confirm_lng AS lng, COUNT(*) AS weight
       FROM redemptions r
       JOIN qr_codes qr ON qr.id = r.qr_id
       WHERE qr.creator_id = $1 AND r.status = 'confirmed'
         AND r.confirm_lat IS NOT NULL AND r.confirm_lng IS NOT NULL
       GROUP BY r.confirm_lat, r.confirm_lng`,
      [req.user.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

// ──────────────────────────────────────────────────────────
// BUSINESS ANALYTICS
// ──────────────────────────────────────────────────────────

/**
 * GET /api/analytics/business/overview
 * Maps to: Business Dashboard top cards.
 */
async function businessOverview(req, res, next) {
  try {
    const result = await query(
      `SELECT
         COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_campaigns,
         COUNT(DISTINCT c.id)                                      AS total_campaigns,
         COALESCE(SUM(c.total_views), 0)                           AS total_views,
         COALESCE(SUM(c.total_claims), 0)                          AS total_claims,
         COALESCE(SUM(c.total_redemptions), 0)                     AS total_redemptions,
         COALESCE(SUM(c.total_revenue), 0)                         AS total_revenue,
         ROUND(SUM(c.total_redemptions) * 100.0 / NULLIF(SUM(c.total_claims), 0), 1) AS conversion_rate,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status IN ('pending','available')), 0) AS pending_payouts
       FROM campaigns c
       LEFT JOIN earnings e ON e.campaign_id = c.id
       WHERE c.business_id = $1`,
      [req.user.id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

/**
 * GET /api/analytics/business/campaigns
 * Per-campaign performance table in Business Analytics screen.
 */
async function businessCampaignStats(req, res, next) {
  try {
    const result = await query(
      `SELECT
         c.id, c.name, c.offer_details, c.status,
         c.total_views, c.total_claims, c.total_redemptions, c.total_revenue,
         c.spent_budget, c.total_budget,
         ROUND(c.total_redemptions * 100.0 / NULLIF(c.total_claims, 0), 1) AS conversion_rate,
         COUNT(DISTINCT cc.creator_id) AS creator_count
       FROM campaigns c
       LEFT JOIN campaign_creators cc ON cc.campaign_id = c.id
       WHERE c.business_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

/**
 * GET /api/analytics/business/redemptions
 * Redemptions feed with creator + customer info.
 * Maps to: "Business Redemptions Feed" screen.
 */
async function businessRedemptionsFeed(req, res, next) {
  try {
    const { campaign_id, from, to, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = `
      SELECT
        r.id, r.redemption_code, r.status, r.confirmed_at, r.bill_amount,
        r.commission_amount, r.geo_verified, r.geo_distance_m,
        r.customer_name, r.customer_phone,
        c.name AS campaign_name,
        cp.name AS creator_name, cp.avatar_url AS creator_avatar,
        e.status AS earning_status
      FROM redemptions r
      JOIN campaigns c ON c.id = r.campaign_id
      JOIN creator_profiles cp ON cp.user_id = r.creator_id
      JOIN earnings e ON e.redemption_id = r.id
      WHERE c.business_id = $1 AND r.status = 'confirmed'
    `;
    const params = [req.user.id];
    if (campaign_id) { params.push(campaign_id); sql += ` AND r.campaign_id = $${params.length}`; }
    if (from) { params.push(from); sql += ` AND r.confirmed_at >= $${params.length}`; }
    if (to)   { params.push(to);   sql += ` AND r.confirmed_at <= $${params.length}`; }
    sql += ` ORDER BY r.confirmed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), offset);

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows, meta: { page: parseInt(page, 10), limit: parseInt(limit, 10) } });
  } catch (err) { next(err); }
}

/**
 * GET /api/analytics/business/timeline
 * Redemptions over time for the business chart.
 */
async function businessTimeline(req, res, next) {
  try {
    const { from, to, group = 'day' } = req.query;
    const groupMap = { day: 'day', week: 'week', month: 'month' };
    const trunc = groupMap[group] || 'day';
    const params = [req.user.id];
    let dateCond = '';
    if (from) { params.push(from); dateCond += ` AND r.confirmed_at >= $${params.length}`; }
    if (to)   { params.push(to);   dateCond += ` AND r.confirmed_at <= $${params.length}`; }

    const result = await query(
      `SELECT DATE_TRUNC('${trunc}', r.confirmed_at) AS period,
              COUNT(*) AS redemptions,
              COALESCE(SUM(r.bill_amount), 0) AS revenue,
              COALESCE(SUM(r.commission_amount), 0) AS commission
       FROM redemptions r
       JOIN campaigns c ON c.id = r.campaign_id
       WHERE c.business_id = $1 AND r.status = 'confirmed' ${dateCond}
       GROUP BY period ORDER BY period ASC`,
      params
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

/**
 * GET /api/analytics/business/cities
 * Redemptions by city for the donut chart.
 */
async function businessByCity(req, res, next) {
  try {
    const result = await query(
      `SELECT bp.city, COUNT(r.id) AS redemptions, COALESCE(SUM(r.bill_amount), 0) AS revenue
       FROM redemptions r
       JOIN campaigns c ON c.id = r.campaign_id
       JOIN creator_profiles cp ON cp.user_id = r.creator_id
       JOIN business_profiles bp ON bp.user_id = c.business_id
       WHERE c.business_id = $1 AND r.status = 'confirmed'
       GROUP BY bp.city ORDER BY redemptions DESC LIMIT 10`,
      [req.user.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

module.exports = {
  creatorOverview, creatorCampaignStats, creatorHeatmap,
  businessOverview, businessCampaignStats, businessRedemptionsFeed,
  businessTimeline, businessByCity,
};
