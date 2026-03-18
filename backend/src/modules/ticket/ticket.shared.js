const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const { STAFF_VIEW_ROLES } = require('./ticket.constants');
const { Role } = require('../../models/enums');
const Ticket = require('../../models/Ticket.model');

const ensureCanViewTicket = (user, ticket) => {
  if (STAFF_VIEW_ROLES.includes(user.role)) {
    return;
  }

  const userId = user?.id?.toString?.() ?? String(user?.id ?? '');
  const requesterId = ticket?.requesterId?.toString?.() ?? String(ticket?.requesterId ?? '');
  const assignedToId = ticket?.assignedToId?.toString?.() ?? String(ticket?.assignedToId ?? '');

  if (user.role === Role.REQUESTER && requesterId === userId) {
    return;
  }

  if (assignedToId && assignedToId === userId) {
    return;
  }

  throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to view this ticket');
};

const getTicketForAccess = async (ticketId, user) => {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  ensureCanViewTicket(user, ticket);
  return ticket;
};

module.exports = {
  ensureCanViewTicket,
  getTicketForAccess,
};
