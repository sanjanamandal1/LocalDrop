// src/routes/profileRoutes.js
'use strict';

const { Router } = require('express');
const { getProfile, updateCreatorProfile, updateBusinessProfile, verifyUserSubmit } = require('../controllers/profileController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

// Profile
router.get('/creator',             verifyToken, requireRole('creator'),           getProfile);
router.put('/creator',             verifyToken, requireRole('creator'),           updateCreatorProfile);
router.get('/business',            verifyToken, requireRole('business'),          getProfile);
router.put('/business',            verifyToken, requireRole('business'),          updateBusinessProfile);
router.post('/verify',             verifyToken, requireRole('creator', 'business'), verifyUserSubmit);

module.exports = router;
