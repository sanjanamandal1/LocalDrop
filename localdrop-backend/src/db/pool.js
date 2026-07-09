// src/db/pool.js — PostgreSQL connection pool
'use strict';

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'localdrop',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,               // max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Execute a query using the pool.
 * @param {string} text - SQL query
 * @param {Array} [params] - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow query detected (${duration}ms): ${text.substring(0, 100)}`);
    }
    return result;
  } catch (err) {
    logger.error('DB query error:', { text: text.substring(0, 100), error: err.message });
    throw err;
  }
}

/**
 * Get a dedicated client for transactions.
 * Remember to release() it in a finally block.
 */
async function getClient() {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);
  const timeout = setTimeout(() => {
    logger.warn('A DB client has been checked out for more than 5 seconds');
  }, 5000);

  client.release = () => {
    clearTimeout(timeout);
    client.release = originalRelease;
    return client.release();
  };

  return client;
}

/**
 * Test the DB connection on startup.
 */
async function testConnection() {
  const result = await query('SELECT NOW() AS now');
  logger.info(`DB connected at: ${result.rows[0].now}`);
  return result;
}

module.exports = { query, getClient, testConnection, pool };
