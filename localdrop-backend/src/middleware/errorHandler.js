// src/middleware/errorHandler.js — Centralized error handler
'use strict';

const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with that value already exists.',
      field: err.detail,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  // Express-validator errors (passed via next with field errors)
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors,
    });
  }

  // Business logic errors (thrown with statusCode)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Generic server error
  logger.error('Unhandled error:', { url: req.url, method: req.method, error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
}

/**
 * Create a business-logic error with HTTP status code.
 */
function createError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = { errorHandler, createError };
