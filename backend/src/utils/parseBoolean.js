const { StatusCodes } = require('http-status-codes');
const ApiError = require('./ApiError');

const parseBoolean = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new ApiError(StatusCodes.BAD_REQUEST, 'isActive must be true or false');
};

module.exports = parseBoolean;
