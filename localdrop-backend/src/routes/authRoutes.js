// src/routes/authRoutes.js
'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, refreshToken, logout, forgotPasswordVerify, resetPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('role').isIn(['creator', 'business']).withMessage('Role must be creator or business.'),
    body('name').trim().notEmpty().withMessage('Name is required.'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  login
);

router.post('/refresh', refreshToken);

router.post('/logout', verifyToken, logout);

router.post(
  '/forgot-password-verify',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  forgotPasswordVerify
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  resetPassword
);

module.exports = router;
