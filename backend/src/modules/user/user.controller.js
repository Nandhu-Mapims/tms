const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const userService = require('./user.service');

const getAssignableUsers = asyncHandler(async (req, res) => {
  const data = await userService.getAssignableUsers();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Assignable users fetched successfully',
    data,
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const data = await userService.getUsers(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Hospital users fetched successfully',
    data,
    meta: {
      count: data.length,
      total: data.length,
    },
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const data = await userService.getUserById(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Hospital user fetched successfully',
    data,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const data = await userService.updateUser(req.params.id, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Hospital user updated successfully',
    data,
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const data = await userService.updateUserStatus(req.params.id, req.body, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Hospital user status updated successfully',
    data,
  });
});

module.exports = {
  getAssignableUsers,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
};
