const { StatusCodes } = require('http-status-codes');
const ticketActivityLogService = require('./ticketActivityLog.service');
const sendResponse = require('../../utils/sendResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getActivityLog = asyncHandler(async (req, res) => {
  const data = await ticketActivityLogService.getActivityLog(req.params.id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket activity log fetched successfully',
    data,
  });
});

module.exports = {
  getActivityLog,
};
