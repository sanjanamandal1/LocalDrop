// src/server.js — HTTP server entry point
'use strict';

require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./db/pool');
const logger = require('./utils/logger');
const { startEarningsMaturingJob } = require('./jobs/earningsMaturingJob');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // Verify DB connectivity before accepting traffic
    await testConnection();
    logger.info('✅ PostgreSQL connection established');

    // Start background cron jobs
    startEarningsMaturingJob();
    logger.info('✅ Earnings maturing job started');

    app.listen(PORT, () => {
      logger.info(`🚀 LocalDrop API running on http://localhost:${PORT}`);
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

bootstrap();
