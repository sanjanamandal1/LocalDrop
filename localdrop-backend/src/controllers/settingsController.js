// src/controllers/settingsController.js — user settings, notifications, password
'use strict';

const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');

const SALT_ROUNDS = 12;

async function ensureSettings(userId) {
  const result = await query(
    `INSERT INTO user_settings (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
}

async function getSettings(req, res, next) {
  try {
    const settings = await ensureSettings(req.user.id);
    return res.json({ success: true, data: settings });
  } catch (err) { next(err); }
}

function settingsUpdater(column) {
  return async (req, res, next) => {
    try {
      const settings = await ensureSettings(req.user.id);
      const nextValue = { ...(settings[column] || {}), ...(req.body || {}) };
      const result = await query(
        `UPDATE user_settings SET ${column} = $1 WHERE user_id = $2 RETURNING ${column}`,
        [nextValue, req.user.id]
      );
      return res.json({ success: true, data: result.rows[0][column] });
    } catch (err) { next(err); }
  };
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'Current password and a new password of at least 8 characters are required.' });
    }

    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const ok = userResult.rows[0] && await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    if (!ok) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
}

async function getNotifications(req, res, next) {
  try {
    await seedDefaultNotifications(req.user);
    const result = await query(
      `SELECT id, title, description, type, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

async function markNotificationRead(req, res, next) {
  try {
    const result = await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Notification not found.' });
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (err) { next(err); }
}

async function clearNotifications(req, res, next) {
  try {
    await query('DELETE FROM notifications WHERE user_id = $1', [req.user.id]);
    return res.json({ success: true, data: { cleared: true } });
  } catch (err) { next(err); }
}

async function seedDefaultNotifications(user) {
  const count = await query('SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1', [user.id]);
  if (count.rows[0].count > 0) return;

  const items = user.role === 'creator'
    ? [
        ['Campaigns ready nearby', 'New active campaigns are available around your audience hotspots.', 'match'],
        ['Earnings hold reminder', 'Confirmed earnings clear after the configured safety hold.', 'earning'],
        ['Profile boost tip', 'Complete verification and payout details to improve campaign readiness.', 'info'],
      ]
    : user.role === 'business'
    ? [
        ['Redemption feed active', 'Customer redemptions will appear as soon as creators drive claims.', 'joined'],
        ['Campaign status control', 'Draft campaigns are invisible to creators until you activate them.', 'info'],
        ['Store branches enabled', 'Add branch locations to make geofence checks more accurate.', 'info'],
      ]
    : [
        ['Admin dashboard ready', 'Review users, disputes, and pending payouts from the admin workspace.', 'info'],
      ];

  for (const [title, description, type] of items) {
    await query(
      'INSERT INTO notifications (user_id, title, description, type) VALUES ($1, $2, $3, $4)',
      [user.id, title, description, type]
    );
  }
}

module.exports = {
  getSettings,
  updateNotifications: settingsUpdater('notification_settings'),
  updatePrivacy: settingsUpdater('privacy_settings'),
  updateCreatorPreferences: settingsUpdater('creator_preferences'),
  updateCampaignPreferences: settingsUpdater('campaign_preferences'),
  updateConnectedApps: settingsUpdater('connected_apps'),
  updateTeamMembers: settingsUpdater('team_members'),
  updateApiSettings: settingsUpdater('api_settings'),
  changePassword,
  getNotifications,
  markNotificationRead,
  clearNotifications,
};
