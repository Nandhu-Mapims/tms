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

const ASSIGNABLE_ROLES = [Role.ADMIN, Role.HELPDESK, Role.HOD];
const TRANSFER_TARGET_ROLES = [Role.HELPDESK];
const TICKET_CREATOR_ROLES = [Role.REQUESTER, Role.HOD];

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

const normalizeStatus = (status) => String(status ?? '').trim();

const parseBooleanFilter = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  throw new ApiError(StatusCodes.BAD_REQUEST, 'isOverdue must be a valid boolean');
};

const ensureUnassignedOrSameUser = (user, ticket) => {
  const currentAssigneeId = ticket?.assignedToId?.toString?.() ?? '';
  if (!currentAssigneeId) return;
  const userId = String(user?.id ?? '');
  if (currentAssigneeId === userId) return;
  throw new ApiError(StatusCodes.CONFLICT, 'Ticket is already assigned to another staff member');
};

const ensureAssignedToUser = (user, ticket) => {
  const currentAssigneeId = ticket?.assignedToId?.toString?.() ?? '';
  const userId = String(user?.id ?? '');

  if (currentAssigneeId && currentAssigneeId === userId) return;
  throw new ApiError(StatusCodes.FORBIDDEN, 'Only the assigned helpdesk agent can resolve this ticket');
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

const hasKeyword = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const inferPriorityFromPrompt = (prompt) => {
  const text = String(prompt ?? '').toLowerCase();
  if (!text) return Priority.MEDIUM;
  if (hasKeyword(text, ['critical', 'life support', 'down', 'not working at all', 'emergency', 'urgent'])) return Priority.CRITICAL;
  if (hasKeyword(text, ['high', 'asap', 'immediately', 'blocked'])) return Priority.HIGH;
  if (hasKeyword(text, ['minor', 'low', 'whenever', 'small issue'])) return Priority.LOW;
  return Priority.MEDIUM;
};

const scoreMasterMatch = (prompt, value = '') => {
  const text = String(prompt ?? '').toLowerCase();
  const candidate = String(value ?? '').toLowerCase().trim();
  if (!text || !candidate) return 0;
  if (text.includes(candidate)) return candidate.length + 20;
  const words = candidate.split(/\s+/).filter(Boolean);
  return words.reduce((score, word) => (word.length > 2 && text.includes(word) ? score + word.length : score), 0);
};

const pickBestByPrompt = (items, prompt, projector) => {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) return null;
  const scored = safeItems
    .map((item) => ({ item, score: scoreMasterMatch(prompt, projector(item)) }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.item ?? safeItems[0];
};

const inferTicketClassification = async (prompt) => {
  const [departments, categories, subcategories, locations] = await Promise.all([
    Department.find({ isActive: true }).select('_id name code').lean(),
    Category.find({ isActive: true }).select('_id name code').lean(),
    Subcategory.find({ isActive: true }).select('_id name code categoryId').lean(),
    Location.find({ isActive: true }).select('_id block floor ward room unit').lean(),
  ]);

  if (!departments.length || !categories.length || !subcategories.length || !locations.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Master data is incomplete. Please configure departments, categories, subcategories, and locations.');
  }

  const category = pickBestByPrompt(categories, prompt, (item) => `${item?.name ?? ''} ${item?.code ?? ''}`);
  const eligibleSubcategories = subcategories.filter((item) => String(item?.categoryId ?? '') === String(category?._id ?? ''));
  const subcategory = pickBestByPrompt(
    eligibleSubcategories.length ? eligibleSubcategories : subcategories,
    prompt,
    (item) => `${item?.name ?? ''} ${item?.code ?? ''}`,
  );
  const department = pickBestByPrompt(departments, prompt, (item) => `${item?.name ?? ''} ${item?.code ?? ''}`);
  const location = pickBestByPrompt(locations, prompt, (item) => `${item?.block ?? ''} ${item?.floor ?? ''} ${item?.ward ?? ''} ${item?.room ?? ''} ${item?.unit ?? ''}`);

  return {
    departmentId: department?._id,
    categoryId: category?._id,
    subcategoryId: subcategory?._id,
    locationId: location?._id,
    priority: inferPriorityFromPrompt(prompt),
  };
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
    status: normalizeStatus(t?.status),
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
    requesterResolutionConfirmedAt: t?.requesterResolutionConfirmedAt ?? null,
    dueAt: computeDueAt(t),
  };
};

const findTicketQuery = (identifier) => {
  const normalized = String(identifier ?? '').trim();
  if (!normalized) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ticket id is required');
  }

  return mongoose.Types.ObjectId.isValid(normalized)
    ? Ticket.findById(normalized)
    : Ticket.findOne({ ticketNumber: normalized });
};

const getTicketDocOrThrow = async (identifier) => {
  const ticket = await findTicketQuery(identifier);
  if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  return ticket;
};

const getTicketLeanOrThrow = async (identifier) => {
  const ticket = await populateTicket(findTicketQuery(identifier)).lean();
  if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  return ticket;
};

const buildScopedWhere = (user) => {
  const where = {};
  if (user.role === Role.REQUESTER) where.requesterId = toObjectId(user.id, 'userId');
  return where;
};

const createTicket = async (payload, user) => {
  if (!TICKET_CREATOR_ROLES.includes(user?.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only requesters and heads of department can raise a ticket');
  }

  const prompt = normalizeText(payload?.prompt) || normalizeText(payload?.description) || normalizeText(payload?.title);
  const title = normalizeText(payload?.title) || (prompt ? prompt.slice(0, 120) : null);
  const description = normalizeText(payload?.description) || prompt || null;
  const telecomNumber = normalizeText(payload?.telecomNumber) || null;
  const providedPriority = payload?.priority;

  if (!title) throw new ApiError(StatusCodes.BAD_REQUEST, 'title is required');
  if (!description) throw new ApiError(StatusCodes.BAD_REQUEST, 'prompt is required');

  const hasManualClassification = Boolean(payload?.departmentId && payload?.categoryId && payload?.subcategoryId && payload?.locationId && providedPriority);
  const inferred = hasManualClassification
    ? {
        departmentId: toObjectId(payload?.departmentId, 'departmentId'),
        categoryId: toObjectId(payload?.categoryId, 'categoryId'),
        subcategoryId: toObjectId(payload?.subcategoryId, 'subcategoryId'),
        locationId: toObjectId(payload?.locationId, 'locationId'),
        priority: providedPriority,
      }
    : await inferTicketClassification(prompt);

  validatePriority(inferred.priority);

  const { category } = await validateMasterLinks({
    departmentId: inferred.departmentId,
    categoryId: inferred.categoryId,
    subcategoryId: inferred.subcategoryId,
    locationId: inferred.locationId,
  });

  const ticketNumber = await generateTicketNumber(category.code ?? 'GEN');

  const ticket = await Ticket.create({
    ticketNumber,
    title,
    description,
    priority: inferred.priority,
    status: TicketStatus.OPEN,
    departmentId: inferred.departmentId,
    categoryId: inferred.categoryId,
    subcategoryId: inferred.subcategoryId,
    locationId: inferred.locationId,
    requesterId: toObjectId(user.id, 'userId'),
    assignedToId: null,
    telecomNumber,
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

  const isOverdue = parseBooleanFilter(query?.isOverdue);
  if (isOverdue !== null) {
    where.isOverdue = isOverdue;
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
    const nextStatus = normalizeStatus(query.status);
    validateStatus(nextStatus);
    where.status = nextStatus;
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
    meta: { page, limit, total, count: items.length, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

const getTicketById = async (id, user) => {
  const ticket = await getTicketLeanOrThrow(id);
  ensureCanViewTicket(user, ticket);
  return shapeTicket(ticket);
};

const updateTicket = async (id, payload, user) => {
  const ticket = await getTicketDocOrThrow(id);
  ensureCanViewTicket(user, ticket);
  ensureAssigneeOrStaff(user, ticket);

  const updates = {};
  if (payload?.title !== undefined) updates.title = normalizeText(payload.title);
  if (payload?.description !== undefined) updates.description = normalizeText(payload.description) || null;
  if (payload?.priority !== undefined) {
    validatePriority(payload.priority);
    updates.priority = payload.priority;
  }

  const updated = await Ticket.findByIdAndUpdate(ticket._id, updates, { new: true, runValidators: true });
  await createActivityLog(null, { ticketId: updated._id, userId: user.id, action: 'UPDATED', remarks: 'Ticket updated' });
  const full = await populateTicket(Ticket.findById(updated._id)).lean();
  return shapeTicket(full);
};

const updateStatus = async (id, payload, user) => {
  const status = normalizeStatus(payload?.status);
  validateStatus(status);

  if (status === TicketStatus.CLOSED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Closing a ticket must use the official close or requester confirmation flow');
  }

  const ticket = await getTicketDocOrThrow(id);
  ensureCanViewTicket(user, ticket);
  ensureAssigneeOrStaff(user, ticket);
  ensureUnassignedOrSameUser(user, ticket);

  const oldStatus = ticket.status;
  ticket.status = status;
  if (status === TicketStatus.ASSIGNED && !ticket.assignedToId) {
    ticket.assignedToId = toObjectId(user.id, 'userId');
  }
  if (status === TicketStatus.IN_PROGRESS && !ticket.assignedToId) {
    ticket.assignedToId = toObjectId(user.id, 'userId');
  }
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

const claimTicket = async (id, user) => {
  ensureStaffAccess(user);
  const ticket = await getTicketDocOrThrow(id);
  ensureCanViewTicket(user, ticket);

  ensureUnassignedOrSameUser(user, ticket);

  const oldStatus = ticket.status;
  ticket.assignedToId = toObjectId(user.id, 'userId');
  if ([TicketStatus.NEW, TicketStatus.OPEN].includes(ticket.status)) {
    ticket.status = TicketStatus.ASSIGNED;
  }
  await ticket.save();

  await createActivityLog(null, {
    ticketId: ticket._id,
    userId: user.id,
    action: 'ASSIGNED',
    oldValue: oldStatus,
    newValue: ticket.status,
    remarks: 'Ticket claimed by staff',
  });

  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const transferTicket = async (id, payload, user) => {
  ensureStaffAccess(user);

  const nextAssignedToIdRaw = payload?.assignedToId;
  const note = payload?.note ? String(payload.note) : '';
  const trimmedNote = note.trim();

  const nextAssignedToId = toObjectId(nextAssignedToIdRaw, 'assignedToId');

  const assignee = await User.findOne({ _id: nextAssignedToId, isActive: true, role: { $in: TRANSFER_TARGET_ROLES } })
    .select('_id fullName role')
    .lean();

  if (!assignee) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Selected assignee is not available for transfer');
  }

  const ticket = await getTicketDocOrThrow(id);
  ensureCanViewTicket(user, ticket);
  if (user.role === Role.HELPDESK) {
    ensureAssignedToUser(user, ticket);
  }

  const oldAssigneeId = ticket.assignedToId?.toString?.() ?? null;
  ticket.assignedToId = assignee._id;
  if ([TicketStatus.NEW, TicketStatus.OPEN].includes(ticket.status)) {
    ticket.status = TicketStatus.ASSIGNED;
  }
  await ticket.save();

  const actorName = String(user?.fullName ?? '').trim() || 'Staff';
  const leadershipRemarks = () => {
    const roleLabel = user.role === Role.HOD ? 'HOD' : user.role === Role.ADMIN ? 'Administrator' : '';
    const base = `Direct assignment by ${roleLabel} ${actorName} to ${assignee.fullName}.`;
    return trimmedNote ? `${base} ${trimmedNote}` : base;
  };
  const helpdeskRemarks = () =>
    trimmedNote ? `Transferred to ${assignee.fullName}. ${trimmedNote}` : `Transferred to ${assignee.fullName}.`;

  const transferRemarks = [Role.HOD, Role.ADMIN].includes(user.role) ? leadershipRemarks() : helpdeskRemarks();

  await createActivityLog(null, {
    ticketId: ticket._id,
    userId: user.id,
    action: 'TRANSFERRED',
    oldValue: oldAssigneeId,
    newValue: assignee._id.toString(),
    remarks: transferRemarks,
  });

  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const resolveTicket = async (id, payload, user) => {
  const ticket = await getTicketDocOrThrow(id);
  ensureCanViewTicket(user, ticket);
  ensureAssigneeOrStaff(user, ticket);
  // Helpdesk agents can only resolve tickets assigned to themselves.
  if (user.role === Role.HELPDESK) {
    ensureAssignedToUser(user, ticket);
  }

  if ([TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED].includes(ticket.status)) {
    throw new ApiError(StatusCodes.CONFLICT, 'Ticket cannot be resolved in its current state');
  }

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.RESOLVED;
  ticket.resolvedAt = new Date();
  ticket.requesterResolutionConfirmedAt = null;
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
  const ticket = await getTicketDocOrThrow(id);
  ensureCanViewTicket(user, ticket);
  if (user.role === Role.HELPDESK) {
    ensureAssignedToUser(user, ticket);
  }

  if (ticket.status !== TicketStatus.RESOLVED) {
    throw new ApiError(StatusCodes.CONFLICT, 'Only resolved tickets can be closed');
  }

  const isAdmin = user.role === Role.ADMIN;
  if (!isAdmin && !ticket.requesterResolutionConfirmedAt) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'The requester must confirm that the resolution worked before this ticket can be closed.',
    );
  }

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.CLOSED;
  ticket.closedAt = new Date();
  await ticket.save();
  await createActivityLog(null, { ticketId: ticket._id, userId: user.id, action: 'CLOSED', oldValue: oldStatus, newValue: ticket.status, remarks: 'Ticket closed' });
  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const REQUESTER_CONFIRM_NOTE_MAX_LEN = 500;

const confirmResolutionAndClose = async (id, payload, user) => {
  const ticket = await getTicketDocOrThrow(id);
  ensureCanViewTicket(user, ticket);

  const requesterId = ticket.requesterId?.toString?.() ?? String(ticket.requesterId ?? '');
  const userId = String(user?.id ?? '');
  if (!requesterId || requesterId !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only the ticket requester can confirm the resolution');
  }

  if (ticket.status !== TicketStatus.RESOLVED) {
    throw new ApiError(StatusCodes.CONFLICT, 'You can only confirm after the ticket has been marked resolved by support.');
  }

  const noteRaw = payload?.note !== undefined && payload?.note !== null ? String(payload.note) : '';
  const noteTrimmed = noteRaw.trim().slice(0, REQUESTER_CONFIRM_NOTE_MAX_LEN);

  const oldStatus = ticket.status;
  const now = new Date();
  ticket.requesterResolutionConfirmedAt = now;
  ticket.status = TicketStatus.CLOSED;
  ticket.closedAt = now;
  await ticket.save();

  await createActivityLog(null, {
    ticketId: ticket._id,
    userId: user.id,
    action: 'REQUESTER_CONFIRMED_RESOLUTION',
    oldValue: oldStatus,
    newValue: ticket.status,
    remarks: noteTrimmed || 'Requester confirmed the resolution; ticket closed.',
  });

  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const reopenTicket = async (id, user) => {
  ensureStaffAccess(user);
  const ticket = await getTicketDocOrThrow(id);
  ensureCanViewTicket(user, ticket);
  if (user.role === Role.HELPDESK) {
    ensureAssignedToUser(user, ticket);
  }
  const oldStatus = ticket.status;
  ticket.status = TicketStatus.REOPENED;
  ticket.resolvedAt = null;
  ticket.closedAt = null;
  ticket.requesterResolutionConfirmedAt = null;
  await ticket.save();
  await createActivityLog(null, { ticketId: ticket._id, userId: user.id, action: 'REOPENED', oldValue: oldStatus, newValue: ticket.status, remarks: 'Ticket reopened' });
  const full = await populateTicket(Ticket.findById(ticket._id)).lean();
  return shapeTicket(full);
};

const escalateTicket = async (id, payload, user) => {
  if (!ESCALATION_ROLES.includes(user.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only authorized hospital roles can escalate tickets');
  }

  const ticket = await getTicketDocOrThrow(id);
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
  return {
    items: items.map(shapeTicket),
    meta: { page, limit, total, count: items.length, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  updateStatus,
  claimTicket,
  transferTicket,
  resolveTicket,
  closeTicket,
  confirmResolutionAndClose,
  reopenTicket,
  getPendingEscalations,
  escalateTicket,
};
