// Report query helpers for MongoDB (Mongoose).
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

const ApiError = require('../../utils/ApiError');
const { Role } = require('../../models/enums');

const REPORT_FULL_ACCESS_ROLES = [Role.ADMIN, Role.CHIEF, Role.HOD, Role.HELPDESK];

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

const getUserDepartmentObjectIds = (user) => {
  const raw = Array.isArray(user?.departmentIds) && user.departmentIds.length
    ? user.departmentIds
    : user?.departmentId
      ? [user.departmentId]
      : [];
  return raw.map((item) => toObjectId(item, 'departmentId'));
};

const parseDateRange = (query = {}) => {
  const range = {};

  if (query.startDate) {
    const startDate = new Date(query.startDate);
    if (Number.isNaN(startDate.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid startDate supplied');
    }
    range.$gte = startDate;
  }

  if (query.endDate) {
    const endDate = new Date(query.endDate);
    if (Number.isNaN(endDate.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid endDate supplied');
    }
    endDate.setHours(23, 59, 59, 999);
    range.$lte = endDate;
  }

  return Object.keys(range).length ? range : undefined;
};

const parseMonthRange = (monthRaw) => {
  const trimmed = String(monthRaw ?? '').trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) return null;
  const [y, m] = trimmed.split('-').map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

/**
 * Scope report rows by role (HOD / Helpdesk = own handling department only; Admin/Chief optional filter).
 */
const applyRoleScope = (where, user, query) => {
  if (user.role === Role.REQUESTER) {
    where.requesterId = toObjectId(user.id, 'userId');
    return;
  }

  if (user.role === Role.HOD || user.role === Role.HELPDESK) {
    const departmentIds = getUserDepartmentObjectIds(user);
    if (!departmentIds.length) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Your account has no department assigned. Please contact admin.');
    }
    where.departmentId = { $in: departmentIds };
    return;
  }

  if ([Role.ADMIN, Role.CHIEF].includes(user.role) && query?.departmentId) {
    where.departmentId = toObjectId(query.departmentId, 'departmentId');
  }
};

const applyPeriodDateFilter = (where, query) => {
  const periodFieldRaw = String(query.periodField ?? 'created').trim().toLowerCase();
  const periodField = periodFieldRaw === 'closed' ? 'closedAt' : periodFieldRaw === 'all' ? 'all' : 'createdAt';

  const monthRange = query.month != null ? parseMonthRange(query.month) : null;
  const dateRange = monthRange || parseDateRange(query);

  if (!dateRange) return;

  if (periodField === 'all') {
    where.$or = [{ createdAt: dateRange }, { closedAt: dateRange }];
  } else {
    where[periodField] = dateRange;
  }
};

const applyOptionalTicketFilters = (where, query, user) => {
  if (query?.categoryId) where.categoryId = toObjectId(query.categoryId, 'categoryId');
  if (query?.assignedToId) where.assignedToId = toObjectId(query.assignedToId, 'assignedToId');
  if (query?.requesterId && user?.role !== Role.REQUESTER) {
    where.requesterId = toObjectId(query.requesterId, 'requesterId');
  }
  if (query?.priority) where.priority = query.priority;
  if (query?.status) where.status = query.status;
};

const buildTicketReportWhere = (query, user) => {
  ensureReportAccess(user);

  const where = {};
  applyRoleScope(where, user, query);
  applyPeriodDateFilter(where, query);
  applyOptionalTicketFilters(where, query, user);

  return where;
};

/**
 * Same role + master filters as the detail report, but without date constraints — used for monthly aggregates.
 */
const buildReportAggregationWhere = (query, user) => {
  ensureReportAccess(user);

  const where = {};
  applyRoleScope(where, user, query);
  applyOptionalTicketFilters(where, query, user);

  return where;
};

module.exports = {
  ensureReportAccess,
  buildTicketReportWhere,
  buildReportAggregationWhere,
};
