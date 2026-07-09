// src/controllers/authController.js — Register, Login, Refresh, Logout
'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { query, getClient } = require('../db/pool');
const { enrichProfile } = require('../utils/profileEnrich');
const { createError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

/** Generate a signed access token (15 min expiry) */
function generateAccessToken(userId, role) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

/** Generate a signed refresh token (7 day expiry) */
function generateRefreshToken(userId, role) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

/**
 * POST /api/auth/register
 * Body: { email, password, role, name, city?, state?, lat?, lng? }
 */
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, password, role, name, city, state, lat, lng } = req.body;

    // Check email uniqueness
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role, created_at`,
        [email.toLowerCase(), passwordHash, role]
      );
      const user = userResult.rows[0];

      // Create role-specific profile
      if (role === 'creator') {
        await client.query(
          `INSERT INTO creator_profiles (user_id, name, city, state, lat, lng)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, name, city || null, state || null, lat || null, lng || null]
        );
      } else if (role === 'business') {
        await client.query(
          `INSERT INTO business_profiles (user_id, business_name, city, state, lat, lng)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, name, city || null, state || null, lat || null, lng || null]
        );
      }

      await client.query('COMMIT');

      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id, user.role);

      return res.status(201).json({
        success: true,
        message: 'Registration successful.',
        data: {
          user: { id: user.id, email: user.email, role: user.role, created_at: user.created_at },
          accessToken,
          refreshToken,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const result = await query(
      'SELECT id, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Deliberately vague to prevent user enumeration
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    // Fetch profile for initial dashboard load
    let profile = null;
    if (user.role === 'creator') {
      const p = await query('SELECT name, avatar_url, profile_photo_url, city, state, total_earnings, pending_payout FROM creator_profiles WHERE user_id = $1', [user.id]);
      profile = p.rows[0] ? enrichProfile(p.rows[0], 'creator') : null;
    } else if (user.role === 'business') {
      const p = await query('SELECT business_name, logo_url, profile_photo_url, city, state FROM business_profiles WHERE user_id = $1', [user.id]);
      profile = p.rows[0] ? enrichProfile(p.rows[0], 'business') : null;
    }

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: { id: user.id, email: user.email, role: user.role },
        profile,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    // Ensure user still exists and is active
    const result = await query('SELECT id, role, is_active FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'User not found or suspended.' });
    }

    const user = result.rows[0];
    const newAccessToken = generateAccessToken(user.id, user.role);

    return res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * (Stateless JWT: client drops the token. In production, add a token blacklist / Redis.)
 */
async function logout(req, res) {
  // Client-side should clear stored tokens.
  // Production upgrade: store refreshToken in Redis and invalidate here.
  return res.json({ success: true, message: 'Logged out successfully.' });
}

/**
 * POST /api/auth/forgot-password-verify
 */
async function forgotPasswordVerify(req, res, next) {
  try {
    const { email } = req.body;
    const result = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Email not registered.' });
    }
    return res.json({ success: true, message: 'Email verified. You can now reset password.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Email not registered.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email.toLowerCase()]);

    return res.json({ success: true, message: 'Password reset successful.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refreshToken, logout, forgotPasswordVerify, resetPassword };
