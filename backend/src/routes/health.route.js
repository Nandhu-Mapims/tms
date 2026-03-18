const express = require('express');
const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const mongoose = require('mongoose');
const { getDatabaseStatus } = require('../config/database');

const router = express.Router();

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const isDbConnected = (mongoose.connection?.readyState ?? 0) === 1;
    if (!isDbConnected) {
      const err = new Error('Database is not connected');
      err.statusCode = StatusCodes.SERVICE_UNAVAILABLE;
      throw err;
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Server is healthy',
      data: {
        status: 'UP',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: getDatabaseStatus(),
      },
    });
  })
);

module.exports = router;
