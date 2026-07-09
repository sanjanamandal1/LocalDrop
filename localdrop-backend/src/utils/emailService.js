// src/utils/emailService.js
'use strict';

const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    logger.info(`Using configured SMTP server: ${host}:${port}`);
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465,
      auth: { user, pass }
    });
  } else {
    logger.info('No SMTP credentials in .env. Creating test account on Ethereal.email...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      logger.info(`Created Ethereal SMTP test account: User: ${testAccount.user}`);
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      logger.error('Failed to create Ethereal SMTP test account:', err);
      transporter = {
        sendMail: async (mailOptions) => {
          logger.info(`[Dummy Mail] Sent to: ${mailOptions.to}, Subject: ${mailOptions.subject}`);
          return { messageId: 'dummy-id', previewUrl: null };
        }
      };
    }
  }

  return transporter;
}

async function sendReferralEmail(toEmail, businessName, senderName) {
  try {
    const mailTransporter = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"LocalDrop Team" <no-reply@localdrop.com>';
    
    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: 'Join LocalDrop - Hyperlocal Creator Matching! 🚀',
      text: `Hi ${businessName},\n\n` +
            `${senderName} is using LocalDrop to discover and collaborate with local businesses in Indore. They think your store would be a perfect fit!\n\n` +
            `You can register, set up your geofenced branches, and start running campaigns to drive walk-ins.\n\n` +
            `Join us here: http://localhost:3001/register\n\n` +
            `Best regards,\n` +
            `The LocalDrop Team 🌸`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">` +
            `<h2 style="color: #db2777;">You've been invited to join LocalDrop! 🌸</h2>` +
            `<p>Hi <strong>${businessName}</strong>,</p>` +
            `<p><strong>${senderName}</strong> is using LocalDrop to partner with local businesses in Indore. They think your store would be a perfect fit!</p>` +
            `<p>LocalDrop connects local creators (food, lifestyle influencers) with neighborhood stores to drive trackable walk-ins and boost sales.</p>` +
            `<div style="margin: 25px 0;">` +
            `<a href="http://localhost:3001/register" style="background-color: #db2777; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">` +
            `Register Your Business Now` +
            `</a>` +
            `</div>` +
            `<p style="font-size: 12px; color: #666;">If the button above doesn't work, copy and paste this link: <a href="http://localhost:3001/register">http://localhost:3001/register</a></p>` +
            `<p>Best regards,<br/>The LocalDrop Team 🐾</p>` +
            `</div>`
    };

    const info = await mailTransporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[Email Sent] Message ID: ${info.messageId}`);
      logger.info(`[Email Sent] Ethereal Preview URL: ${previewUrl}`);
      return { success: true, messageId: info.messageId, previewUrl };
    } else {
      logger.info(`[Email Sent] Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    }
  } catch (err) {
    logger.error('Failed to send referral email:', err);
    throw err;
  }
}

module.exports = { sendReferralEmail };
