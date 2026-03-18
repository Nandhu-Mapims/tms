const { Prisma, Priority, Role, TicketStatus } = require('../../../generated/prisma');
const { StatusCodes } = require('http-status-codes');
const { prisma } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const parsePagination = require('../../utils/parsePagination');
const parsePositiveInt = require('../../utils/parsePositiveInt');
const { TICKET_INCLUDE, buildDateRangeFilter, buildTicketSearchFilter, generateTicketNumber } = require('./ticket.utils');
const { STAFF_VIEW_ROLES, STAFF_ACTION_ROLES, ESCALATION_ROLES } = require('./ticket.constants');
const { createActivityLog } = require('./ticketActivity.service');
const { ensureCanViewTicket } = require('./ticket.shared');
const { calculateSlaDeadlines, getSlaState, getPendingEscalations: getPendingEscalationsFromSla, markOverdueTickets } = require('./ticketSla.service');

const REOPEN_ROLES = [Role.ADMIN, Role.HELPDESK, Role.HOD];
const ASSIGNABLE_ROLES = [Role.ADMIN, Role.HELPDESK, Role.HOD, Role.TECHNICIAN];
const PROGRESS_STATUSES = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD, TicketStatus.ESCALATED];

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);

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

const validateNonEmptyString = (value, fieldName) => {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${fieldName} is required`);
  }

  return normalized;
};

const ensureCanCreateTicket = () => {
  /* Any authenticated user may create a ticket. */
};

const ensureNotClosedForEdit = (ticket) => {
  if (ticket.status === TicketStatus.CLOSED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Closed tickets cannot be edited. Use reopen if changes are needed');
  }
};

const ensureStaffAccess = (user) => {
  if (!STAFF_ACTION_ROLES.includes(user.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only hospital operations roles can perform this action');
  }
};

const ensureAssignedUserCanUpdate = (user, ticket) => {
  if (STAFF_VIEW_ROLES.includes(user.role)) {
    return;
  }

  if (ticket.assignedToId === user.id) {
    return;
  }

  throw new ApiError(StatusCodes.FORBIDDEN, 'Only the assigned user or hospital operations roles can update progress');
};

const validateMasterLinks = async (tx, payload) => {
  const departmentId = parsePositiveInt(payload.departmentId, 'departmentId');
  const categoryId = parsePositiveInt(payload.categoryId, 'categoryId');
  const subcategoryId = parsePositiveInt(payload.subcategoryId, 'subcategoryId');
  const locationId = parsePositiveInt(payload.locationId, 'locationId');

  const [department, category, subcategory, location] = await Promise.all([
    tx.department.findFirst({ where: { id: departmentId, isActive: true } }),
    tx.category.findFirst({ where: { id: categoryId, isActive: true } }),
    tx.subcategory.findFirst({ where: { id: subcategoryId, isActive: true } }),
    tx.location.findFirst({ where: { id: locationId, isActive: true } }),
  ]);

  if (!department) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Selected department is invalid or inactive');
  }

  if (!category) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Selected category is invalid or inactive');
  }

  if (!subcategory) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Selected subcategory is invalid or inactive');
  }

  if (subcategory.categoryId !== category.id) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Selected subcategory does not belong to the selected category');
  }

  if (!location) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Selected location is invalid or inactive');
  }

  return {
    department,
    category,
    subcategory,
    location,
    departmentId,
    categoryId,
    subcategoryId,
    locationId,
  };
};

const createTicketTx = async (payload, requester) => {
  return prisma.$transaction(
    async (tx) => {
      const title = validateNonEmptyString(payload.title, 'title');
      const description = validateNonEmptyString(payload.description, 'description');
      const requesterContact = validateNonEmptyString(payload.requesterContact, 'requesterContact');

      validatePriority(payload.priority);

      const links = await validateMasterLinks(tx, payload);
      const slaDeadlines = await calculateSlaDeadlines({ priority: payload.priority }, tx);
      const ticketNumber = await generateTicketNumber(tx, links.category.code);

      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          title,
          description,
          departmentId: links.departmentId,
          categoryId: links.categoryId,
          subcategoryId: links.subcategoryId,
          locationId: links.locationId,
          assetName: normalizeText(payload.assetName) || null,
          assetId: normalizeText(payload.assetId) || null,
          priority: payload.priority,
          status: TicketStatus.NEW,
          requesterId: requester.id,
          requesterContact,
          dueAt: slaDeadlines.resolutionDueAt,
          isOverdue: false,
        },
        include: TICKET_INCLUDE,
      });

      await createActivityLog(tx, {
        ticketId: ticket.id,
        userId: requester.id,
        action: 'TICKET_CREATED',
        newValue: {
          ticketNumber: ticket.ticketNumber,
          priority: ticket.priority,
          status: ticket.status,
          dueAt: ticket.dueAt,
        },
        remarks: 'Hospital ticket created',
      });

      return ticket;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
};

const createTicket = async (payload, requester) => {
  ensureCanCreateTicket();

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await createTicketTx(payload, requester);
    } catch (error) {
      if (error.code === 'P2002' && attempt < maxAttempts) {
        continue;
      }

      throw error;
    }
  }

  throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Unable to generate a unique ticket number');
};

const buildListWhere = (query, user) => {
  const createdAt = buildDateRangeFilter(query.startDate, query.endDate);
  const filters = {
    ...(query.status && { status: query.status }),
    ...(query.priority && { priority: query.priority }),
    ...(query.categoryId && { categoryId: parsePositiveInt(query.categoryId, 'categoryId') }),
    ...(query.departmentId && { departmentId: parsePositiveInt(query.departmentId, 'departmentId') }),
    ...(query.assignedToId && { assignedToId: parsePositiveInt(query.assignedToId, 'assignedToId') }),
    ...(query.requesterId && { requesterId: parsePositiveInt(query.requesterId, 'requesterId') }),
    ...(createdAt && { createdAt }),
    ...buildTicketSearchFilter(query.search),
  };

  if (STAFF_VIEW_ROLES.includes(user.role)) {
    return filters;
  }

  if (user.role === Role.REQUESTER) {
    return {
      ...filters,
      requesterId: user.id,
    };
  }

  return {
    ...filters,
    assignedToId: user.id,
  };
};

const getTickets = async (query, user) => {
  if (query.status) validateStatus(query.status);
  if (query.priority) validatePriority(query.priority);

  await markOverdueTickets();

  const pagination = parsePagination(query);
  const where = buildListWhere(query, user);

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: TICKET_INCLUDE,
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
  };
};

const getTicketById = async (id, user) => {
  await markOverdueTickets();

  const ticketId = parsePositiveInt(id, 'id');
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: TICKET_INCLUDE,
  });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  ensureCanViewTicket(user, ticket);
  return ticket;
};

const updateTicket = async (id, payload, user) => {
  const ticketId = parsePositiveInt(id, 'id');
  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  ensureStaffAccess(user);
  ensureNotClosedForEdit(existing);

  const data = {};

  if (payload.title !== undefined) data.title = validateNonEmptyString(payload.title, 'title');
  if (payload.description !== undefined) data.description = validateNonEmptyString(payload.description, 'description');
  if (payload.requesterContact !== undefined) {
    data.requesterContact = validateNonEmptyString(payload.requesterContact, 'requesterContact');
  }
  if (payload.assetName !== undefined) data.assetName = normalizeText(payload.assetName) || null;
  if (payload.assetId !== undefined) data.assetId = normalizeText(payload.assetId) || null;
  if (payload.priority !== undefined) {
    validatePriority(payload.priority);
    data.priority = payload.priority;
    const slaDeadlines = await calculateSlaDeadlines({ priority: payload.priority, createdAt: existing.createdAt });
    data.dueAt = slaDeadlines.resolutionDueAt;
  }
  if (payload.departmentId !== undefined) data.departmentId = parsePositiveInt(payload.departmentId, 'departmentId');
  if (payload.categoryId !== undefined) data.categoryId = parsePositiveInt(payload.categoryId, 'categoryId');
  if (payload.subcategoryId !== undefined) data.subcategoryId = parsePositiveInt(payload.subcategoryId, 'subcategoryId');
  if (payload.locationId !== undefined) data.locationId = parsePositiveInt(payload.locationId, 'locationId');

  if (data.categoryId || data.subcategoryId || data.departmentId || data.locationId) {
    const validatePayload = {
      departmentId: data.departmentId || existing.departmentId,
      categoryId: data.categoryId || existing.categoryId,
      subcategoryId: data.subcategoryId || existing.subcategoryId,
      locationId: data.locationId || existing.locationId,
    };
    await validateMasterLinks(prisma, validatePayload);
  }

  return prisma.ticket.update({
    where: { id: ticketId },
    data,
    include: TICKET_INCLUDE,
  });
};

const assignTicket = async (id, payload, user) => {
  const ticketId = parsePositiveInt(id, 'id');
  ensureStaffAccess(user);

  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  ensureNotClosedForEdit(existing);

  const data = {};
  const previousAssignee = existing.assignedToId;

  if (payload.assignedToId !== undefined) {
    if (payload.assignedToId === null) {
      data.assignedToId = null;
    } else {
      const assignedToId = parsePositiveInt(payload.assignedToId, 'assignedToId');
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          isActive: true,
        },
      });

      if (!assignedUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Assigned user is invalid or inactive');
      }

      if (!ASSIGNABLE_ROLES.includes(assignedUser.role)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Tickets can only be assigned to hospital operational roles');
      }

      data.assignedToId = assignedToId;
    }
  }

  if (payload.assignedTeam !== undefined) {
    data.assignedTeam = normalizeText(payload.assignedTeam) || null;
  }

  if (payload.assignedToId !== undefined) {
    data.status = data.assignedToId ? TicketStatus.ASSIGNED : TicketStatus.OPEN;
  }

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.update({
      where: { id: ticketId },
      data,
      include: TICKET_INCLUDE,
    });

    let action = 'TICKET_ASSIGNED';
    if (previousAssignee && data.assignedToId && previousAssignee !== data.assignedToId) {
      action = 'TICKET_REASSIGNED';
    }

    await createActivityLog(tx, {
      ticketId,
      userId: user.id,
      action,
      oldValue: {
        assignedToId: existing.assignedToId,
        assignedTeam: existing.assignedTeam,
        status: existing.status,
      },
      newValue: {
        assignedToId: ticket.assignedToId,
        assignedTeam: ticket.assignedTeam,
        status: ticket.status,
      },
      remarks: action === 'TICKET_REASSIGNED' ? 'Ticket reassigned' : 'Ticket assignment updated',
    });

    return ticket;
  });
};

const updateStatus = async (id, payload, user) => {
  const ticketId = parsePositiveInt(id, 'id');
  const status = payload.status;

  validateStatus(status);

  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  ensureNotClosedForEdit(existing);
  ensureAssignedUserCanUpdate(user, existing);

  if (!PROGRESS_STATUSES.includes(status) && !STAFF_VIEW_ROLES.includes(user.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Assigned users can only update ticket progress states');
  }

  const firstResponseStatuses = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD, TicketStatus.ESCALATED, TicketStatus.RESOLVED];
  const shouldSetFirstRespondedAt = !existing.firstRespondedAt && firstResponseStatuses.includes(status);

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(shouldSetFirstRespondedAt && { firstRespondedAt: new Date() }),
      },
      include: TICKET_INCLUDE,
    });

    const slaState = await getSlaState(ticket, tx);
    if (ticket.isOverdue !== slaState.isOverdue) {
      await tx.ticket.update({
        where: { id: ticketId },
        data: { isOverdue: slaState.isOverdue },
      });
      ticket.isOverdue = slaState.isOverdue;
    }

    await createActivityLog(tx, {
      ticketId,
      userId: user.id,
      action: 'STATUS_CHANGED',
      oldValue: { status: existing.status, firstRespondedAt: existing.firstRespondedAt },
      newValue: { status: ticket.status, firstRespondedAt: ticket.firstRespondedAt },
      remarks: 'Ticket status changed',
    });

    return ticket;
  });
};

const resolveTicket = async (id, payload, user) => {
  const ticketId = parsePositiveInt(id, 'id');
  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  ensureNotClosedForEdit(existing);
  ensureAssignedUserCanUpdate(user, existing);

  const resolutionNote = normalizeText(payload.resolutionNote);

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date(),
        ...(existing.firstRespondedAt ? {} : { firstRespondedAt: new Date() }),
        ...(resolutionNote && {
          description: `${existing.description}\n\nResolution Note: ${resolutionNote}`,
        }),
      },
      include: TICKET_INCLUDE,
    });

    await tx.ticket.update({
      where: { id: ticketId },
      data: { isOverdue: false },
    });
    ticket.isOverdue = false;

    await createActivityLog(tx, {
      ticketId,
      userId: user.id,
      action: 'TICKET_RESOLVED',
      oldValue: { status: existing.status, resolvedAt: existing.resolvedAt },
      newValue: { status: ticket.status, resolvedAt: ticket.resolvedAt },
      remarks: resolutionNote || 'Ticket resolved',
    });

    return ticket;
  });
};

const closeTicket = async (id, user) => {
  const ticketId = parsePositiveInt(id, 'id');
  ensureStaffAccess(user);

  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  if (existing.status !== TicketStatus.RESOLVED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only resolved tickets can be closed');
  }

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
        isOverdue: false,
      },
      include: TICKET_INCLUDE,
    });

    await createActivityLog(tx, {
      ticketId,
      userId: user.id,
      action: 'TICKET_CLOSED',
      oldValue: { status: existing.status, closedAt: existing.closedAt },
      newValue: { status: ticket.status, closedAt: ticket.closedAt },
      remarks: 'Ticket closed',
    });

    return ticket;
  });
};

const reopenTicket = async (id, user) => {
  const ticketId = parsePositiveInt(id, 'id');

  if (!REOPEN_ROLES.includes(user.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only authorized hospital roles can reopen tickets');
  }

  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  if (existing.status !== TicketStatus.CLOSED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only closed tickets can be reopened');
  }

  const slaState = await getSlaState(existing);

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.REOPENED,
        closedAt: null,
        resolvedAt: null,
        isOverdue: slaState.isOverdue,
      },
      include: TICKET_INCLUDE,
    });

    await createActivityLog(tx, {
      ticketId,
      userId: user.id,
      action: 'TICKET_REOPENED',
      oldValue: { status: existing.status, closedAt: existing.closedAt, resolvedAt: existing.resolvedAt },
      newValue: { status: ticket.status, closedAt: ticket.closedAt, resolvedAt: ticket.resolvedAt },
      remarks: 'Ticket reopened',
    });

    return ticket;
  });
};

const getPendingEscalations = async (query, user) => {
  if (!ESCALATION_ROLES.includes(user.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only authorized hospital roles can view pending escalations');
  }

  await markOverdueTickets();
  return getPendingEscalationsFromSla(query);
};

const escalateTicket = async (id, payload, user) => {
  const ticketId = parsePositiveInt(id, 'id');

  if (!ESCALATION_ROLES.includes(user.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only authorized hospital roles can escalate tickets');
  }

  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  if ([TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED].includes(existing.status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Resolved, closed, or cancelled tickets cannot be escalated');
  }

  const slaState = await getSlaState(existing);

  if (!slaState.isOverdue) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only overdue tickets can be marked escalated');
  }

  const remarks = normalizeText(payload.remarks) || 'Ticket escalated after SLA breach';

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.ESCALATED,
        escalatedAt: existing.escalatedAt || new Date(),
        isOverdue: true,
        ...(existing.firstRespondedAt ? {} : { firstRespondedAt: new Date() }),
      },
      include: TICKET_INCLUDE,
    });

    await createActivityLog(tx, {
      ticketId,
      userId: user.id,
      action: 'TICKET_ESCALATED',
      oldValue: { status: existing.status, escalatedAt: existing.escalatedAt },
      newValue: { status: ticket.status, escalatedAt: ticket.escalatedAt },
      remarks,
    });

    return ticket;
  });
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
