// src/routes/userRoutes.js
'use strict';

const { Router } = require('express');
const { uploadProfilePhoto, uploadCoverPhoto } = require('../controllers/userPhotoController');
const { profilePhotoUpload } = require('../middleware/upload');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.post(
  '/:id/profile-photo',
  verifyToken,
  profilePhotoUpload.single('photo'),
  uploadProfilePhoto
);

router.post(
  '/:id/cover-photo',
  verifyToken,
  profilePhotoUpload.single('photo'),
  uploadCoverPhoto
);

module.exports = router;
