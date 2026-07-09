// src/controllers/campaignController.js — Campaign CRUD + geo discovery
'use strict';

const { validationResult } = require('express-validator');
const { query, getClient } = require('../db/pool');
const { buildGeoRadiusSQL } = require('../utils/geoUtils');
const { createError } = require('../middleware/errorHandler');

/**
 * POST /api/campaigns
 * Business creates a new campaign.
 */
async function createCampaign(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const {
      name, description, campaign_type, offer_details, image_url,
      commission_type, commission_value, total_budget,
      lat, lng, radius_km, valid_from, valid_till, status,
    } = req.body;
    const initialStatus = status === 'active' ? 'active' : 'draft';

    const result = await query(
      `INSERT INTO campaigns
         (business_id, name, description, campaign_type, offer_details, image_url,
          commission_type, commission_value, total_budget, lat, lng, radius_km,
          valid_from, valid_till, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [req.user.id, name, description, campaign_type, offer_details, image_url || null,
       commission_type, commission_value, total_budget,
       lat, lng, radius_km || 5, valid_from, valid_till, initialStatus]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

/**
 * GET /api/campaigns/nearby?lat=&lng=&radius=&page=&limit=
 * Creator discovers campaigns within geo-radius.
 */
async function getNearbyCampaigns(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const offset = (page - 1) * limit;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'lat and lng query params are required.' });
    }

    const { sql: geoSql, params: geoParams } = buildGeoRadiusSQL(lat, lng, radius, 'c.lat', 'c.lng', 0);

    const sql = `
      SELECT
        c.id, c.name, c.offer_details, c.campaign_type, c.image_url,
        c.commission_type, c.commission_value, c.radius_km,
        c.valid_from, c.valid_till, c.status,
        c.total_redemptions, c.total_revenue,
        bp.business_name, bp.logo_url, bp.city,
        ROUND((6371 * acos(
          LEAST(1.0, cos(radians($1)) * cos(radians(c.lat))
            * cos(radians(c.lng) - radians($2))
            + sin(radians($1)) * sin(radians(c.lat)))
        ))::numeric, 2) AS distance_km,
        EXISTS(
          SELECT 1 FROM campaign_creators cc
          WHERE cc.campaign_id = c.id AND cc.creator_id = $4
        ) AS already_joined
      FROM campaigns c
      JOIN business_profiles bp ON bp.user_id = c.business_id
      WHERE c.status = 'active'
        AND c.valid_till >= CURRENT_DATE
        AND c.spent_budget < c.total_budget
        AND ${geoSql}
      ORDER BY distance_km ASC
      LIMIT $5 OFFSET $6
    `;

    const result = await query(sql, [...geoParams, req.user.id, limit, offset]);

    return res.json({ success: true, data: result.rows, meta: { page, limit } });
  } catch (err) { next(err); }
}

/**
 * GET /api/campaigns/:id
 * Full campaign detail (creator or business perspective).
 */
async function getCampaignById(req, res, next) {
  try {
    const result = await query(
      `SELECT c.*, bp.business_name, bp.logo_url, bp.city, bp.lat AS biz_lat, bp.lng AS biz_lng
       FROM campaigns c
       JOIN business_profiles bp ON bp.user_id = c.business_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

/**
 * PUT /api/campaigns/:id
 * Business updates campaign (only draft/paused allowed for full edit).
 */
async function updateCampaign(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
    if (campaign.rows.length === 0) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    if (campaign.rows[0].business_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not your campaign.' });
    if (campaign.rows[0].status === 'ended') return res.status(400).json({ success: false, message: 'Cannot edit an ended campaign.' });

    const {
      name, description, offer_details, image_url,
      commission_type, commission_value, total_budget,
      radius_km, valid_from, valid_till,
    } = req.body;

    const result = await query(
      `UPDATE campaigns
       SET name=$1, description=$2, offer_details=$3, image_url=$4,
           commission_type=$5, commission_value=$6, total_budget=$7,
           radius_km=$8, valid_from=$9, valid_till=$10
       WHERE id = $11
       RETURNING *`,
      [name, description, offer_details, image_url, commission_type, commission_value,
       total_budget, radius_km, valid_from, valid_till, req.params.id]
    );

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/campaigns/:id/status
 * Business changes campaign status: active | paused | ended
 */
async function updateCampaignStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['active', 'paused', 'ended'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}.` });
    }

    const campaign = await query('SELECT business_id, status FROM campaigns WHERE id = $1', [req.params.id]);
    if (campaign.rows.length === 0) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    if (campaign.rows[0].business_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not your campaign.' });
    if (campaign.rows[0].status === 'ended') return res.status(400).json({ success: false, message: 'Ended campaigns cannot be reactivated.' });

    const result = await query(
      `UPDATE campaigns SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, req.params.id]
    );

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

/**
 * POST /api/campaigns/:id/join
 * Creator joins a campaign → creates campaign_creator + qr_code row.
 */
async function joinCampaign(req, res, next) {
  try {
    const campaign = await query(
      'SELECT id, status, valid_till, business_id FROM campaigns WHERE id = $1',
      [req.params.id]
    );
    if (campaign.rows.length === 0) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    const c = campaign.rows[0];
    if (c.status !== 'active') return res.status(400).json({ success: false, message: 'Campaign is not active.' });
    if (new Date(c.valid_till) < new Date()) return res.status(400).json({ success: false, message: 'Campaign has expired.' });
    if (c.business_id === req.user.id) return res.status(400).json({ success: false, message: 'Business cannot join their own campaign.' });

    const existing = await query(
      'SELECT id FROM campaign_creators WHERE campaign_id = $1 AND creator_id = $2',
      [req.params.id, req.user.id]
    );
    if (existing.rows.length > 0) return res.status(409).json({ success: false, message: 'Already joined this campaign.' });

    const { generateToken } = require('../utils/cryptoUtils');
    const qrToken = generateToken(16);
    const qrLink = `${process.env.FRONTEND_URL || 'https://localdrop.com'}/c/${qrToken}`;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        'INSERT INTO campaign_creators (campaign_id, creator_id) VALUES ($1, $2)',
        [req.params.id, req.user.id]
      );

      const qrResult = await client.query(
        `INSERT INTO qr_codes (campaign_id, creator_id, qr_token, qr_link)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (campaign_id, creator_id) DO NOTHING
         RETURNING id, qr_token, qr_link`,
        [req.params.id, req.user.id, qrToken, qrLink]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        message: 'Joined campaign successfully.',
        data: qrResult.rows[0],
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
}

/**
 * GET /api/campaigns/business/mine
 * Business sees their own campaigns.
 */
async function getBusinessCampaigns(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let sql = `SELECT * FROM campaigns WHERE business_id = $1 `;
    const params = [req.user.id];
    if (status) { sql += 'AND status = $2 '; params.push(status); }
    sql += `ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), offset);

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

/**
 * GET /api/campaigns/creator/mine
 * Creator sees campaigns they have joined.
 */
async function getCreatorCampaigns(req, res, next) {
  try {
    const result = await query(
      `SELECT c.*, bp.business_name, bp.logo_url,
              qr.qr_token, qr.qr_link, qr.claim_count, qr.scan_count,
              cc.joined_at, cc.is_active AS creator_active,
              COALESCE(SUM(e.amount) FILTER (WHERE e.status != 'reversed'), 0) AS my_earnings
       FROM campaign_creators cc
       JOIN campaigns c ON c.id = cc.campaign_id
       JOIN business_profiles bp ON bp.user_id = c.business_id
       LEFT JOIN qr_codes qr ON qr.campaign_id = c.id AND qr.creator_id = $1
       LEFT JOIN earnings e ON e.campaign_id = c.id AND e.creator_id = $1
       WHERE cc.creator_id = $1
       GROUP BY c.id, bp.business_name, bp.logo_url, qr.qr_token, qr.qr_link,
                qr.claim_count, qr.scan_count, cc.joined_at, cc.is_active
       ORDER BY cc.joined_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

/**
 * Helper to calculate Jaccard similarity between two strings
 */
function jaccardSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const w1 = new Set(str1.toLowerCase().match(/\w+/g) || []);
  const w2 = new Set(str2.toLowerCase().match(/\w+/g) || []);
  if (w1.size === 0 && w2.size === 0) return 0;
  
  let intersection = 0;
  for (const w of w1) {
    if (w2.has(w)) intersection++;
  }
  const union = w1.size + w2.size - intersection;
  return intersection / union;
}

/**
 * GET /api/campaigns/matches
 * AI Matching Engine: retrieves businesses ranked by match score for a creator.
 */
async function getCreatorMatches(req, res, next) {
  try {
    const creatorId = req.query.creator_id || req.user.id;

    // 1. Fetch creator profile
    const creatorRes = await query(
      `SELECT name, niche, bio, city FROM creator_profiles WHERE user_id = $1`,
      [creatorId]
    );
    if (creatorRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Creator profile not found.' });
    }
    const creator = creatorRes.rows[0];

    // 2. Fetch audience clusters
    const clustersRes = await query(
      `SELECT area_name, lat, lng, weight_pct FROM audience_clusters WHERE creator_id = $1`,
      [creatorId]
    );
    const clusters = clustersRes.rows.map(c => ({
      name: c.area_name,
      lat: parseFloat(c.lat),
      lng: parseFloat(c.lng),
      weight: parseInt(c.weight_pct, 10)
    }));

    // 3. Fetch businesses with stats
    const businessesRes = await query(
      `SELECT bp.user_id AS business_id, bp.business_name, bp.business_type, 
              bp.description, bp.address, bp.city, bp.lat, bp.lng,
              COUNT(c.id) FILTER (WHERE c.status = 'active') AS active_campaigns,
              MAX(c.id::text) FILTER (WHERE c.status = 'active') AS campaign_id,
              MAX(c.offer_details) FILTER (WHERE c.status = 'active') AS campaign_offer,
              EXISTS (
                SELECT 1 FROM campaign_creators cc 
                JOIN campaigns c2 ON c2.id = cc.campaign_id
                WHERE cc.creator_id = $1 AND c2.business_id = bp.user_id AND c2.status = 'active'
              ) AS already_joined,
              COALESCE(SUM(c.total_redemptions), 0)::integer AS redemptions
       FROM business_profiles bp
       LEFT JOIN campaigns c ON c.business_id = bp.user_id
       GROUP BY bp.user_id, bp.business_name, bp.business_type, bp.description, bp.address, bp.city, bp.lat, bp.lng`,
      [creatorId]
    );
    const businesses = businessesRes.rows;

    const { haversineDistanceKm } = require('../utils/geoUtils');

    // Niche-to-Business Type similarity matrix
    const similarities = {
      'Indore food blogger': { 'Cafe': 0.95, 'Street food': 0.90, 'Desserts': 0.85, 'Tea': 0.80, 'Quick bites': 0.75, 'Home': 0.10 },
      'Streetwear creator': { 'Cafe': 0.40, 'Street food': 0.30, 'Desserts': 0.20, 'Tea': 0.20, 'Quick bites': 0.40, 'Home': 0.10, 'Clothing': 0.95 },
      'Cafe and experiences': { 'Cafe': 0.98, 'Street food': 0.80, 'Desserts': 0.90, 'Tea': 0.85, 'Quick bites': 0.80, 'Home': 0.30 }
    };

    const matches = [];

    for (const b of businesses) {
      const bLat = parseFloat(b.lat);
      const bLng = parseFloat(b.lng);

      // --- SIGNAL 1: Geo-Audience Overlap (35%) ---
      let geoScoreRaw = 0;
      let minDistance = Infinity;
      let closestClusterName = 'Unknown';

      for (const cl of clusters) {
        const d = haversineDistanceKm(cl.lat, cl.lng, bLat, bLng);
        if (d < minDistance) {
          minDistance = d;
          closestClusterName = cl.name;
        }
        const closeness = Math.max(0, 1 - (d / 5.0)); // 5km boundary
        geoScoreRaw += closeness * (cl.weight / 100);
      }
      const geoScore = Math.min(100, Math.round(geoScoreRaw * 100));

      // --- SIGNAL 2: Content-Category Alignment (30%) ---
      let sim = similarities[creator.niche]?.[b.business_type];
      if (sim === undefined) {
        const j1 = jaccardSimilarity(creator.niche, b.business_type);
        const j2 = jaccardSimilarity(creator.bio, b.description);
        sim = Math.max(0.20, j1 * 0.7 + j2 * 0.3);
      }
      const contentScore = Math.round(sim * 100);

      // --- SIGNAL 3: Historical Conversion Lift (25%) ---
      const conversionScore = Math.min(100, (b.redemptions * 5) + 30);

      // --- SIGNAL 4: Audience-Offer Affinity (10%) ---
      const creatorWords = new Set(`${creator.niche} ${creator.bio}`.toLowerCase().match(/\w+/g) || []);
      const bizWords = new Set(`${b.business_name} ${b.business_type} ${b.description}`.toLowerCase().match(/\w+/g) || []);
      let overlapCount = 0;
      for (const w of creatorWords) {
        if (bizWords.has(w)) overlapCount++;
      }
      const affinityScore = Math.min(100, overlapCount * 20 + 40);

      // --- Composite Match Score ---
      const compositeScore = Math.round(
        geoScore * 0.35 +
        contentScore * 0.30 +
        conversionScore * 0.25 +
        affinityScore * 0.10
      );

      // Construct reason explanation
      let reason = '';
      if (compositeScore >= 80) {
        reason = `Strong match: ${closestClusterName} audience overlap plus category fit`;
      } else if (compositeScore >= 60) {
        reason = `Moderate match: decent category fit and location proximity`;
      } else {
        reason = `Excluded: weak content-category alignment`;
      }

      matches.push({
        id: b.business_id,
        name: b.business_name,
        category: b.business_type,
        area: b.address.split(',')[0].trim(),
        score: compositeScore,
        distance: minDistance === Infinity ? 'N/A' : `${minDistance.toFixed(1)} km`,
        reason: reason,
        lat: bLat,
        lng: bLng,
        redemptions: b.redemptions,
        active: b.active_campaigns > 0,
        campaign_id: b.campaign_id || null,
        campaign_offer: b.campaign_offer || null,
        already_joined: b.already_joined || false,
        signals: {
          geo: geoScore,
          content: contentScore,
          conversion: conversionScore,
          affinity: affinityScore
        }
      });
    }

    // Sort descending by score
    matches.sort((a, b) => b.score - a.score);

    return res.json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/campaigns/creators
 * Returns creators and their clusters for the demo creator selector.
 */
async function getCreatorsList(req, res, next) {
  try {
    const result = await query(
      `SELECT cp.user_id AS id, cp.name, cp.niche, cp.bio, cp.city, cp.state,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'name', ac.area_name,
                    'weight', ac.weight_pct,
                    'lat', ac.lat,
                    'lng', ac.lng
                  )
                ) FILTER (WHERE ac.id IS NOT NULL),
                '[]'
              ) AS clusters
       FROM creator_profiles cp
       LEFT JOIN audience_clusters ac ON ac.creator_id = cp.user_id
       GROUP BY cp.user_id, cp.name, cp.niche, cp.bio, cp.city, cp.state`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

async function createAndJoinMatchCampaign(req, res, next) {
  try {
    const { business_id, creator_id } = req.body;
    const creatorId = creator_id || req.user.id;

    // Fetch creator details
    const creatorRes = await query('SELECT name, niche FROM creator_profiles WHERE user_id = $1', [creatorId]);
    const creator = creatorRes.rows[0];

    // Fetch business details
    const businessRes = await query('SELECT business_name, lat, lng FROM business_profiles WHERE user_id = $1', [business_id]);
    const business = businessRes.rows[0];

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    const campaignName = `${creator.name} x ${business.business_name} Special`;
    const offerDetails = `Flat 15% Off on All Orders`;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Create campaign
      const campRes = await client.query(
        `INSERT INTO campaigns (business_id, name, description, campaign_type, offer_details, commission_type, commission_value, total_budget, spent_budget, lat, lng, radius_km, valid_from, valid_till, status)
         VALUES ($1, $2, $3, 'discount', $4, 'percentage', 10.00, 5000.00, 0, $5, $6, 5, CURRENT_DATE, CURRENT_DATE + 30, 'active')
         RETURNING id`,
        [business_id, campaignName, `Special partnership offer for ${creator.name}'s audience.`, offerDetails, business.lat, business.lng]
      );
      const campaignId = campRes.rows[0].id;

      // 2. Join creator
      await client.query(
        `INSERT INTO campaign_creators (campaign_id, creator_id) VALUES ($1, $2)`,
        [campaignId, creatorId]
      );

      // 3. Create QR Code
      const qrToken = `qr_${campaignId.substring(0, 8)}_${creatorId.substring(0, 8)}`;
      const qrLink = `http://localhost:3000/c/${qrToken}`;
      await client.query(
        `INSERT INTO qr_codes (campaign_id, creator_id, qr_token, qr_link)
         VALUES ($1, $2, $3, $4)`,
        [campaignId, creatorId, qrToken, qrLink]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        message: 'Campaign created and joined successfully!',
        data: { campaignId, qrToken }
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

module.exports = {
  createCampaign, getNearbyCampaigns, getCampaignById,
  updateCampaign, updateCampaignStatus, joinCampaign,
  getBusinessCampaigns, getCreatorCampaigns, getCreatorMatches, getCreatorsList,
  createAndJoinMatchCampaign
};
