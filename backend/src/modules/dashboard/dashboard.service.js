const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const parsePositiveInt = require('../../utils/parsePositiveInt');
const { Role, TicketStatus } = require('../../models/enums');
const Ticket = require('../../models/Ticket.model');

const DASHBOARD_FULL_ACCESS_ROLES = [Role.ADMIN, Role.CHIEF, Role.HOD, Role.HELPDESK];

const startOfDay = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const endOfDay = (date = new Date()) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const ensureDashboardAccess = (user) => {
  if (
    DASHBOARD_FULL_ACCESS_ROLES.includes(user.role) ||
    user.role === Role.REQUESTER
  ) {
    return;
  }

  throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access dashboard or reports');
};

const toObjectId = (value, fieldName = 'id') => {
  if (!value) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${fieldName} is required`);
  }

  if (value instanceof mongoose.Types.ObjectId) return value;

  const normalized = String(value);
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

const buildScopedWhere = (user, filters = {}) => {
  ensureDashboardAccess(user);

  const where = { ...filters };

  if (user.role === Role.REQUESTER) {
    where.requesterId = toObjectId(user.id, 'userId');
  }

  if (user.role === Role.HELPDESK) {
    const departmentIds = getUserDepartmentObjectIds(user);
    if (!departmentIds.length) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Your account has no department assigned. Please contact admin.');
    }
    where.departmentId = { $in: departmentIds }; // routed "send to" departments
  }

  if (user.role === Role.HOD) {
    const departmentIds = getUserDepartmentObjectIds(user);
    if (!departmentIds.length) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Your account has no department assigned. Please contact admin.');
    }
    where.departmentId = { $in: departmentIds }; // routed "send to" departments
  }

  return where;
};

const buildDateRangeWhere = (query = {}) => {
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
  const where = buildScopedWhere(user);
  const createdAt = buildDateRangeWhere(query);

  if (createdAt) where.createdAt = createdAt;
  if (query?.departmentId) where.departmentId = toObjectId(query.departmentId, 'departmentId');
  if (query?.categoryId) where.categoryId = toObjectId(query.categoryId, 'categoryId');
  if (query?.assignedToId) where.assignedToId = toObjectId(query.assignedToId, 'assignedToId');
  if (query?.requesterId) where.requesterId = toObjectId(query.requesterId, 'requesterId');
  if (query?.priority) where.priority = query.priority;
  if (query?.status) where.status = query.status;

  return where;
};

const buildChartData = (items, labelKey, valueKey = 'count') => ({
  labels: items.map((item) => item[labelKey]),
  series: items.map((item) => item[valueKey]),
  items,
});

const getSummary = async (user) => {
  const scopedWhere = buildScopedWhere(user);
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const [
    totalTickets,
    openTickets,
    assignedTickets,
    inProgressTickets,
    overdueTickets,
    resolvedToday,
    closedToday,
    escalatedTickets,
  ] = await Promise.all([
    Ticket.countDocuments(scopedWhere),
    Ticket.countDocuments({ ...scopedWhere, status: TicketStatus.OPEN }),
    Ticket.countDocuments({ ...scopedWhere, status: TicketStatus.ASSIGNED }),
    Ticket.countDocuments({ ...scopedWhere, status: TicketStatus.IN_PROGRESS }),
    Ticket.countDocuments({ ...scopedWhere, isOverdue: true }),
    Ticket.countDocuments({ ...scopedWhere, resolvedAt: { $gte: todayStart, $lte: todayEnd } }),
    Ticket.countDocuments({ ...scopedWhere, closedAt: { $gte: todayStart, $lte: todayEnd } }),
    Ticket.countDocuments({ ...scopedWhere, status: TicketStatus.ESCALATED }),
  ]);

  return {
    totalTickets,
    openTickets,
    assignedTickets,
    inProgressTickets,
    overdueTickets,
    resolvedToday,
    closedToday,
    escalatedTickets,
  };
};

const buildGroupChart = async ({ user, groupField, lookupFrom, labelPath }) => {
  const scopedWhere = buildScopedWhere(user);

  const pipeline = [
    { $match: scopedWhere },
    { $group: { _id: `$${groupField}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ];

  if (lookupFrom) {
    pipeline.push(
      {
        $lookup: {
          from: lookupFrom,
          localField: '_id',
          foreignField: '_id',
          as: '__ref',
        },
      },
      { $unwind: { path: '$__ref', preserveNullAndEmptyArrays: true } },
      { $addFields: { label: `$__ref.${labelPath}` } }
    );
  } else {
    pipeline.push({ $addFields: { label: '$_id' } });
  }

  const rows = await Ticket.aggregate(pipeline);
  const items = rows.map((r) => ({
    id: r._id ?? null,
    label: r.label ?? 'Unknown',
    count: r.count ?? 0,
  }));

  return buildChartData(items, 'label', 'count');
};

const getCategoryWise = async (user) =>
  buildGroupChart({ user, groupField: 'categoryId', lookupFrom: 'categories', labelPath: 'name' });

const getDepartmentWise = async (user) =>
  buildGroupChart({ user, groupField: 'departmentId', lookupFrom: 'departments', labelPath: 'name' });

const getPriorityWise = async (user) => buildGroupChart({ user, groupField: 'priority', lookupFrom: null, labelPath: '' });

const getStatusWise = async (user) => buildGroupChart({ user, groupField: 'status', lookupFrom: null, labelPath: '' });

const getTechnicianPerformance = async (user) => {
  ensureDashboardAccess(user);

  const baseMatch = buildScopedWhere(user, { assignedToId: { $ne: null } });

  const pipeline = [
    { $match: baseMatch },
    {
      $group: {
        _id: '$assignedToId',
        assignedCount: { $sum: 1 },
        resolvedCount: {
          $sum: {
            $cond: [{ $in: ['$status', [TicketStatus.RESOLVED, TicketStatus.CLOSED]] }, 1, 0],
          },
        },
      },
    },
    { $sort: { assignedCount: -1 } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: '__user' } },
    { $unwind: { path: '$__user', preserveNullAndEmptyArrays: true } },
    { $addFields: { name: { $ifNull: ['$__user.fullName', 'Unknown Technician'] } } },
  ];

  const rows = await Ticket.aggregate(pipeline);
  const items = rows.map((r) => ({
    technicianId: r._id ?? null,
    name: r.name ?? 'Unknown Technician',
    assignedCount: r.assignedCount ?? 0,
    resolvedCount: r.resolvedCount ?? 0,
  }));

  return {
    labels: items.map((i) => i.name),
    assignedSeries: items.map((i) => i.assignedCount),
    resolvedSeries: items.map((i) => i.resolvedCount),
    items,
  };
};

const getMonthlyTrend = async (user, query = {}) => {
  ensureDashboardAccess(user);
  const months = query.months ? parsePositiveInt(query.months, 'months') : 6;
  const cappedMonths = Math.min(months, 24);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (cappedMonths - 1), 1, 0, 0, 0, 0);

  const baseMatch = buildScopedWhere(user, { createdAt: { $gte: start } });
  const rows = await Ticket.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const items = rows.map((r) => ({
    month: `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
    count: r.count ?? 0,
  }));

  return buildChartData(items, 'month');
};

/** Tickets still active (not closed or cancelled) grouped by month of creation — backlog by age. */
const getMonthlyStillActive = async (user, query = {}) => {
  ensureDashboardAccess(user);
  const months = query.months ? parsePositiveInt(query.months, 'months') : 6;
  const cappedMonths = Math.min(months, 24);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (cappedMonths - 1), 1, 0, 0, 0, 0);

  const terminal = [TicketStatus.CLOSED, TicketStatus.CANCELLED];
  const baseMatch = buildScopedWhere(user, { createdAt: { $gte: start } });
  const rows = await Ticket.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        stillActive: {
          $sum: {
            $cond: [{ $not: [{ $in: ['$status', terminal] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const items = rows.map((r) => ({
    month: `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
    count: r.stillActive ?? 0,
  }));

  return buildChartData(items, 'month');
};

/** Per handling department: total tickets vs completed (closed or cancelled) vs still active. */
const getDepartmentCompletion = async (user) => {
  ensureDashboardAccess(user);
  const scopedWhere = buildScopedWhere(user);
  const terminal = [TicketStatus.CLOSED, TicketStatus.CANCELLED];

  const pipeline = [
    { $match: scopedWhere },
    {
      $group: {
        _id: '$departmentId',
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $in: ['$status', terminal] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: '__dept',
      },
    },
    { $unwind: { path: '$__dept', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        name: { $ifNull: ['$__dept.name', 'Unknown'] },
        pending: { $subtract: ['$total', '$completed'] },
      },
    },
    { $sort: { pending: -1 } },
  ];

  const rows = await Ticket.aggregate(pipeline);
  const items = rows.map((r) => ({
    departmentId: r._id ? String(r._id) : null,
    name: r.name ?? 'Unknown',
    total: r.total ?? 0,
    completed: r.completed ?? 0,
    pending: r.pending ?? 0,
  }));

  return { items };
};

/** Per department detailed KPI split for chief/admin visibility. */
const getDepartmentKpis = async (user) => {
  ensureDashboardAccess(user);
  const scopedWhere = buildScopedWhere(user);

  const rows = await Ticket.aggregate([
    { $match: scopedWhere },
    {
      $group: {
        _id: '$departmentId',
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.OPEN] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.ASSIGNED] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.IN_PROGRESS] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.RESOLVED] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.CLOSED] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.CANCELLED] }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $eq: ['$isOverdue', true] }, 1, 0] } },
        escalated: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.ESCALATED] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: '__dept',
      },
    },
    { $unwind: { path: '$__dept', preserveNullAndEmptyArrays: true } },
    { $addFields: { name: { $ifNull: ['$__dept.name', 'Unknown'] } } },
    { $sort: { total: -1 } },
  ]);

  const items = rows.map((r) => {
    const total = r.total ?? 0;
    const completed = (r.closed ?? 0) + (r.cancelled ?? 0);
    const pending = Math.max(0, total - completed);
    const completionRate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;
    return {
      departmentId: r._id ? String(r._id) : null,
      name: r.name ?? 'Unknown',
      total,
      open: r.open ?? 0,
      assigned: r.assigned ?? 0,
      inProgress: r.inProgress ?? 0,
      resolved: r.resolved ?? 0,
      closed: r.closed ?? 0,
      cancelled: r.cancelled ?? 0,
      overdue: r.overdue ?? 0,
      escalated: r.escalated ?? 0,
      completed,
      pending,
      completionRate,
    };
  });

  return { items };
};

module.exports = {
  ensureDashboardAccess,
  buildTicketReportWhere,
  getSummary,
  getCategoryWise,
  getDepartmentWise,
  getPriorityWise,
  getStatusWise,
  getTechnicianPerformance,
  getMonthlyTrend,
  getMonthlyStillActive,
  getDepartmentCompletion,
  getDepartmentKpis,
};
