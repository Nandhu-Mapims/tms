const express = require('express');
const { Role } = require('@prisma/client');
const userController = require('./user.controller');
const { protect, authorizeRoles } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, authorizeRoles(Role.ADMIN));

router.route('/')
  .get(userController.getUsers);

router.route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser);

router.patch('/:id/status', userController.updateUserStatus);

module.exports = router;
