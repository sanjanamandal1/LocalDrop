// src/db/migrate.js — Database migration script
'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { pool } = require('./pool');
const logger = require('../utils/logger');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  logger.info(`Reading schema from: ${schemaPath}`);
  
  if (!fs.existsSync(schemaPath)) {
    logger.error('schema.sql file not found!');
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  
  const client = await pool.connect();
  try {
    logger.info('Starting database migration...');
    await client.query('BEGIN');
    
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'users'
      );
    `);
    const schemaExists = tableCheck.rows[0].exists;
    
    if (schemaExists && process.env.FORCE_MIGRATE !== 'true') {
      logger.info('Database schema already exists (users table exists). Skipping clean database reset to prevent data loss.');
    } else {
      logger.info('Dropping and recreating public schema for clean database reset...');
      await client.query('DROP SCHEMA IF EXISTS public CASCADE');
      await client.query('CREATE SCHEMA public');
      await client.query('GRANT ALL ON SCHEMA public TO public');
      
      // Execute the full schema.sql script
      await client.query(sql);
    }
    
    await client.query('COMMIT');
    logger.info('✅ Database migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('❌ Database migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
