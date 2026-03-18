const { Role } = require('../../../generated/prisma');
const { StatusCodes } = require('http-status-codes');
const { prisma } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { STAFF_VIEW_ROLES } = require('./ticket.constants');

const ensureCanViewTicket = (user, ticket) => {
  if (STAFF_VIEW_ROLES.includes(user.role)) {
    return;
  }

  if (user.role === Role.REQUESTER && ticket.requesterId === user.id) {
    return;
  }

  if (ticket.assignedToId === user.id) {
    return;
  }

  throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to view this ticket');
};

const getTicketForAccess = async (ticketId, user) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

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
