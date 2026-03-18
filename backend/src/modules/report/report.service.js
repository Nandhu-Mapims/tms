// Report service backed by MongoDB (Mongoose).
const parsePagination = require('../../utils/parsePagination');
const { buildTicketReportWhere } = require('./reportQueryBuilder');

const Ticket = require('../../models/Ticket.model');

const populateTicket = (query) =>
  query
    .populate({ path: 'departmentId', select: 'name code' })
    .populate({ path: 'categoryId', select: 'name code' })
    .populate({ path: 'subcategoryId', select: 'name code' })
    .populate({ path: 'locationId', select: 'block floor ward room unit' })
    .populate({ path: 'requesterId', select: 'fullName email role' })
    .populate({ path: 'assignedToId', select: 'fullName email role' });

const shape = (t) => ({
  ...(t ?? {}),
  id: t?._id?.toString?.() ?? t?.id,
  department: t?.departmentId ?? null,
  category: t?.categoryId ?? null,
  subcategory: t?.subcategoryId ?? null,
  location: t?.locationId ?? null,
  requester: t?.requesterId ?? null,
  assignedTo: t?.assignedToId ?? null,
  departmentId: t?.departmentId?._id?.toString?.() ?? t?.departmentId ?? null,
  categoryId: t?.categoryId?._id?.toString?.() ?? t?.categoryId ?? null,
  subcategoryId: t?.subcategoryId?._id?.toString?.() ?? t?.subcategoryId ?? null,
  locationId: t?.locationId?._id?.toString?.() ?? t?.locationId ?? null,
  requesterId: t?.requesterId?._id?.toString?.() ?? t?.requesterId ?? null,
  assignedToId: t?.assignedToId?._id?.toString?.() ?? t?.assignedToId ?? null,
});

const getTicketReport = async (query, user) => {
  const pagination = parsePagination(query);
  const where = buildTicketReportWhere(query, user);

  const [items, total] = await Promise.all([
    populateTicket(Ticket.find(where).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit)).lean(),
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

module.exports = { getTicketReport };

