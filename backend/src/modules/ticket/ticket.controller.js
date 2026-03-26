const { StatusCodes } = require('http-status-codes');
const ticketService = require('./ticket.service');
const sendResponse = require('../../utils/sendResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createTicket = asyncHandler(async (req, res) => {
  const data = await ticketService.createTicket(req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Hospital ticket created successfully',
    data,
  });
});

const getTickets = asyncHandler(async (req, res) => {
  const result = await ticketService.getTickets(req.query, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket list fetched successfully',
    data: result.items,
    meta: result.meta,
  });
});

const getTicketById = asyncHandler(async (req, res) => {
  const data = await ticketService.getTicketById(req.params.id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket fetched successfully',
    data,
  });
});

const updateTicket = asyncHandler(async (req, res) => {
  const data = await ticketService.updateTicket(req.params.id, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket updated successfully',
    data,
  });
});

const updateStatus = asyncHandler(async (req, res) => {
  const data = await ticketService.updateStatus(req.params.id, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket status updated successfully',
    data,
  });
});

const claimTicket = asyncHandler(async (req, res) => {
  const data = await ticketService.claimTicket(req.params.id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket claimed successfully',
    data,
  });
});

const cancelRequesterTicket = asyncHandler(async (req, res) => {
  const data = await ticketService.cancelRequesterTicket(req.params.id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket request cancelled successfully',
    data,
  });
});

const transferTicket = asyncHandler(async (req, res) => {
  const data = await ticketService.transferTicket(req.params.id, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket transferred successfully',
    data,
  });
});

const resolveTicket = asyncHandler(async (req, res) => {
  const data = await ticketService.resolveTicket(req.params.id, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket resolved successfully',
    data,
  });
});

const closeTicket = asyncHandler(async (req, res) => {
  const data = await ticketService.closeTicket(req.params.id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket closed successfully',
    data,
  });
});

const confirmResolutionAndClose = asyncHandler(async (req, res) => {
  const data = await ticketService.confirmResolutionAndClose(req.params.id, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Resolution confirmed and ticket closed successfully',
    data,
  });
});

const reopenTicket = asyncHandler(async (req, res) => {
  const data = await ticketService.reopenTicket(req.params.id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket reopened successfully',
    data,
  });
});

const getPendingEscalations = asyncHandler(async (req, res) => {
  const result = await ticketService.getPendingEscalations(req.query, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Pending escalations fetched successfully',
    data: result.items,
    meta: result.meta,
  });
});

const escalateTicket = asyncHandler(async (req, res) => {
  const data = await ticketService.escalateTicket(req.params.id, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket escalated successfully',
    data,
  });
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  updateStatus,
  claimTicket,
  cancelRequesterTicket,
  transferTicket,
  resolveTicket,
  closeTicket,
  confirmResolutionAndClose,
  reopenTicket,
  getPendingEscalations,
  escalateTicket,
};
