const { Role, TicketStatus } = require('@prisma/client');
const { StatusCodes } = require('http-status-codes');
const { prisma } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const parsePositiveInt = require('../../utils/parsePositiveInt');

const DASHBOARD_FULL_ACCESS_ROLES = [Role.ADMIN, Role.HOD, Role.HELPDESK];

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

const startOfMonth = (year, monthIndex) => new Date(year, monthIndex, 1, 0, 0, 0, 0);
const endOfMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

const ensureDashboardAccess = (user) => {
  if (DASHBOARD_FULL_ACCESS_ROLES.includes(user.role) || user.role === Role.REQUESTER) {
    return;
  }

  throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access dashboard or reports');
};

const buildScopedWhere = (user, filters = {}) => {
  ensureDashboardAccess(user);

  const where = { ...filters };

  if (user.role === Role.REQUESTER) {
    where.requesterId = user.id;
  }

  return where;
};

const buildDateRangeWhere = (query) => {
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
  const where = buildScopedWhere(user);
  const createdAt = buildDateRangeWhere(query);

  if (createdAt) where.createdAt = createdAt;
  if (query.departmentId) where.departmentId = parsePositiveInt(query.departmentId, 'departmentId');
  if (query.categoryId) where.categoryId = parsePositiveInt(query.categoryId, 'categoryId');
  if (query.assignedToId) where.assignedToId = parsePositiveInt(query.assignedToId, 'assignedToId');
  if (query.requesterId) where.requesterId = parsePositiveInt(query.requesterId, 'requesterId');
  if (query.priority) where.priority = query.priority;
  if (query.status) where.status = query.status;

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
    prisma.ticket.count({ where: scopedWhere }),
    prisma.ticket.count({ where: { ...scopedWhere, status: TicketStatus.OPEN } }),
    prisma.ticket.count({ where: { ...scopedWhere, status: TicketStatus.ASSIGNED } }),
    prisma.ticket.count({ where: { ...scopedWhere, status: TicketStatus.IN_PROGRESS } }),
    prisma.ticket.count({ where: { ...scopedWhere, isOverdue: true } }),
    prisma.ticket.count({
      where: {
        ...scopedWhere,
        resolvedAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.ticket.count({
      where: {
        ...scopedWhere,
        closedAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.ticket.count({ where: { ...scopedWhere, status: TicketStatus.ESCALATED } }),
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

const getCategoryWise = async (user) => {
  const rows = await prisma.ticket.groupBy({
    by: ['categoryId'],
    where: buildScopedWhere(user),
    _count: { _all: true },
    orderBy: { categoryId: 'asc' },
  });

  const categoryIds = rows.map((row) => row.categoryId);
  const categories = categoryIds.length
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, code: true },
      })
    : [];

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const items = rows.map((row) => ({
    categoryId: row.categoryId,
    name: categoryMap.get(row.categoryId)?.name || 'Unknown Category',
    code: categoryMap.get(row.categoryId)?.code || 'NA',
    count: row._count._all,
  }));

  return buildChartData(items, 'name');
};

const getDepartmentWise = async (user) => {
  const rows = await prisma.ticket.groupBy({
    by: ['departmentId'],
    where: buildScopedWhere(user),
    _count: { _all: true },
    orderBy: { departmentId: 'asc' },
  });

  const departmentIds = rows.map((row) => row.departmentId);
  const departments = departmentIds.length
    ? await prisma.department.findMany({
        where: { id: { in: departmentIds } },
        select: { id: true, name: true, code: true },
      })
    : [];

  const departmentMap = new Map(departments.map((department) => [department.id, department]));
  const items = rows.map((row) => ({
    departmentId: row.departmentId,
    name: departmentMap.get(row.departmentId)?.name || 'Unknown Department',
    code: departmentMap.get(row.departmentId)?.code || 'NA',
    count: row._count._all,
  }));

  return buildChartData(items, 'name');
};

const getPriorityWise = async (user) => {
  const rows = await prisma.ticket.groupBy({
    by: ['priority'],
    where: buildScopedWhere(user),
    _count: { _all: true },
    orderBy: { priority: 'asc' },
  });

  const items = rows.map((row) => ({
    priority: row.priority,
    count: row._count._all,
  }));

  return buildChartData(items, 'priority');
};

const getStatusWise = async (user) => {
  const rows = await prisma.ticket.groupBy({
    by: ['status'],
    where: buildScopedWhere(user),
    _count: { _all: true },
    orderBy: { status: 'asc' },
  });

  const items = rows.map((row) => ({
    status: row.status,
    count: row._count._all,
  }));

  return buildChartData(items, 'status');
};

const getTechnicianPerformance = async (user) => {
  ensureDashboardAccess(user);

  if (!DASHBOARD_FULL_ACCESS_ROLES.includes(user.role)) {
    return buildChartData([], 'name');
  }

  const [assignedRows, resolvedRows] = await Promise.all([
    prisma.ticket.groupBy({
      by: ['assignedToId'],
      where: {
        assignedToId: { not: null },
      },
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ['assignedToId'],
      where: {
        assignedToId: { not: null },
        status: TicketStatus.RESOLVED,
      },
      _count: { _all: true },
    }),
  ]);

  const technicianIds = Array.from(
    new Set([...assignedRows.map((row) => row.assignedToId), ...resolvedRows.map((row) => row.assignedToId)].filter(Boolean))
  );

  const technicians = technicianIds.length
    ? await prisma.user.findMany({
        where: { id: { in: technicianIds } },
        select: { id: true, fullName: true, email: true, role: true },
      })
    : [];

  const technicianMap = new Map(technicians.map((tech) => [tech.id, tech]));
  const resolvedMap = new Map(resolvedRows.map((row) => [row.assignedToId, row._count._all]));

  const items = assignedRows.map((row) => ({
    technicianId: row.assignedToId,
    name: technicianMap.get(row.assignedToId)?.fullName || 'Unknown Technician',
    assignedCount: row._count._all,
    resolvedCount: resolvedMap.get(row.assignedToId) || 0,
  }));

  return {
    labels: items.map((item) => item.name),
    assignedSeries: items.map((item) => item.assignedCount),
    resolvedSeries: items.map((item) => item.resolvedCount),
    items,
  };
};

const getMonthlyTrend = async (user, query) => {
  const today = new Date();
  const months = query.months ? parsePositiveInt(query.months, 'months') : 6;
  if (months > 24) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'months cannot be greater than 24');
  }

  const items = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const from = startOfMonth(monthDate.getFullYear(), monthDate.getMonth());
    const to = endOfMonth(monthDate.getFullYear(), monthDate.getMonth());

    const count = await prisma.ticket.count({
      where: buildScopedWhere(user, {
        createdAt: {
          gte: from,
          lte: to,
        },
      }),
    });

    items.push({
      month: monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      count,
    });
  }

  return buildChartData(items, 'month');
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
};
