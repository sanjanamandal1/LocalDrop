// src/routes/analyticsRoutes.js
'use strict';

const { Router } = require('express');
const {
  creatorOverview, creatorCampaignStats, creatorHeatmap,
  businessOverview, businessCampaignStats, businessRedemptionsFeed,
  businessTimeline, businessByCity,
} = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

// Creator analytics
router.get('/creator/overview',            verifyToken, requireRole('creator'),  creatorOverview);
router.get('/creator/campaigns',           verifyToken, requireRole('creator'),  creatorCampaignStats);
router.get('/creator/heatmap',             verifyToken, requireRole('creator'),  creatorHeatmap);

// Business analytics
router.get('/business/overview',           verifyToken, requireRole('business'), businessOverview);
router.get('/business/campaigns',          verifyToken, requireRole('business'), businessCampaignStats);
router.get('/business/redemptions',        verifyToken, requireRole('business'), businessRedemptionsFeed);
router.get('/business/timeline',           verifyToken, requireRole('business'), businessTimeline);
router.get('/business/cities',             verifyToken, requireRole('business'), businessByCity);

module.exports = router;
