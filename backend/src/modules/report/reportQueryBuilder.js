// Report query helpers for MongoDB (Mongoose).
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

const ApiError = require('../../utils/ApiError');
const { Role } = require('../../models/enums');

const REPORT_FULL_ACCESS_ROLES = [Role.ADMIN, Role.HOD, Role.HELPDESK];

const ensureReportAccess = (user) => {
  if (REPORT_FULL_ACCESS_ROLES.includes(user.role) || user.role === Role.REQUESTER) return;
  throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access reports');
};

const toObjectId = (value, fieldName) => {
  const normalized = String(value ?? '');
  if (!normalized) return undefined;
  if (!mongoose.Types.ObjectId.isValid(normalized)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${fieldName} must be a valid id`);
  }
  return new mongoose.Types.ObjectId(normalized);
};

const parseDateRange = (query = {}) => {
  const createdAt = {};

  if (query.startDate) {
    const startDate = new Date(query.startDate);
    if (Number.isNaN(startDate.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid startDate supplied');
    }
    createdAt.$gte = startDate;
  }

  if (query.endDate) {
    const endDate = new Date(query.endDate);
    if (Number.isNaN(endDate.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid endDate supplied');
    }
    endDate.setHours(23, 59, 59, 999);
    createdAt.$lte = endDate;
  }

  return Object.keys(createdAt).length ? createdAt : undefined;
};

const buildTicketReportWhere = (query, user) => {
  ensureReportAccess(user);

  const where = {};
  const createdAt = parseDateRange(query);
  if (createdAt) where.createdAt = createdAt;

  if (query?.departmentId) where.departmentId = toObjectId(query.departmentId, 'departmentId');
  if (query?.categoryId) where.categoryId = toObjectId(query.categoryId, 'categoryId');
  if (query?.assignedToId) where.assignedToId = toObjectId(query.assignedToId, 'assignedToId');
  if (query?.requesterId) where.requesterId = toObjectId(query.requesterId, 'requesterId');
  if (query?.priority) where.priority = query.priority;
  if (query?.status) where.status = query.status;

  if (user.role === Role.REQUESTER) {
    where.requesterId = toObjectId(user.id, 'userId');
  }

  return where;
};

module.exports = {
  ensureReportAccess,
  buildTicketReportWhere,
};

