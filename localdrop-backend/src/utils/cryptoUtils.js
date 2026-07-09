// src/utils/cryptoUtils.js — HMAC signing for QR payloads
'use strict';

const crypto = require('crypto');

const ALGORITHM = 'sha256';

/**
 * Sign a data object with HMAC-SHA256.
 * Returns a hex signature string.
 */
function signPayload(data) {
  const secret = process.env.QR_HMAC_SECRET;
  if (!secret) throw new Error('QR_HMAC_SECRET not set in environment');
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHmac(ALGORITHM, secret).update(payload).digest('hex');
}

/**
 * Verify a payload against a given signature.
 * Uses timingSafeEqual to prevent timing attacks.
 */
function verifyPayload(data, signature) {
  const expected = signPayload(data);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically random token of given byte length.
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a short human-readable redemption code.
 * Example: "RD-7F3A91"
 */
function generateRedemptionCode() {
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RD${hex}`;
}

module.exports = { signPayload, verifyPayload, generateToken, generateRedemptionCode };
