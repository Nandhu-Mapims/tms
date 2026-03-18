const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const { env } = require('../config');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sanitizeUser = require('../utils/sanitizeUser');
const User = require('../models/User.model');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication token is required');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired authentication token');
  }

  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'User account is inactive or not found');
  }

  req.user = sanitizeUser(user);
  next();
});

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication is required'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to perform this action'));
  }

  return next();
};

module.exports = {
  protect,
  authorizeRoles,
};
