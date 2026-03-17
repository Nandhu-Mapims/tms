const { StatusCodes } = require('http-status-codes');

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = StatusCodes.NOT_FOUND;
  next(error);
};

module.exports = notFoundHandler;
