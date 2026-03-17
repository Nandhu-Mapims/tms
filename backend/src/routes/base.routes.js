const express = require('express');
const rootRoutes = require('./index');
const healthRoutes = require('./health.route');
const authRoutes = require('../modules/auth/auth.routes');
const departmentRoutes = require('../modules/department/department.routes');
const categoryRoutes = require('../modules/category/category.routes');
const subcategoryRoutes = require('../modules/subcategory/subcategory.routes');
const locationRoutes = require('../modules/location/location.routes');
const slaConfigRoutes = require('../modules/slaConfig/slaConfig.routes');
const ticketRoutes = require('../modules/ticket/ticket.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const reportRoutes = require('../modules/report/report.routes');
const userRoutes = require('../modules/user/user.routes');

const router = express.Router();

router.use('/', rootRoutes);
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/locations', locationRoutes);
router.use('/sla-configs', slaConfigRoutes);
router.use('/tickets', ticketRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
