// src/services/earningsService.js — Earnings lifecycle helpers
'use strict';

const { query } = require('../db/pool');

/**
 * Lifecycle: pending → (48h, no dispute) → available → (payout requested) → paid
 *          pending → (dispute filed) → disputed → (admin reverses) → reversed
 */
async function getCreatorEarningsSummary(creatorId) {
  const result = await query(
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
    [creatorId]
  );
  return result.rows[0];
}

async function getEarningByRedemptionId(redemptionId, creatorId) {
  const result = await query(
    `SELECT e.*, c.name AS campaign_name, r.redemption_code, r.confirmed_at
     FROM earnings e
     JOIN campaigns c ON c.id = e.campaign_id
     JOIN redemptions r ON r.id = e.redemption_id
     WHERE e.redemption_id = $1 AND e.creator_id = $2`,
    [redemptionId, creatorId]
  );
  return result.rows[0] || null;
}

async function maturePendingEarnings() {
  return query(
    `UPDATE earnings SET status = 'available', updated_at = NOW()
     WHERE status = 'pending'
       AND created_at <= NOW() - INTERVAL '48 hours'
       AND redemption_id NOT IN (
         SELECT redemption_id FROM disputes WHERE status != 'rejected'
       )
     RETURNING id, creator_id, amount`
  );
}

module.exports = {
  getCreatorEarningsSummary,
  getEarningByRedemptionId,
  maturePendingEarnings,
};
