const express = require('express');
const reportController = require('./report.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/tickets', reportController.getTicketReport);

module.exports = router;
