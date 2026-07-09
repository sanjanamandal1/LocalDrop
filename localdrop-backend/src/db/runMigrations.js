// src/db/runMigrations.js — Run incremental SQL migrations
'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { pool } = require('./pool');
const logger = require('../utils/logger');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const applied = await client.query('SELECT filename FROM schema_migrations ORDER BY filename');
    const appliedSet = new Set(applied.rows.map((r) => r.filename));

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) {
        logger.info(`[migrate] Skipping ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      logger.info(`[migrate] Applying ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info(`[migrate] ✅ ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    logger.info('[migrate] All migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  logger.error('[migrate] Failed:', err);
  process.exit(1);
});
