const { StatusCodes } = require('http-status-codes');
const dashboardService = require('./dashboard.service');
const sendResponse = require('../../utils/sendResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary(req.user);
  sendResponse(res, { statusCode: StatusCodes.OK, message: 'Dashboard summary fetched successfully', data });
});

const getCategoryWise = asyncHandler(async (req, res) => {
  const data = await dashboardService.getCategoryWise(req.user);
  sendResponse(res, { statusCode: StatusCodes.OK, message: 'Category-wise dashboard data fetched successfully', data });
});

const getDepartmentWise = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDepartmentWise(req.user);
  sendResponse(res, { statusCode: StatusCodes.OK, message: 'Department-wise dashboard data fetched successfully', data });
});

const getPriorityWise = asyncHandler(async (req, res) => {
  const data = await dashboardService.getPriorityWise(req.user);
  sendResponse(res, { statusCode: StatusCodes.OK, message: 'Priority-wise dashboard data fetched successfully', data });
});

const getStatusWise = asyncHandler(async (req, res) => {
  const data = await dashboardService.getStatusWise(req.user);
  sendResponse(res, { statusCode: StatusCodes.OK, message: 'Status-wise dashboard data fetched successfully', data });
});

const getTechnicianPerformance = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTechnicianPerformance(req.user);
  sendResponse(res, { statusCode: StatusCodes.OK, message: 'Technician performance data fetched successfully', data });
});

const getMonthlyTrend = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMonthlyTrend(req.user, req.query);
  sendResponse(res, { statusCode: StatusCodes.OK, message: 'Monthly ticket trend fetched successfully', data });
});

const getMonthlyStillActive = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMonthlyStillActive(req.user, req.query);
  sendResponse(res, { statusCode: StatusCodes.OK, message: 'Monthly still-active trend fetched successfully', data });
});

const getDepartmentCompletion = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDepartmentCompletion(req.user);
  sendResponse(res, { statusCode: StatusCodes.OK, message: 'Department completion stats fetched successfully', data });
});

const getDepartmentKpis = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDepartmentKpis(req.user);
  sendResponse(res, { statusCode: StatusCodes.OK, message: 'Department KPI stats fetched successfully', data });
});

module.exports = {
  getSummary,
  getCategoryWise,
  getDepartmentWise,
  getPriorityWise,
  getStatusWise,
  getTechnicianPerformance,
  getMonthlyTrend,
  getMonthlyStillActive,
  getDepartmentCompletion,
  getDepartmentKpis,
};
