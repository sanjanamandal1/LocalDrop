// src/routes/settingsRoutes.js
'use strict';

const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getSettings,
  updateNotifications,
  updatePrivacy,
  updateCreatorPreferences,
  updateCampaignPreferences,
  updateConnectedApps,
  updateTeamMembers,
  updateApiSettings,
  changePassword,
  getNotifications,
  markNotificationRead,
  clearNotifications,
} = require('../controllers/settingsController');
const { updatePayoutMethod } = require('../controllers/profileController');

const router = Router();

router.use(verifyToken);

router.get('/', getSettings);
router.put('/notifications', updateNotifications);
router.put('/privacy', updatePrivacy);
router.put('/creator-preferences', updateCreatorPreferences);
router.put('/campaign-preferences', updateCampaignPreferences);
router.put('/connected-apps', updateConnectedApps);
router.put('/team-members', updateTeamMembers);
router.put('/api', updateApiSettings);
router.put('/password', changePassword);
router.put('/payout-method', requireRole('creator', 'business'), updatePayoutMethod);

router.get('/notifications/feed', getNotifications);
router.patch('/notifications/feed/:id/read', markNotificationRead);
router.delete('/notifications/feed', clearNotifications);

module.exports = router;
