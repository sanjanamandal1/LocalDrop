// src/db/seed.js — Full LocalDrop seeding entry point
'use strict';

require('dotenv').config();
const { pool } = require('./pool');
const logger = require('../utils/logger');
const { execSync } = require('child_process');
const path = require('path');

async function seed() {
  const client = await pool.connect();
  try {
    // Check if database already has users
    const countRes = await client.query('SELECT COUNT(*) FROM users');
    const count = parseInt(countRes.rows[0].count, 10);
    
    if (count > 0 && process.env.FORCE_SEED !== 'true') {
      logger.info('✅ Database already contains data. Skipping seeding to prevent data loss.');
      return;
    }
    
    logger.info('Database empty or FORCE_SEED=true. Starting full database seeding...');
    
    // Execute feed_40_users.js
    logger.info('Running feed_40_users.js...');
    execSync(`node "${path.join(__dirname, 'feed_40_users.js')}"`, { stdio: 'inherit' });
    
    // Run seed_live_activity.js
    logger.info('Running seed_live_activity.js...');
    execSync(`node "${path.join(__dirname, 'seed_live_activity.js')}"`, { stdio: 'inherit' });
    
    logger.info('✅ Full database seeding completed successfully.');
  } catch (err) {
    logger.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
