const express = require('express');
const { Role } = require('../../../generated/prisma');
const authController = require('./auth.controller');
const { protect, authorizeRoles } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.post('/register', protect, authorizeRoles(Role.ADMIN), authController.register);

module.exports = router;
