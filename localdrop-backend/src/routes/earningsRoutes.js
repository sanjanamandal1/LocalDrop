// src/routes/earningsRoutes.js
'use strict';

const { Router } = require('express');
const { getCreatorEarnings, getEarningsTimeline, getEarningsByCampaign, getBusinessEarnings, getEarningByRedemption } = require('../controllers/earningsController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/creator',             verifyToken, requireRole('creator'),  getCreatorEarnings);
router.get('/creator/timeline',    verifyToken, requireRole('creator'),  getEarningsTimeline);
router.get('/creator/by-campaign', verifyToken, requireRole('creator'),  getEarningsByCampaign);
router.get('/business',            verifyToken, requireRole('business'), getBusinessEarnings);
router.get('/:redemptionId',       verifyToken, requireRole('creator'),  getEarningByRedemption);

module.exports = router;
