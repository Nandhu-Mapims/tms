const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const parseBoolean = require('../../utils/parseBoolean');
const parsePositiveInt = require('../../utils/parsePositiveInt');
const { Priority } = require('../../models/enums');
const SLAConfig = require('../../models/SLAConfig.model');

const validatePriority = (priority) => {
  if (priority !== undefined && !Object.values(Priority).includes(priority)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid priority supplied');
  }
};

const buildInput = (payload, isCreate = false) => {
  const data = {};

  if (isCreate && !payload?.priority) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'priority is required');
  }

  if (payload?.priority !== undefined) {
    validatePriority(payload.priority);
    data.priority = payload.priority;
  }

  if (payload?.firstResponseMinutes !== undefined) {
    data.firstResponseMinutes = parsePositiveInt(payload.firstResponseMinutes, 'firstResponseMinutes');
  }
  if (payload?.resolutionMinutes !== undefined) {
    data.resolutionMinutes = parsePositiveInt(payload.resolutionMinutes, 'resolutionMinutes');
  }
  if (payload?.escalationMinutes !== undefined) {
    data.escalationMinutes = parsePositiveInt(payload.escalationMinutes, 'escalationMinutes');
  }
  if (payload?.isActive !== undefined) data.isActive = parseBoolean(payload.isActive);

  if (
    isCreate &&
    (data.firstResponseMinutes === undefined ||
      data.resolutionMinutes === undefined ||
      data.escalationMinutes === undefined)
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'firstResponseMinutes, resolutionMinutes, and escalationMinutes are required'
    );
  }

  return data;
};

const buildWhere = (filters = {}) => {
  const where = {};
  const search = typeof filters.search === 'string' ? filters.search.trim() : '';
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (search && Object.values(Priority).includes(search.toUpperCase())) {
    where.priority = search.toUpperCase();
  }
  return where;
};

const shape = (doc) => ({
  ...(doc ?? {}),
  id: doc?._id?.toString?.() ?? doc?.id,
});

module.exports = {
  create: async (payload) => shape((await SLAConfig.create(buildInput(payload, true))).toObject()),
  getAll: async (filters) => {
    const where = buildWhere(filters);
    const [items, total] = await Promise.all([
      SLAConfig.find(where).sort({ createdAt: 1 }).lean(),
      SLAConfig.countDocuments(where),
    ]);
    return { items: items.map(shape), total };
  },
  getById: async (id) => {
    const record = await SLAConfig.findById(id).lean();
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, 'SLA configuration not found');
    return shape(record);
  },
  update: async (id, payload) => {
    const updated = await SLAConfig.findByIdAndUpdate(id, buildInput(payload, false), {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, 'SLA configuration not found');
    return shape(updated);
  },
  remove: async (id) => {
    const deleted = await SLAConfig.findByIdAndDelete(id).lean();
    if (!deleted) throw new ApiError(StatusCodes.NOT_FOUND, 'SLA configuration not found');
    return shape(deleted);
  },
};
