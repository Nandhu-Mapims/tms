// Ticket transfer-request controller.
const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');

const ticketTransferRequestService = require('./ticketTransferRequest.service');

const createTransferRequest = asyncHandler(async (req, res) => {
  const data = await ticketTransferRequestService.createTransferRequest(req.params.id, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Transfer request created successfully',
    data,
  });
});

const getSentTransferRequests = asyncHandler(async (req, res) => {
  const result = await ticketTransferRequestService.getSentTransferRequests(req.query, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Sent transfer requests fetched successfully',
    data: result.items,
    meta: result.meta,
  });
});

const getReceivedTransferRequests = asyncHandler(async (req, res) => {
  const result = await ticketTransferRequestService.getReceivedTransferRequests(req.query, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Received transfer requests fetched successfully',
    data: result.items,
    meta: result.meta,
  });
});

const approveTransferRequest = asyncHandler(async (req, res) => {
  const data = await ticketTransferRequestService.approveTransferRequest(req.params.requestId, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Transfer request approved successfully',
    data,
  });
});

const rejectTransferRequest = asyncHandler(async (req, res) => {
  const data = await ticketTransferRequestService.rejectTransferRequest(req.params.requestId, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Transfer request rejected successfully',
    data,
  });
});

const cancelTransferRequest = asyncHandler(async (req, res) => {
  const data = await ticketTransferRequestService.cancelTransferRequest(req.params.requestId, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Transfer request cancelled successfully',
    data,
  });
});

module.exports = {
  createTransferRequest,
  getSentTransferRequests,
  getReceivedTransferRequests,
  approveTransferRequest,
  rejectTransferRequest,
  cancelTransferRequest,
};

