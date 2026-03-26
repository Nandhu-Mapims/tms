const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const ApiError = require('../../utils/ApiError');
const { STAFF_VIEW_ROLES } = require('./ticket.constants');
const { Role } = require('../../models/enums');
const Ticket = require('../../models/Ticket.model');

const getIdString = (value) => {
  if (!value) return '';
  const candidate = value?._id ?? value;
  return candidate?.toString?.() ?? String(candidate);
};

const ensureCanViewTicket = (user, ticket) => {
  if (user?.role === Role.HELPDESK) {
    const userDepartmentId = getIdString(user?.departmentId);
    const ticketDepartmentId = getIdString(ticket?.departmentId);
    if (!userDepartmentId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Your account has no department assigned. Please contact admin.');
    }
    if (ticketDepartmentId && ticketDepartmentId === userDepartmentId) {
      return;
    }
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can view only tickets routed to your department');
  }

  if (user?.role === Role.HOD) {
    const userDepartmentId = getIdString(user?.departmentId);
    const ticketDepartmentId = getIdString(ticket?.departmentId);
    if (!userDepartmentId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Your account has no department assigned. Please contact admin.');
    }
    if (ticketDepartmentId && ticketDepartmentId === userDepartmentId) {
      return;
    }
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can view only tickets routed to your department');
  }

  if (STAFF_VIEW_ROLES.includes(user.role)) {
    return;
  }

  const userId = getIdString(user?.id);
  const requesterId = getIdString(ticket?.requesterId);
  const assignedToId = getIdString(ticket?.assignedToId);

  if (user.role === Role.REQUESTER && requesterId === userId) {
    return;
  }

  if (assignedToId && assignedToId === userId) {
    return;
  }

  throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to view this ticket');
};

/** Helpdesk may view any ticket but only the assigned agent may post chat or attachments. */
const ensureCanPostTicketThread = (user, ticket) => {
  if ([Role.ADMIN, Role.HOD].includes(user?.role)) {
    return;
  }

  const userId = getIdString(user?.id);
  const requesterId = getIdString(ticket?.requesterId);
  const assignedToId = getIdString(ticket?.assignedToId);

  if (user.role === Role.REQUESTER && requesterId === userId) {
    return;
  }

  if (user.role === Role.HELPDESK) {
    if (!assignedToId) {
      return;
    }
    if (assignedToId === userId) {
      return;
    }
  }

  throw new ApiError(
    StatusCodes.FORBIDDEN,
    'Only the assigned helpdesk agent can add messages or attachments. Request a transfer if you need to handle this ticket.',
  );
};

const getTicketForAccess = async (ticketId, user) => {
  const identifier = String(ticketId ?? '').trim();
  if (!identifier) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ticket id is required');
  }

  const ticket = mongoose.Types.ObjectId.isValid(identifier)
    ? await Ticket.findById(identifier)
    : await Ticket.findOne({ ticketNumber: identifier });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  ensureCanViewTicket(user, ticket);
  return ticket;
};

module.exports = {
  ensureCanViewTicket,
  ensureCanPostTicketThread,
  getTicketForAccess,
};
