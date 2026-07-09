// src/routes/payoutRoutes.js
'use strict';

const { Router } = require('express');
const { getPayoutEligibility, requestPayout, getCreatorPayouts, processPayout } = require('../controllers/payoutController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/eligibility', verifyToken, requireRole('creator'), getPayoutEligibility);
router.post('/request',    verifyToken, requireRole('creator'), requestPayout);
router.get('/creator',     verifyToken, requireRole('creator'), getCreatorPayouts);
router.patch('/:id/process', verifyToken, requireRole('admin'), processPayout);

module.exports = router;
