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

const getMonthlyBreakdown = asyncHandler(async (req, res) => {
  const data = await reportService.getMonthlyBreakdown(req.query, req.user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Monthly report breakdown fetched successfully',
    data,
  });
});

const exportTicketReportCsv = asyncHandler(async (req, res) => {
  const { csv, exportedCount } = await reportService.getTicketReportExport(req.query, req.user);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `ticket-report-${stamp}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-Exported-Count', String(exportedCount));
  res.status(StatusCodes.OK).send(`\uFEFF${csv}`);
});

module.exports = {
  getTicketReport,
  getMonthlyBreakdown,
  exportTicketReportCsv,
};
