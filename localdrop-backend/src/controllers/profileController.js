// src/controllers/profileController.js — Profile & Settings
'use strict';

const { query } = require('../db/pool');
const { enrichProfile } = require('../utils/profileEnrich');

/**
 * GET /api/profile/creator
 * GET /api/profile/business
 */
async function getProfile(req, res, next) {
  try {
    let result;
    if (req.user.role === 'creator') {
      result = await query('SELECT * FROM creator_profiles WHERE user_id = $1', [req.user.id]);
    } else if (req.user.role === 'business') {
      result = await query('SELECT * FROM business_profiles WHERE user_id = $1', [req.user.id]);
    } else {
      return res.json({ success: true, data: { role: 'admin' } });
    }
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Profile not found.' });
    
    const profileData = result.rows[0];
    profileData.is_verified = req.user.role === 'business' ? (profileData.is_verified || req.user.is_verified) : req.user.is_verified;
    
    return res.json({ success: true, data: enrichProfile(profileData, req.user.role) });
  } catch (err) { next(err); }
}

/**
 * PUT /api/profile/creator
 */
async function updateCreatorProfile(req, res, next) {
  try {
    const { name, bio, city, state, lat, lng, avatar_url } = req.body;
    const result = await query(
      `UPDATE creator_profiles
       SET name = COALESCE($1, name), bio = COALESCE($2, bio),
           city = COALESCE($3, city), state = COALESCE($4, state),
           lat  = COALESCE($5, lat),  lng  = COALESCE($6, lng),
           avatar_url = COALESCE($7, avatar_url)
       WHERE user_id = $8
       RETURNING *`,
      [name, bio, city, state, lat, lng, avatar_url, req.user.id]
    );
    return res.json({ success: true, data: enrichProfile(result.rows[0], 'creator') });
  } catch (err) { next(err); }
}

/**
 * PUT /api/profile/business
 */
async function updateBusinessProfile(req, res, next) {
  try {
    const {
      business_name, business_type, description, logo_url, cover_url,
      phone, email, address, city, state, lat, lng,
      social_instagram, social_facebook, social_whatsapp
    } = req.body;

    const result = await query(
      `UPDATE business_profiles
       SET business_name     = COALESCE($1,  business_name),
           business_type     = COALESCE($2,  business_type),
           description       = COALESCE($3,  description),
           logo_url          = COALESCE($4,  logo_url),
           cover_url         = COALESCE($5,  cover_url),
           phone             = COALESCE($6,  phone),
           email             = COALESCE($7,  email),
           address           = COALESCE($8,  address),
           city              = COALESCE($9,  city),
           state             = COALESCE($10, state),
           lat               = COALESCE($11, lat),
           lng               = COALESCE($12, lng),
           social_instagram  = COALESCE($13, social_instagram),
           social_facebook   = COALESCE($14, social_facebook),
           social_whatsapp   = COALESCE($15, social_whatsapp)
       WHERE user_id = $16
       RETURNING *`,
      [business_name, business_type, description, logo_url, cover_url,
       phone, email, address, city, state, lat, lng,
       social_instagram, social_facebook, social_whatsapp,
       req.user.id]
    );
    return res.json({ success: true, data: enrichProfile(result.rows[0], 'business') });
  } catch (err) { next(err); }
}

/**
 * PUT /api/settings/payout-method
 * Creator or business updates their payout details.
 * Maps to: Settings → Payment Details.
 */
async function updatePayoutMethod(req, res, next) {
  try {
    const { payout_method, bank_account, bank_ifsc, upi_id } = req.body;

    if (!['bank', 'upi'].includes(payout_method)) {
      return res.status(400).json({ success: false, message: 'payout_method must be "bank" or "upi".' });
    }
    if (payout_method === 'bank' && (!bank_account || !bank_ifsc)) {
      return res.status(400).json({ success: false, message: 'bank_account and bank_ifsc required for bank payout.' });
    }
    if (payout_method === 'upi' && !upi_id) {
      return res.status(400).json({ success: false, message: 'upi_id required for UPI payout.' });
    }

    const table = req.user.role === 'creator' ? 'creator_profiles' : 'business_profiles';
    await query(
      `UPDATE ${table} SET payout_method=$1, bank_account=$2, bank_ifsc=$3, upi_id=$4 WHERE user_id=$5`,
      [payout_method, bank_account || null, bank_ifsc || null, upi_id || null, req.user.id]
    );

    return res.json({ success: true, message: 'Payout method updated.' });
  } catch (err) { next(err); }
}

async function verifyUserSubmit(req, res, next) {
  try {
    await query('UPDATE users SET is_verified = true WHERE id = $1', [req.user.id]);
    if (req.user.role === 'business') {
      await query('UPDATE business_profiles SET is_verified = true WHERE user_id = $1', [req.user.id]);
    }
    return res.json({ success: true, message: 'Verification successful.' });
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateCreatorProfile, updateBusinessProfile, updatePayoutMethod, verifyUserSubmit };
