// src/jobs/earningsMaturingJob.js — 48h PENDING → AVAILABLE cron job
'use strict';

const cron = require('node-cron');
const { query } = require('../db/pool');
const logger = require('../utils/logger');

/**
 * Move PENDING earnings to AVAILABLE after 48 hours if no dispute exists.
 * Runs every 15 minutes.
 */
async function matureEarnings() {
  try {
    const result = await query(
      `WITH eligible AS (
         SELECT e.id
         FROM earnings e
         WHERE e.status = 'pending'
           AND e.available_at <= NOW()
           AND NOT EXISTS (
             SELECT 1 FROM disputes d
             WHERE d.redemption_id = e.redemption_id
               AND d.status IN ('open', 'under_review', 'approved')
           )
       )
       UPDATE earnings e
       SET status = 'available', updated_at = NOW()
       FROM eligible
       WHERE e.id = eligible.id
       RETURNING e.id, e.creator_id, e.amount`
    );

    if (result.rows.length > 0) {
      logger.info(`[EarningsMaturingJob] Matured ${result.rows.length} earning(s) to AVAILABLE`);

      // Update creator pending_payout → subtract matured amounts per creator
      // Group by creator
      const byCreator = result.rows.reduce((acc, row) => {
        acc[row.creator_id] = (acc[row.creator_id] || 0) + parseFloat(row.amount);
        return acc;
      }, {});

      await Promise.all(
        Object.entries(byCreator).map(([creatorId, amount]) =>
          query(
            `UPDATE creator_profiles
             SET pending_payout = GREATEST(0, pending_payout - $1)
             WHERE user_id = $2`,
            [amount, creatorId]
          )
        )
      );
    }
  } catch (err) {
    logger.error('[EarningsMaturingJob] Error:', err.message);
  }
}

function startEarningsMaturingJob() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', matureEarnings, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });
  logger.info('[EarningsMaturingJob] Scheduled to run every 15 minutes');

  // Run immediately on startup to catch any that were missed
  matureEarnings();
}

module.exports = { startEarningsMaturingJob, matureEarnings };
