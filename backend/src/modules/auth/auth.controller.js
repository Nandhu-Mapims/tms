const { StatusCodes } = require('http-status-codes');
const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Hospital user account created successfully',
    data: user,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Login successful',
    data: result,
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Authenticated hospital user fetched successfully',
    data: user,
  });
});

module.exports = {
  register,
  login,
  getMe,
};
