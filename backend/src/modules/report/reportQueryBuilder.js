const { Role } = require('@prisma/client');
const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const parsePositiveInt = require('../../utils/parsePositiveInt');

const REPORT_FULL_ACCESS_ROLES = [Role.ADMIN, Role.HOD, Role.HELPDESK];

const ensureReportAccess = (user) => {
  if (REPORT_FULL_ACCESS_ROLES.includes(user.role) || user.role === Role.REQUESTER) {
    return;
  }

  throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access reports');
};

const parseDateRange = (query) => {
  const createdAt = {};

  if (query.startDate) {
    const startDate = new Date(query.startDate);
    if (Number.isNaN(startDate.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid startDate supplied');
    }
    createdAt.gte = startDate;
  }

  if (query.endDate) {
    const endDate = new Date(query.endDate);
    if (Number.isNaN(endDate.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid endDate supplied');
    }
    endDate.setHours(23, 59, 59, 999);
    createdAt.lte = endDate;
  }

  return Object.keys(createdAt).length ? createdAt : undefined;
};

const buildTicketReportWhere = (query, user) => {
  ensureReportAccess(user);

  const where = {};
  const createdAt = parseDateRange(query);

  if (createdAt) where.createdAt = createdAt;
  if (query.departmentId) where.departmentId = parsePositiveInt(query.departmentId, 'departmentId');
  if (query.categoryId) where.categoryId = parsePositiveInt(query.categoryId, 'categoryId');
  if (query.assignedToId) where.assignedToId = parsePositiveInt(query.assignedToId, 'assignedToId');
  if (query.requesterId) where.requesterId = parsePositiveInt(query.requesterId, 'requesterId');
  if (query.priority) where.priority = query.priority;
  if (query.status) where.status = query.status;

  if (user.role === Role.REQUESTER) {
    where.requesterId = user.id;
  }

  return where;
};

module.exports = {
  ensureReportAccess,
  buildTicketReportWhere,
};
