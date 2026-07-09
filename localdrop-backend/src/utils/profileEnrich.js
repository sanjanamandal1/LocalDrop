// src/utils/profileEnrich.js — Add profile_photo_url to profile responses
'use strict';

function enrichProfile(row, role) {
  if (!row) return row;
  const enriched = { ...row };
  if (role === 'creator') {
    enriched.profile_photo_url = enriched.profile_photo_url || enriched.avatar_url || null;
  } else if (role === 'business') {
    enriched.profile_photo_url = enriched.profile_photo_url || enriched.logo_url || null;
  }
  return enriched;
}

module.exports = { enrichProfile };
