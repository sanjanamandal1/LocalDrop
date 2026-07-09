// src/routes/qrRoutes.js
'use strict';

const { Router } = require('express');
const { getCreatorQR, scanQR, claimOffer, confirmRedemption, confirmRedemptionManual } = require('../controllers/qrController');
const { verifyToken, requireRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = Router();

// Stricter rate limit for QR redemption (prevent brute-force)
const redeemLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { success: false, message: 'Too many redemption attempts.' } });

// Creator fetches their QR code for a campaign
router.get('/campaign/:campaignId', verifyToken, requireRole('creator'), getCreatorQR);

// Public: customer scans QR → gets campaign info
router.get('/scan/:qrToken', scanQR);

// Public: customer claims offer (creates redemption)
router.post('/claim', claimOffer);

// Business confirms redemption (scanned QR at counter)
router.post('/redeem', verifyToken, requireRole('business'), redeemLimiter, confirmRedemption);

// Business manually enters redemption code
router.post('/redeem/manual', verifyToken, requireRole('business'), redeemLimiter, confirmRedemptionManual);

module.exports = router;
