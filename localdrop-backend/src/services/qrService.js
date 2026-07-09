// src/services/qrService.js — QR code generation + signed payload
'use strict';

const QRCode = require('qrcode');
const { signPayload } = require('../utils/cryptoUtils');
const { query } = require('../db/pool');

/**
 * Generate a base64 QR data URL for a given public link.
 */
async function generateQRDataUrl(link) {
  try {
    const dataUrl = await QRCode.toDataURL(link, {
      width: 400,
      margin: 2,
      color: { dark: '#1A1A2E', light: '#FFFFFF' },
    });
    return dataUrl;
  } catch (err) {
    throw new Error(`QR generation failed: ${err.message}`);
  }
}

/**
 * Get or create the QR code for a creator-campaign pair.
 * Returns { id, qr_token, qr_link, qr_data_url, scan_count, claim_count }
 */
async function getOrCreateQR(campaignId, creatorId) {
  let qr = await query(
    'SELECT * FROM qr_codes WHERE campaign_id = $1 AND creator_id = $2',
    [campaignId, creatorId]
  );

  if (qr.rows.length === 0) {
    throw new Error('QR not found. Creator must join the campaign first.');
  }

  const qrRow = qr.rows[0];

  // Regenerate QR image if not cached
  if (!qrRow.qr_data_url) {
    const dataUrl = await generateQRDataUrl(qrRow.qr_link);
    await query(
      'UPDATE qr_codes SET qr_data_url = $1 WHERE id = $2',
      [dataUrl, qrRow.id]
    );
    qrRow.qr_data_url = dataUrl;
  }

  return qrRow;
}

/**
 * Build a signed redemption payload for the business to verify.
 * This is embedded in the "Redemption QR" shown to the customer after claiming.
 */
function buildRedemptionPayload(redemptionId, redemptionCode, campaignId) {
  const data = { redemptionId, redemptionCode, campaignId, ts: Date.now() };
  const sig = signPayload(JSON.stringify(data));
  return { ...data, sig };
}

/**
 * Increment QR scan counter.
 */
async function incrementScanCount(qrId) {
  await query('UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1', [qrId]);
}

/**
 * Increment QR claim counter.
 */
async function incrementClaimCount(qrId) {
  await query('UPDATE qr_codes SET claim_count = claim_count + 1 WHERE id = $1', [qrId]);
}

module.exports = { getOrCreateQR, generateQRDataUrl, buildRedemptionPayload, incrementScanCount, incrementClaimCount };
