const { prisma } = require('../../config/database');
const parsePagination = require('../../utils/parsePagination');
const { buildTicketReportWhere } = require('./reportQueryBuilder');

const buildReportInclude = () => ({
  department: { select: { id: true, name: true, code: true } },
  category: { select: { id: true, name: true, code: true } },
  subcategory: { select: { id: true, name: true, code: true } },
  location: { select: { id: true, block: true, floor: true, ward: true, room: true, unit: true } },
  requester: { select: { id: true, fullName: true, email: true, role: true } },
  assignedTo: { select: { id: true, fullName: true, email: true, role: true } },
});

const getTicketReport = async (query, user) => {
  const pagination = parsePagination(query);
  const where = buildTicketReportWhere(query, user);

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: buildReportInclude(),
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    items,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    },
    filtersApplied: {
      startDate: query.startDate || null,
      endDate: query.endDate || null,
      departmentId: query.departmentId || null,
      categoryId: query.categoryId || null,
      priority: query.priority || null,
      status: query.status || null,
      assignedToId: query.assignedToId || null,
      requesterId: user.role === 'REQUESTER' ? user.id : query.requesterId || null,
    },
  };
};

module.exports = {
  getTicketReport,
};
