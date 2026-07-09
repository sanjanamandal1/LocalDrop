// src/middleware/auth.js — JWT verification + role guard
'use strict';

const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');

/**
 * Middleware: validate Bearer token and attach req.user
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token missing.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Access token expired.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid access token.' });
    }

    // Verify user still exists and is active
    const result = await query(
      'SELECT id, email, role, is_active, is_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account suspended.' });
    }

    req.user = { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware factory: restrict endpoint to specific roles.
 * Usage: requireRole('business') or requireRole('admin', 'business')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
