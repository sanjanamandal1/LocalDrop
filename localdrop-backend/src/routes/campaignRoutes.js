// src/routes/campaignRoutes.js
'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const {
  createCampaign, getNearbyCampaigns, getCampaignById,
  updateCampaign, updateCampaignStatus, joinCampaign,
  getBusinessCampaigns, getCreatorCampaigns, getCreatorMatches, getCreatorsList,
  createAndJoinMatchCampaign
} = require('../controllers/campaignController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { profilePhotoUpload } = require('../middleware/upload');

const router = Router();

router.post(
  '/upload-image',
  verifyToken,
  requireRole('business'),
  profilePhotoUpload.single('photo'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }
    const relativeUrl = `/uploads/profile-photos/${req.file.filename}`;
    return res.json({ success: true, data: { image_url: relativeUrl } });
  }
);

// Creator creates/joins campaign from match map
router.post('/match-create', verifyToken, requireRole('creator'), createAndJoinMatchCampaign);

// Business creates campaign
router.post(
  '/',
  verifyToken, requireRole('business'),
  [
    body('name').trim().notEmpty(),
    body('offer_details').trim().notEmpty(),
    body('campaign_type').isIn(['discount', 'bogo', 'freebie', 'cashback', 'other']),
    body('commission_type').isIn(['fixed', 'percentage']),
    body('commission_value').isFloat({ min: 0 }),
    body('total_budget').isFloat({ min: 100 }),
    body('lat').isFloat(),
    body('lng').isFloat(),
    body('valid_from').isDate(),
    body('valid_till').isDate(),
  ],
  createCampaign
);

// Business views their campaigns
router.get('/business/mine', verifyToken, requireRole('business'), getBusinessCampaigns);

// Creator views joined campaigns
router.get('/creator/mine', verifyToken, requireRole('creator'), getCreatorCampaigns);

// Creator discovers nearby campaigns
router.get('/nearby', verifyToken, requireRole('creator'), getNearbyCampaigns);

// Creator gets AI-based business matches
router.get('/matches', verifyToken, requireRole('creator'), getCreatorMatches);

// Get list of creators and clusters (for demo selector)
router.get('/creators', verifyToken, getCreatorsList);

// Single campaign (any authenticated user)
router.get('/:id', verifyToken, getCampaignById);

// Business updates campaign
router.put('/:id', verifyToken, requireRole('business'), updateCampaign);

// Business changes status
router.patch('/:id/status', verifyToken, requireRole('business'), updateCampaignStatus);

// Creator joins campaign
router.post('/:id/join', verifyToken, requireRole('creator'), joinCampaign);

module.exports = router;
