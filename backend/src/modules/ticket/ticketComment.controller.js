const { StatusCodes } = require('http-status-codes');
const ticketCommentService = require('./ticketComment.service');
const sendResponse = require('../../utils/sendResponse');
const asyncHandler = require('../../utils/asyncHandler');

const addComment = asyncHandler(async (req, res) => {
  const data = await ticketCommentService.addComment(req.params.id, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Ticket comment added successfully',
    data,
  });
});

const getComments = asyncHandler(async (req, res) => {
  const data = await ticketCommentService.getComments(req.params.id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket comments fetched successfully',
    data,
  });
});

module.exports = {
  addComment,
  getComments,
};
