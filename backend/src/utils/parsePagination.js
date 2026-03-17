const { StatusCodes } = require('http-status-codes');
const ApiError = require('./ApiError');
const parsePositiveInt = require('./parsePositiveInt');

const parsePagination = (query) => {
  const page = query.page !== undefined ? parsePositiveInt(query.page, 'page') : 1;
  const limit = query.limit !== undefined ? parsePositiveInt(query.limit, 'limit') : 10;

  if (limit > 100) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'limit cannot be greater than 100');
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

module.exports = parsePagination;
