const express = require('express');
const reportController = require('./report.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/tickets', reportController.getTicketReport);
router.get('/monthly-breakdown', reportController.getMonthlyBreakdown);
router.get('/tickets/export', reportController.exportTicketReportCsv);

module.exports = router;
