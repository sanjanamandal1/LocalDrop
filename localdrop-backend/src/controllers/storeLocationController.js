// src/controllers/storeLocationController.js — Business store branches
'use strict';

const { query } = require('../db/pool');

async function listStoreLocations(req, res, next) {
  try {
    const result = await query(
      'SELECT * FROM store_locations WHERE business_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

async function upsertStoreLocation(req, res, next) {
  try {
    const { id, branch_name, address, city, state, lat, lng } = req.body;
    if (!branch_name) {
      return res.status(400).json({ success: false, message: 'branch_name is required.' });
    }

    let result;
    if (id) {
      result = await query(
        `UPDATE store_locations
         SET branch_name = $1, address = $2, city = $3, state = $4, lat = $5, lng = $6, updated_at = NOW()
         WHERE id = $7 AND business_id = $8
         RETURNING *`,
        [branch_name, address || null, city || null, state || null, lat || null, lng || null, id, req.user.id]
      );
    } else {
      result = await query(
        `INSERT INTO store_locations (business_id, branch_name, address, city, state, lat, lng)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.user.id, branch_name, address || null, city || null, state || null, lat || null, lng || null]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Store location not found.' });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function deleteStoreLocation(req, res, next) {
  try {
    const result = await query(
      'DELETE FROM store_locations WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Store location not found.' });
    }
    return res.json({ success: true, message: 'Store location deleted.' });
  } catch (err) { next(err); }
}

module.exports = { listStoreLocations, upsertStoreLocation, deleteStoreLocation };
