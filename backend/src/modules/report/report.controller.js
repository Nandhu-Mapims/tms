const { StatusCodes } = require('http-status-codes');
const reportService = require('./report.service');
const sendResponse = require('../../utils/sendResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getTicketReport = asyncHandler(async (req, res) => {
  const result = await reportService.getTicketReport(req.query, req.user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Ticket report fetched successfully',
    data: result.items,
    meta: {
      ...result.meta,
      filtersApplied: result.filtersApplied,
    },
  });
});

module.exports = {
  getTicketReport,
};
