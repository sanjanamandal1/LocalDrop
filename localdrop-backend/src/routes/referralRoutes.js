// src/routes/referralRoutes.js
'use strict';

const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { sendReferralEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

const router = Router();

router.post(
  '/invite',
  verifyToken,
  [
    body('businessName').trim().notEmpty().withMessage('Business name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid business email is required.'),
    body('senderName').trim().notEmpty().withMessage('Sender name is required.')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }

      const { businessName, email, senderName } = req.body;
      logger.info(`Referral invitation requested by ${senderName} for ${businessName} (${email})`);

      const result = await sendReferralEmail(email, businessName, senderName);
      
      return res.json({
        success: true,
        message: 'Referral invitation sent successfully.',
        data: result
      });
    } catch (err) {
      logger.error('Failed to process referral invitation endpoint:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please verify SMTP configuration.'
      });
    }
  }
);

module.exports = router;
