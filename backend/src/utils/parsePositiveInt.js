const { StatusCodes } = require('http-status-codes');
const ApiError = require('./ApiError');

const parsePositiveInt = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${fieldName} must be a valid positive integer`);
  }

  return parsedValue;
};

module.exports = parsePositiveInt;
