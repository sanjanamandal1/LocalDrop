// src/routes/adminRoutes.js
'use strict';

const { Router } = require('express');
const { getAllDisputes, getAllUsers, setUserStatus, getPendingPayouts, getPlatformStats } = require('../controllers/adminController');
const { resolveDispute } = require('../controllers/disputeController');
const { processPayout } = require('../controllers/payoutController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

// All admin routes require admin role
router.use(verifyToken, requireRole('admin'));

router.get('/stats',                  getPlatformStats);
router.get('/disputes',               getAllDisputes);
router.patch('/disputes/:id/resolve', resolveDispute);
router.get('/users',                  getAllUsers);
router.patch('/users/:id/status',     setUserStatus);
router.get('/payouts/pending',        getPendingPayouts);
router.patch('/payouts/:id/process',  processPayout);

module.exports = router;
