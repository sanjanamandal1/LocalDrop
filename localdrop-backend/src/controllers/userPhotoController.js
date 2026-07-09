// src/controllers/userPhotoController.js — Profile photo upload
'use strict';

const { query } = require('../db/pool');
const { enrichProfile } = require('../utils/profileEnrich');

/**
 * POST /api/users/:id/profile-photo
 * multipart/form-data field: photo
 */
async function uploadProfilePhoto(req, res, next) {
  try {
    const userId = req.params.id;

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile photo.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo file provided. Use field name "photo".' });
    }

    const relativeUrl = `/uploads/profile-photos/${req.file.filename}`;

    let result;
    if (req.user.role === 'creator') {
      result = await query(
        `UPDATE creator_profiles
         SET profile_photo_url = $1::varchar, avatar_url = COALESCE(avatar_url, $1::text)
         WHERE user_id = $2
         RETURNING *`,
        [relativeUrl, userId]
      );
    } else if (req.user.role === 'business') {
      result = await query(
        `UPDATE business_profiles
         SET profile_photo_url = $1::varchar, logo_url = COALESCE(logo_url, $1::text)
         WHERE user_id = $2
         RETURNING *`,
        [relativeUrl, userId]
      );
    } else {
      return res.status(400).json({ success: false, message: 'Profile photo upload not supported for this role.' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    return res.json({
      success: true,
      message: 'Profile photo uploaded.',
      data: enrichProfile(result.rows[0], req.user.role),
    });
  } catch (err) {
    if (err.message && err.message.includes('Only JPG')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    }
    next(err);
  }
}

async function uploadCoverPhoto(req, res, next) {
  try {
    const userId = req.params.id;

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this cover photo.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No cover file provided. Use field name "photo".' });
    }

    const relativeUrl = `/uploads/profile-photos/${req.file.filename}`;

    let result;
    if (req.user.role === 'business') {
      result = await query(
        `UPDATE business_profiles
         SET cover_url = $1
         WHERE user_id = $2
         RETURNING *`,
        [relativeUrl, userId]
      );
    } else {
      return res.status(400).json({ success: false, message: 'Cover photo upload not supported for this role.' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    return res.json({
      success: true,
      message: 'Cover photo uploaded.',
      data: enrichProfile(result.rows[0], req.user.role),
    });
  } catch (err) {
    if (err.message && err.message.includes('Only JPG')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    }
    next(err);
  }
}

module.exports = { uploadProfilePhoto, uploadCoverPhoto };
