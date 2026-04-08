// Report service backed by MongoDB (Mongoose).
const parsePagination = require('../../utils/parsePagination');
const parsePositiveInt = require('../../utils/parsePositiveInt');
const { TicketStatus } = require('../../models/enums');
const { buildTicketReportWhere, buildReportAggregationWhere } = require('./reportQueryBuilder');

const Ticket = require('../../models/Ticket.model');

const populateTicket = (query) =>
  query
    .populate({ path: 'departmentId', select: 'name code' })
    .populate({ path: 'requesterDepartmentId', select: 'name code' })
    .populate({ path: 'categoryId', select: 'name code' })
    .populate({ path: 'subcategoryId', select: 'name code' })
    .populate({ path: 'locationId', select: 'block floor ward room unit' })
    .populate({ path: 'requesterId', select: 'fullName email role empId' })
    .populate({ path: 'assignedToId', select: 'fullName email role empId' });

const closureSummary = (t) => {
  const status = t?.status;
  if (status !== TicketStatus.CLOSED) return null;
  if (t?.requesterResolutionConfirmedAt) {
    return 'Closed after requester confirmation';
  }
  return 'Closed by staff or administrator';
};

const shape = (t) => ({
  ...(t ?? {}),
  id: t?._id?.toString?.() ?? t?.id,
  department: t?.departmentId ?? null,
  requesterDepartment: t?.requesterDepartmentId ?? null,
  category: t?.categoryId ?? null,
  subcategory: t?.subcategoryId ?? null,
  location: t?.locationId ?? null,
  requester: t?.requesterId ?? null,
  assignedTo: t?.assignedToId ?? null,
  departmentId: t?.departmentId?._id?.toString?.() ?? t?.departmentId ?? null,
  requesterDepartmentId: t?.requesterDepartmentId?._id?.toString?.() ?? t?.requesterDepartmentId ?? null,
  categoryId: t?.categoryId?._id?.toString?.() ?? t?.categoryId ?? null,
  subcategoryId: t?.subcategoryId?._id?.toString?.() ?? t?.subcategoryId ?? null,
  locationId: t?.locationId?._id?.toString?.() ?? t?.locationId ?? null,
  requesterId: t?.requesterId?._id?.toString?.() ?? t?.requesterId ?? null,
  assignedToId: t?.assignedToId?._id?.toString?.() ?? t?.assignedToId ?? null,
  closureSummary: closureSummary(t),
});

const resolveSort = (query = {}) => {
  const raw = String(query.sort ?? '').trim().toLowerCase();
  if (raw === 'closed' || raw === 'closedat') return { closedAt: -1 };
  if (raw === 'resolved' || raw === 'resolvedat') return { resolvedAt: -1 };
  return { createdAt: -1 };
};

const getTicketReport = async (query, user) => {
  const pagination = parsePagination(query);
  const where = buildTicketReportWhere(query, user);
  const sort = resolveSort(query);

  const [items, total] = await Promise.all([
    populateTicket(Ticket.find(where).sort(sort).skip(pagination.skip).limit(pagination.limit)).lean(),
    Ticket.countDocuments(where),
  ]);

  return {
    items: items.map(shape),
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    },
    filtersApplied: {
      month: query.month || null,
      startDate: query.startDate || null,
      endDate: query.endDate || null,
      periodField:
        query.periodField === 'closed'
          ? 'closed'
          : query.periodField === 'all'
            ? 'all'
            : 'created',
      departmentId: query.departmentId || null,
      categoryId: query.categoryId || null,
      priority: query.priority || null,
      status: query.status || null,
      assignedToId: query.assignedToId || null,
      requesterId: user.role === 'REQUESTER' ? user.id : query.requesterId || null,
      sort: query.sort || 'createdAt',
    },
  };
};

const monthLabel = (y, m) => `${y}-${String(m).padStart(2, '0')}`;

const getMonthlyBreakdown = async (query, user) => {
  const baseWhere = buildReportAggregationWhere(query, user);
  const monthsBack = query.monthsBack != null ? parsePositiveInt(query.monthsBack, 'monthsBack') : 12;
  const capped = Math.min(monthsBack, 36);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (capped - 1), 1, 0, 0, 0, 0);

  const createdMatch = { ...baseWhere, createdAt: { $gte: start } };
  const closedMatch = { ...baseWhere, closedAt: { $gte: start, $ne: null } };

  const [createdRows, closedRows] = await Promise.all([
    Ticket.aggregate([
      { $match: createdMatch },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Ticket.aggregate([
      { $match: closedMatch },
      {
        $group: {
          _id: { y: { $year: '$closedAt' }, m: { $month: '$closedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
  ]);

  const map = (rows) =>
    rows.map((r) => ({
      month: monthLabel(r._id.y, r._id.m),
      count: r.count ?? 0,
    }));

  return {
    createdByMonth: map(createdRows),
    closedByMonth: map(closedRows),
  };
};

const escapeCsv = (value) => {
  const normalized = value == null ? '' : String(value);
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

const getTicketReportExport = async (query, user) => {
  const where = buildTicketReportWhere(query, user);
  const sort = resolveSort(query);
  const maxRowsRaw = query.maxRows != null ? parsePositiveInt(query.maxRows, 'maxRows') : 5000;
  const maxRows = Math.min(maxRowsRaw, 10000);

  const items = await populateTicket(Ticket.find(where).sort(sort).limit(maxRows)).lean();
  const rows = items.map(shape);

  const headers = [
    'Ticket Number',
    'Issue Title',
    'Issue Description',
    'Handling Department',
    'Requester Department',
    'Assigned To',
    'Assigned EmpId',
    'Raised By',
    'Requester EmpId',
    'Status',
    'Priority',
    'Resolved At',
    'Closed At',
    'Closure Summary',
    'Created At',
  ];

  const lines = rows.map((r) =>
    [
      r.ticketNumber ?? '',
      r.title ?? '',
      r.description ?? '',
      r.department?.name ?? '',
      r.requesterDepartment?.name ?? r.department?.name ?? '',
      r.assignedTo?.fullName ?? '',
      r.assignedTo?.empId ?? '',
      r.requester?.fullName ?? '',
      r.requester?.empId ?? '',
      r.status ?? '',
      r.priority ?? '',
      r.resolvedAt ?? '',
      r.closedAt ?? '',
      r.closureSummary ?? '',
      r.createdAt ?? '',
    ]
      .map(escapeCsv)
      .join(',')
  );

  return {
    csv: [headers.map(escapeCsv).join(','), ...lines].join('\n'),
    exportedCount: rows.length,
  };
};

module.exports = { getTicketReport, getMonthlyBreakdown, getTicketReportExport };
