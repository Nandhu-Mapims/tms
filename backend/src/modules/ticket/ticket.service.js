// Ticket service backed by MongoDB (Mongoose).
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

const ApiError = require('../../utils/ApiError');
const parsePagination = require('../../utils/parsePagination');
const { Role, Priority, TicketStatus } = require('../../models/enums');
const { STAFF_VIEW_ROLES, STAFF_ACTION_ROLES, ESCALATION_ROLES } = require('./ticket.constants');
const { createActivityLog } = require('./ticketActivity.service');
const { ensureCanViewTicket } = require('./ticket.shared');

const Department = require('../../models/Department.model');
const Category = require('../../models/Category.model');
const Subcategory = require('../../models/Subcategory.model');
const Location = require('../../models/Location.model');
const User = require('../../models/User.model');
const Ticket = require('../../models/Ticket.model');

const ASSIGNABLE_ROLES = [Role.ADMIN, Role.HELPDESK, Role.HOD, Role.TECHNICIAN];

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);

const toObjectId = (value, fieldName) => {
  const normalized = String(value ?? '');
  if (!normalized || !mongoose.Types.ObjectId.isValid(normalized)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${fieldName} must be a valid id`);
  }
  return new mongoose.Types.ObjectId(normalized);
};

const validatePriority = (priority) => {
  if (!Object.values(Priority).includes(priority)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid priority supplied');
  }
};

const validateStatus = (status) => {
  if (!Object.values(TicketStatus).includes(status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ticket status supplied');
  }
};

const ensureStaffAccess = (user) => {
  if (!STAFF_ACTION_ROLES.includes(user.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only hospital operations roles can perform this action');
  }
};

const ensureAssigneeOrStaff = (user, ticket) => {
  if (STAFF_VIEW_ROLES.includes(user.role)) return;
  const userId = String(user?.id ?? '');
  const assignedToId = ticket?.assignedToId?.toString?.() ?? '';
  if (assignedToId && assignedToId === userId) return;
  throw new ApiError(StatusCodes.FORBIDDEN, 'Only the assigned user or hospital operations roles can perform this action');
};

const computeDueAt = (ticket) => ticket?.resolutionDueAt ?? ticket?.firstResponseDueAt ?? null;

const buildTicketNumber = ({ categoryCode, year, runningNumber }) =>
  `TKT-${categoryCode}-${year}-${String(runningNumber).padStart(4, '0')}`;

const generateTicketNumber = async (categoryCode) => {
  const year = new Date().getUTCFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const count = await Ticket.countDocuments({ createdAt: { $gte: start, $lt: end } });
  return buildTicketNumber({ categoryCode, year, runningNumber: count + 1 });
};

const validateMasterLinks = async ({ departmentId, categoryId, subcategoryId, locationId }) => {
  const [department, category, subcategory, location] = await Promise.all([
    Department.findOne({ _id: departmentId, isActive: true }).lean(),
    Category.findOne({ _id: categoryId, isActive: true }).lean(),
    Subcategory.findOne({ _id: subcategoryId, isActive: true }).lean(),
    Location.findOne({ _id: locationId, isActive: true }).lean(),
  ]);

  if (!department) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid department selected');
  if (!category) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid category selected');
  if (!subcategory) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid subcategory selected');
  if (!location) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid location selected');

  return { department, category, subcategory, location };
};

const populateTicket = (query) =>
  query
    .populate({ path: 'departmentId', select: 'name code' })
    .populate({ path: 'categoryId', select: 'name code' })
    .populate({ path: 'subcategoryId', select: 'name code categoryId' })
    .populate({ path: 'locationId', select: 'block floor ward room unit' })
    .populate({ path: 'requesterId', select: 'fullName email phone role' })
    .populate({ path: 'assignedToId', select: 'fullName email phone role' });

const shapeTicket = (ticket) => {
  const t = ticket?.toObject ? ticket.toObject() : ticket;
  return {
    ...t,
    id: t?._id?.toString?.() ?? t?.id,
    department: t?.departmentId ?? null,
    category: t?.categoryId ?? null,
    subcategory: t?.subcategoryId ?? null,
    location: t?.locationId ?? null,
    requester: t?.requesterId ?? null,
    assignedTo: t?.assignedToId ?? null,
    departmentId: t?.departmentId?._id?.toString?.() ?? t?.departmentId,
    categoryId: t?.categoryId?._id?.toString?.() ?? t?.categoryId,
    subcategoryId: t?.subcategoryId?._id?.toString?.() ?? t?.subcategoryId,
    locationId: t?.locationId?._id?.toString?.() ?? t?.locationId,
    requesterId: t?.requesterId?._id?.toString?.() ?? t?.requesterId,
    assignedToId: t?.assignedToId?._id?.toString?.() ?? t?.assignedToId ?? null,
    dueAt: computeDueAt(t),
  };
};

const buildScopedWhere = (user) => {
  const where = {};
  if (user.role === Role.REQUESTER) where.requesterId = toObjectId(user.id, 'userId');
  if (user.role === Role.TECHNICIAN) where.assignedToId = toObjectId(user.id, 'userId');
  return where;
};

const createTicket = async (payload, user) => {
  if (user?.role !== Role.REQUESTER) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only requesters can raise a ticket');
  }

  const title = normalizeText(payload?.title);
  const description = normalizeText(payload?.description) || null;
  const priority = payload?.priority;

  if (!title) throw new ApiError(StatusCodes.BAD_REQUEST, 'title is required');
  validatePriority(priority);

  const departmentId = toObjectId(payload?.departmentId, 'departmentId');
  const categoryId = toObjectId(payload?.categoryId, 'categoryId');
  const subcategoryId = toObjectId(payload?.subcategoryId, 'subcategoryId');
  const locationId = toObjectId(payload?.locationId, 'locationId');

  const { category } = await validateMasterLinks({ departmentId, categoryId, subcategoryId, locationId });

  const ticketNumber = await generateTicketNumber(category.code ?? 'GEN');

  const ticket = await Ticket.create({
    ticketNumber,
    title,
    description,
    priority,
    status: TicketStatus.OPEN,
    departmentId,
    categoryId,
    subcategoryId,
    locationId,
    requesterId: toObjectId(user.id, 'userId'),
    assignedToId: null,
  });

  await createActivityLog(null, {
    ticketId: ticket._id,
    userId: user.id,
    action: 'CREATED',
    newValue: ticket.status,
    remarks: 'Ticket created',
  });

  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const getTickets = async (query, user) => {
  const { page, limit, skip } = parsePagination(query);
  const where = buildScopedWhere(user);

  if (query?.categoryId) {
    where.categoryId = toObjectId(query.categoryId, 'categoryId');
  }

  if (query?.departmentId) {
    where.departmentId = toObjectId(query.departmentId, 'departmentId');
  }

  if (query?.assignedToId) {
    where.assignedToId = toObjectId(query.assignedToId, 'assignedToId');
  }

  if (query?.startDate || query?.endDate) {
    const createdAt = {};
    if (query.startDate) {
      const start = new Date(query.startDate);
      if (Number.isNaN(start.getTime())) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid startDate supplied');
      createdAt.$gte = start;
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      if (Number.isNaN(end.getTime())) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid endDate supplied');
      end.setHours(23, 59, 59, 999);
      createdAt.$lte = end;
    }
    if (Object.keys(createdAt).length) where.createdAt = createdAt;
  }

  if (query?.status) {
    validateStatus(query.status);
    where.status = query.status;
  }
  if (query?.priority) {
    validatePriority(query.priority);
    where.priority = query.priority;
  }
  if (query?.search && String(query.search).trim()) {
    const term = String(query.search).trim();
    where.$or = [{ ticketNumber: { $regex: term, $options: 'i' } }, { title: { $regex: term, $options: 'i' } }];
  }

  const [items, total] = await Promise.all([
    populateTicket(Ticket.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit)).lean(),
    Ticket.countDocuments(where),
  ]);

  return {
    items: items.map(shapeTicket),
    meta: { page, limit, total, count: items.length },
  };
};

const getTicketById = async (id, user) => {
  const ticket = await populateTicket(Ticket.findById(id)).lean();
  if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  ensureCanViewTicket(user, ticket);
  return shapeTicket(ticket);
};

const updateTicket = async (id, payload, user) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  ensureCanViewTicket(user, ticket);
  ensureAssigneeOrStaff(user, ticket);

  const updates = {};
  if (payload?.title !== undefined) updates.title = normalizeText(payload.title);
  if (payload?.description !== undefined) updates.description = normalizeText(payload.description) || null;
  if (payload?.priority !== undefined) {
    validatePriority(payload.priority);
    updates.priority = payload.priority;
  }

  const updated = await Ticket.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  await createActivityLog(null, { ticketId: updated._id, userId: user.id, action: 'UPDATED', remarks: 'Ticket updated' });
  const full = await populateTicket(Ticket.findById(updated._id)).lean();
  return shapeTicket(full);
};

const assignTicket = async (id, payload, user) => {
  ensureStaffAccess(user);
  const assignedToId = toObjectId(payload?.assignedToId, 'assignedToId');

  const assignee = await User.findById(assignedToId).lean();
  if (!assignee || !ASSIGNABLE_ROLES.includes(assignee.role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'assignedToId is invalid');
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');

  ticket.assignedToId = assignedToId;
  ticket.status = TicketStatus.ASSIGNED;
  await ticket.save();

  await createActivityLog(null, {
    ticketId: ticket._id,
    userId: user.id,
    action: 'ASSIGNED',
    newValue: assignee.fullName,
    remarks: 'Ticket assigned',
  });

  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const updateStatus = async (id, payload, user) => {
  const status = payload?.status;
  validateStatus(status);

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  ensureCanViewTicket(user, ticket);
  ensureAssigneeOrStaff(user, ticket);

  const oldStatus = ticket.status;
  ticket.status = status;
  await ticket.save();

  await createActivityLog(null, {
    ticketId: ticket._id,
    userId: user.id,
    action: 'STATUS_CHANGED',
    oldValue: oldStatus,
    newValue: status,
    remarks: 'Ticket status updated',
  });

  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const resolveTicket = async (id, payload, user) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  ensureCanViewTicket(user, ticket);
  ensureAssigneeOrStaff(user, ticket);

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.RESOLVED;
  ticket.resolvedAt = new Date();
  await ticket.save();

  await createActivityLog(null, {
    ticketId: ticket._id,
    userId: user.id,
    action: 'RESOLVED',
    oldValue: oldStatus,
    newValue: ticket.status,
    remarks: payload?.resolutionNote ? String(payload.resolutionNote) : 'Ticket resolved',
  });

  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const closeTicket = async (id, user) => {
  ensureStaffAccess(user);
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  const oldStatus = ticket.status;
  ticket.status = TicketStatus.CLOSED;
  ticket.closedAt = new Date();
  await ticket.save();
  await createActivityLog(null, { ticketId: ticket._id, userId: user.id, action: 'CLOSED', oldValue: oldStatus, newValue: ticket.status, remarks: 'Ticket closed' });
  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const reopenTicket = async (id, user) => {
  ensureStaffAccess(user);
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  const oldStatus = ticket.status;
  ticket.status = TicketStatus.REOPENED;
  ticket.resolvedAt = null;
  ticket.closedAt = null;
  await ticket.save();
  await createActivityLog(null, { ticketId: ticket._id, userId: user.id, action: 'REOPENED', oldValue: oldStatus, newValue: ticket.status, remarks: 'Ticket reopened' });
  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const escalateTicket = async (id, payload, user) => {
  if (!ESCALATION_ROLES.includes(user.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only authorized hospital roles can escalate tickets');
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  const oldStatus = ticket.status;
  ticket.status = TicketStatus.ESCALATED;
  ticket.escalatedAt = new Date();
  ticket.isOverdue = true;
  await ticket.save();
  await createActivityLog(null, { ticketId: ticket._id, userId: user.id, action: 'ESCALATED', oldValue: oldStatus, newValue: ticket.status, remarks: payload?.remarks ? String(payload.remarks) : 'Ticket escalated' });
  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const getPendingEscalations = async (query, user) => {
  ensureStaffAccess(user);
  const { page, limit, skip } = parsePagination(query);
  const where = { status: TicketStatus.ESCALATED };
  const [items, total] = await Promise.all([
    populateTicket(Ticket.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit)).lean(),
    Ticket.countDocuments(where),
  ]);
  return { items: items.map(shapeTicket), meta: { page, limit, total, count: items.length } };
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  assignTicket,
  updateStatus,
  resolveTicket,
  closeTicket,
  reopenTicket,
  getPendingEscalations,
  escalateTicket,
};
