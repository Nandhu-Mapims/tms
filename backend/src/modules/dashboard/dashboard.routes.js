const express = require('express');
const dashboardController = require('./dashboard.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/summary', dashboardController.getSummary);
router.get('/category-wise', dashboardController.getCategoryWise);
router.get('/department-wise', dashboardController.getDepartmentWise);
router.get('/priority-wise', dashboardController.getPriorityWise);
router.get('/status-wise', dashboardController.getStatusWise);
router.get('/technician-performance', dashboardController.getTechnicianPerformance);
router.get('/monthly-trend', dashboardController.getMonthlyTrend);

module.exports = router;
