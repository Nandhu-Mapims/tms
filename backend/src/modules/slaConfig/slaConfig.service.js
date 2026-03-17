const { Priority } = require('@prisma/client');
const { StatusCodes } = require('http-status-codes');
const { createMasterService, buildSLAInput } = require('../../utils/masterServiceFactory');
const ApiError = require('../../utils/ApiError');

const validatePriority = (priority) => {
  if (priority !== undefined && !Object.values(Priority).includes(priority)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid priority supplied');
  }
};

const slaConfigService = createMasterService({
  model: 'sLAConfig',
  entityLabel: 'SLA configuration',
  searchFields: [],
  transformCreateInput: (payload) => {
    validatePriority(payload.priority);
    return buildSLAInput(payload, true);
  },
  transformUpdateInput: (payload) => {
    validatePriority(payload.priority);
    return buildSLAInput(payload, false);
  },
  include: undefined,
  orderBy: { createdAt: 'asc' },
  buildListWhere: (filters) => ({
    ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    ...(filters.search && Object.values(Priority).includes(filters.search.toUpperCase())
      ? { priority: filters.search.toUpperCase() }
      : {}),
  }),
});

module.exports = slaConfigService;
