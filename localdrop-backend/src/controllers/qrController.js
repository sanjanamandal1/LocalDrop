// src/controllers/qrController.js — QR fetch, claim, and redemption flow
'use strict';

const { query, getClient } = require('../db/pool');
const { getOrCreateQR, buildRedemptionPayload, incrementScanCount, incrementClaimCount, generateQRDataUrl } = require('../services/qrService');
const { verifyPayload, generateRedemptionCode } = require('../utils/cryptoUtils');
const { isWithinRadius, haversineDistanceMeters } = require('../utils/geoUtils');
const { createError } = require('../middleware/errorHandler');

const DISPUTE_WINDOW_HOURS = parseInt(process.env.DISPUTE_WINDOW_HOURS, 10) || 48;
const EARNINGS_HOLD_HOURS  = parseInt(process.env.EARNINGS_HOLD_HOURS, 10) || 48;

/**
 * GET /api/qr/:campaignId
 * Creator fetches their unique QR for a campaign.
 * Maps to: "My Campaign QR" screen
 */
async function getCreatorQR(req, res, next) {
  try {
    const qr = await getOrCreateQR(req.params.campaignId, req.user.id);
    return res.json({ success: true, data: qr });
  } catch (err) {
    if (err.message.includes('join the campaign')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * GET /api/qr/scan/:qrToken  (PUBLIC — no auth)
 * Called when customer camera scans the QR code.
 * Returns campaign info for the landing page.
 * Maps to: "QR Landing Page" screen.
 */
async function scanQR(req, res, next) {
  try {
    const { qrToken } = req.params;

    const result = await query(
      `SELECT qr.id AS qr_id, qr.campaign_id, qr.creator_id,
              c.name, c.offer_details, c.campaign_type, c.image_url,
              c.valid_till, c.status,
              bp.business_name, bp.logo_url, bp.city,
              cp.name AS creator_name, cp.avatar_url AS creator_avatar
       FROM qr_codes qr
       JOIN campaigns c ON c.id = qr.campaign_id
       JOIN business_profiles bp ON bp.user_id = c.business_id
       JOIN creator_profiles cp ON cp.user_id = qr.creator_id
       WHERE qr.qr_token = $1`,
      [qrToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired QR code.' });
    }

    const row = result.rows[0];

    if (row.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This campaign is no longer active.' });
    }
    if (new Date(row.valid_till) < new Date()) {
      return res.status(400).json({ success: false, message: 'This campaign has expired.' });
    }

    // Increment scan counter (fire and forget)
    incrementScanCount(row.qr_id).catch(() => {});
    await query('UPDATE campaigns SET total_views = total_views + 1 WHERE id = $1', [row.campaign_id]);

    return res.json({
      success: true,
      data: {
        qr_id: row.qr_id,
        campaign_id: row.campaign_id,
        campaign_name: row.name,
        offer_details: row.offer_details,
        campaign_type: row.campaign_type,
        image_url: row.image_url,
        valid_till: row.valid_till,
        business_name: row.business_name,
        business_logo: row.logo_url,
        city: row.city,
        creator_name: row.creator_name,
        creator_avatar: row.creator_avatar,
      },
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/qr/claim  (PUBLIC — no auth needed, customer claims the offer)
 * Body: { qr_token, customer_name?, customer_phone?, claim_lat?, claim_lng? }
 * Maps to: "Claim Offer" button on landing page.
 */
async function claimOffer(req, res, next) {
  try {
    const { qr_token, customer_name, customer_phone, claim_lat, claim_lng, device_fingerprint } = req.body;
    if (!qr_token) return res.status(400).json({ success: false, message: 'qr_token is required.' });

    const qrResult = await query(
      `SELECT qr.id AS qr_id, qr.campaign_id, qr.creator_id,
              c.name, c.offer_details, c.status AS campaign_status,
              c.valid_till, c.commission_type, c.commission_value,
              c.lat AS camp_lat, c.lng AS camp_lng
       FROM qr_codes qr
       JOIN campaigns c ON c.id = qr.campaign_id
       WHERE qr.qr_token = $1`,
      [qr_token]
    );

    if (qrResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid QR code.' });
    }

    const qr = qrResult.rows[0];

    if (qr.campaign_status !== 'active') {
      return res.status(400).json({ success: false, message: 'Campaign is not active.' });
    }
    if (new Date(qr.valid_till) < new Date()) {
      return res.status(400).json({ success: false, message: 'Campaign has expired.' });
    }

    const claimAccuracy = req.body.claim_accuracy || req.body.accuracy_meters || null;

    // Create redemption record (status = 'claimed')
    const redemptionCode = generateRedemptionCode();

    const redResult = await query(
      `INSERT INTO redemptions
         (redemption_code, campaign_id, creator_id, qr_id,
          customer_name, customer_phone, device_fingerprint, claim_lat, claim_lng, claim_accuracy, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'claimed')
       RETURNING id, redemption_code, claimed_at`,
      [redemptionCode, qr.campaign_id, qr.creator_id, qr.qr_id,
       customer_name || null, customer_phone || null, device_fingerprint || null,
       claim_lat || null, claim_lng || null, claimAccuracy]
    );

    const redemption = redResult.rows[0];

    // Increment claim counters (fire and forget)
    incrementClaimCount(qr.qr_id).catch(() => {});
    query('UPDATE campaigns SET total_claims = total_claims + 1 WHERE id = $1', [qr.campaign_id]).catch(() => {});

    // Build a signed payload for the "Show at store" QR
    const payload = buildRedemptionPayload(redemption.id, redemptionCode, qr.campaign_id);
    const redemptionQrDataUrl = await generateQRDataUrl(
      `${process.env.FRONTEND_URL || 'https://localdrop.com'}/redeem/${redemption.id}`
    );

    return res.status(201).json({
      success: true,
      message: 'Offer claimed! Show this QR at the store.',
      data: {
        redemption_id: redemption.id,
        redemption_code: redemption.redemption_code,
        claimed_at: redemption.claimed_at,
        campaign_name: qr.name,
        offer_details: qr.offer_details,
        redemption_qr: redemptionQrDataUrl,
        signed_payload: payload,   // Business app uses this to verify
      },
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/qr/redeem
 * Business scans redemption QR at counter and confirms.
 * Body: { redemption_id, business_lat, business_lng, bill_amount? }
 * Maps to: "Business Scan & Confirm Redemption" screen.
 */
async function confirmRedemption(req, res, next) {
  try {
    const { redemption_id, business_lat, business_lng, bill_amount } = req.body;

    if (!redemption_id) return res.status(400).json({ success: false, message: 'redemption_id required.' });

    // Fetch redemption + campaign info
    const redResult = await query(
      `SELECT r.*, c.commission_type, c.commission_value, c.lat AS camp_lat, c.lng AS camp_lng,
              c.radius_km, c.business_id, c.spent_budget, c.total_budget, c.name AS campaign_name
       FROM redemptions r
       JOIN campaigns c ON c.id = r.campaign_id
       WHERE r.id = $1`,
      [redemption_id]
    );

    if (redResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Redemption not found.' });
    }

    const red = redResult.rows[0];

    // Authorization: only the campaign's business can confirm
    if (red.business_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to confirm this redemption.' });
    }

    if (red.status !== 'claimed') {
      return res.status(400).json({ success: false, message: `Redemption is already ${red.status}.` });
    }

    // ── Velocity Check (Fraud Guard) ──────────────────────────────────────────
    if (red.device_fingerprint) {
      const velocityResult = await query(
        `SELECT COUNT(*) AS count 
         FROM redemptions 
         WHERE device_fingerprint = $1 
           AND status = 'confirmed' 
           AND confirmed_at >= NOW() - INTERVAL '10 minutes'`,
        [red.device_fingerprint]
      );
      const count = parseInt(velocityResult.rows[0].count, 10);
      if (count >= 2) {
        return res.status(429).json({ 
          success: false, 
          message: 'Velocity check failed: Too many redemptions from this device. Suspicious activity flagged.' 
        });
      }
    }

    const confirmAccuracy = req.body.confirm_accuracy || req.body.accuracy_meters || null;

    // ── Geo Verification & Geofence Enforcement ──────────────────────────────
    let geoVerified = false;
    let distanceMeters = null;
    let heldForReview = false;
    let fraudScore = 0.05;

    if (business_lat && business_lng) {
      distanceMeters = haversineDistanceMeters(
        parseFloat(business_lat), parseFloat(business_lng),
        parseFloat(red.camp_lat), parseFloat(red.camp_lng)
      );
      
      const accuracyOffset = confirmAccuracy ? parseFloat(confirmAccuracy) : 0;
      if (accuracyOffset > 100) {
        fraudScore += 0.10; // penalty nudge for low confidence
      }

      // Auto-widen geofence boundary slightly for low confidence/high drift
      const primaryBoundary = 200 + Math.min(150, accuracyOffset);
      const secondaryBoundary = 500 + Math.max(0, accuracyOffset - 200);
      
      if (distanceMeters <= primaryBoundary) {
        geoVerified = true;
        if (accuracyOffset > 100) {
          heldForReview = true;
        }
      } else if (distanceMeters <= secondaryBoundary) {
        geoVerified = true;
        heldForReview = true;
        fraudScore = Math.min(0.95, fraudScore + 0.40);
      } else {
        return res.status(403).json({
          success: false,
          message: `Redemption rejected: Scan location is ${Math.round(distanceMeters)}m from the business coordinates (must be within geofence limit of ${Math.round(secondaryBoundary)}m including ${Math.round(accuracyOffset)}m GPS drift).`
        });
      }
    }

    // ── Commission Calculation ────────────────────────────────────────────────
    let commissionAmount;
    if (red.commission_type === 'fixed') {
      commissionAmount = parseFloat(red.commission_value);
    } else {
      // percentage of bill
      const bill = parseFloat(bill_amount) || 0;
      commissionAmount = +(bill * (red.commission_value / 100)).toFixed(2);
    }

    // Budget check
    const newSpent = parseFloat(red.spent_budget) + commissionAmount;
    if (newSpent > parseFloat(red.total_budget)) {
      return res.status(400).json({ success: false, message: 'Campaign budget exhausted.' });
    }

    const availableAt = new Date(Date.now() + EARNINGS_HOLD_HOURS * 60 * 60 * 1000);

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Confirm redemption
      await client.query(
        `UPDATE redemptions
         SET status = 'confirmed', confirmed_at = NOW(),
             confirm_lat = $1, confirm_lng = $2,
             confirm_accuracy = $3,
             geo_distance_m = $4, geo_verified = $5,
             bill_amount = $6, commission_amount = $7
         WHERE id = $8`,
        [business_lat || null, business_lng || null, confirmAccuracy, distanceMeters, geoVerified,
         bill_amount || null, commissionAmount, redemption_id]
      );

      // 2. Create PENDING earning with 48h hold
      const earnResult = await client.query(
        `INSERT INTO earnings (redemption_id, creator_id, campaign_id, amount, status, available_at)
         VALUES ($1, $2, $3, $4, 'pending', $5)
         RETURNING id, amount, status, available_at`,
        [redemption_id, red.creator_id, red.campaign_id, commissionAmount, availableAt]
      );

      // 3. Update campaign stats + spent budget
      await client.query(
        `UPDATE campaigns
         SET total_redemptions = total_redemptions + 1,
             total_revenue = total_revenue + $1,
             spent_budget = spent_budget + $2
         WHERE id = $3`,
        [bill_amount || commissionAmount, commissionAmount, red.campaign_id]
      );

      // 4. Update creator's pending_payout balance
      await client.query(
        `UPDATE creator_profiles
         SET total_earnings = total_earnings + $1,
             pending_payout = pending_payout + $1
         WHERE user_id = $2`,
        [commissionAmount, red.creator_id]
      );

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: 'Redemption confirmed!',
        data: {
          redemption_id,
          campaign_name: red.campaign_name,
          commission_amount: commissionAmount,
          earning: earnResult.rows[0],
          geo_verified: geoVerified,
          distance_meters: distanceMeters ? Math.round(distanceMeters) : null,
          held_for_review: heldForReview,
          fraud_score: fraudScore,
          available_at: availableAt,
        },
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
 * POST /api/qr/redeem/manual
 * Business enters redemption code manually (fallback).
 * Body: { redemption_code, business_lat?, business_lng?, bill_amount? }
 */
async function confirmRedemptionManual(req, res, next) {
  try {
    const { redemption_code } = req.body;
    if (!redemption_code) return res.status(400).json({ success: false, message: 'redemption_code required.' });

    const redResult = await query(
      'SELECT id FROM redemptions WHERE redemption_code = $1',
      [redemption_code.toUpperCase()]
    );
    if (redResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Redemption code not found.' });
    }

    // Delegate to confirmRedemption with the found ID
    req.body.redemption_id = redResult.rows[0].id;
    return confirmRedemption(req, res, next);
  } catch (err) { next(err); }
}

module.exports = { getCreatorQR, scanQR, claimOffer, confirmRedemption, confirmRedemptionManual };
