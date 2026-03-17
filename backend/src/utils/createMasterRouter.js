const express = require('express');
const { Role } = require('@prisma/client');
const asyncHandler = require('./asyncHandler');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');

const VIEW_ROLES = [Role.ADMIN, Role.HELPDESK, Role.HOD, Role.REQUESTER];

const createMasterRouter = (controller) => {
  const router = express.Router();

  router.use(protect);

  router
    .route('/')
    .post(authorizeRoles(Role.ADMIN), asyncHandler(controller.create))
    .get(authorizeRoles(...VIEW_ROLES), asyncHandler(controller.getAll));

  router
    .route('/:id')
    .get(authorizeRoles(...VIEW_ROLES), asyncHandler(controller.getById))
    .put(authorizeRoles(Role.ADMIN), asyncHandler(controller.update))
    .delete(authorizeRoles(Role.ADMIN), asyncHandler(controller.remove));

  return router;
};

module.exports = createMasterRouter;

