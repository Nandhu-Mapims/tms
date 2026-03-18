const express = require('express');
const rootRoutes = require('./index');
const healthRoutes = require('./health.route');
const { StatusCodes } = require('http-status-codes');
const authRoutes = require('../modules/auth/auth.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const departmentRoutes = require('../modules/department/department.routes');
const categoryRoutes = require('../modules/category/category.routes');
const subcategoryRoutes = require('../modules/subcategory/subcategory.routes');
const locationRoutes = require('../modules/location/location.routes');
const slaConfigRoutes = require('../modules/slaConfig/slaConfig.routes');
const ticketRoutes = require('../modules/ticket/ticket.routes');
const userRoutes = require('../modules/user/user.routes');
const reportRoutes = require('../modules/report/report.routes');

const router = express.Router();

router.use('/', rootRoutes);
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/locations', locationRoutes);
router.use('/sla-configs', slaConfigRoutes);
router.use('/tickets', ticketRoutes);
router.use('/reports', reportRoutes);

// Fallback for unknown routes.
router.all('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
  });
});

module.exports = router;
