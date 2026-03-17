const { StatusCodes } = require('http-status-codes');
const ticketAttachmentService = require('./ticketAttachment.service');
const sendResponse = require('../../utils/sendResponse');
const asyncHandler = require('../../utils/asyncHandler');

const addAttachment = asyncHandler(async (req, res) => {
  const data = await ticketAttachmentService.addAttachment(req.params.id, req.file, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Ticket attachment uploaded successfully',
    data,
  });
});

const getAttachments = asyncHandler(async (req, res) => {
  const data = await ticketAttachmentService.getAttachments(req.params.id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket attachments fetched successfully',
    data,
  });
});

module.exports = {
  addAttachment,
  getAttachments,
};
