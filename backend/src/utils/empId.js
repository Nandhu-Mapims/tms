// Validates and normalizes hospital employee IDs (exactly five digits, stored as string).
const { StatusCodes } = require('http-status-codes');
const ApiError = require('./ApiError');

const EMP_ID_PATTERN = /^\d{5}$/;

/**
 * @param {unknown} raw
 * @returns {string}
 */
const normalizeEmpId = (raw) => {
  const normalized = String(raw ?? '').trim();
  if (!EMP_ID_PATTERN.test(normalized)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Employee ID must be exactly 5 digits (numbers only)'
    );
  }
  return normalized;
};

module.exports = {
  EMP_ID_PATTERN,
  normalizeEmpId,
};
