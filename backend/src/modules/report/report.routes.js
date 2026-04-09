const express = require('express');
const reportController = require('./report.controller');
const { protect, authorizeRoles } = require('../../middlewares/auth.middleware');
const { Role } = require('../../models/enums');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles(Role.ADMIN, Role.CHIEF));
router.get('/tickets', reportController.getTicketReport);
router.get('/monthly-breakdown', reportController.getMonthlyBreakdown);
router.get('/tickets/export', reportController.exportTicketReportCsv);

module.exports = router;
