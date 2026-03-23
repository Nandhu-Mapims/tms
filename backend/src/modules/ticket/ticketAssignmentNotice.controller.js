// Assignment notices controller (sidebar for helpdesk).
const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');

const ticketAssignmentNoticeService = require('./ticketAssignmentNotice.service');

const getAssignmentNotices = asyncHandler(async (req, res) => {
  const result = await ticketAssignmentNoticeService.getAssignmentNoticesForSidebar(req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Assignment notices fetched successfully',
    data: result.items,
  });
});

module.exports = {
  getAssignmentNotices,
};
