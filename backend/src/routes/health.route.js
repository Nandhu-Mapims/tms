const express = require('express');
const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { prisma } = require('../config/database');

const router = express.Router();

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    await prisma.$queryRaw`SELECT 1`;

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: 'Server is healthy',
      data: {
        status: 'UP',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'CONNECTED',
      },
    });
  })
);

module.exports = router;
