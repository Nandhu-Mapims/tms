const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    sendResponse(res, {
      message: 'Hospital Ticket Management System API is running',
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  })
);

module.exports = router;
