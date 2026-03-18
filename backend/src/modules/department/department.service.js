const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const parseBoolean = require('../../utils/parseBoolean');
const Department = require('../../models/Department.model');

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);
const normalizeCode = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

const buildInput = (payload, isCreate = false) => {
  const data = {};
  const name = normalizeText(payload?.name);
  const code = normalizeCode(payload?.code);

  if (isCreate && (!name || !code)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'name and code are required');
  }

  if (payload?.name !== undefined) data.name = name;
  if (payload?.code !== undefined) data.code = code;
  if (payload?.description !== undefined) data.description = normalizeText(payload.description) || null;
  if (payload?.isActive !== undefined) data.isActive = parseBoolean(payload.isActive);

  return data;
};

const buildWhere = (filters = {}) => {
  const where = {};
  const search = typeof filters.search === 'string' ? filters.search.trim() : '';

  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (search) {
    where.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  return where;
};

const shape = (doc) => ({
  ...(doc ?? {}),
  id: doc?._id?.toString?.() ?? doc?.id,
});

module.exports = {
  create: async (payload) => shape((await Department.create(buildInput(payload, true))).toObject()),
  getAll: async (filters) => {
    const where = buildWhere(filters);
    const [items, total] = await Promise.all([
      Department.find(where).sort({ name: 1 }).lean(),
      Department.countDocuments(where),
    ]);
    return { items: items.map(shape), total };
  },
  getById: async (id) => {
    const record = await Department.findById(id).lean();
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, 'Department not found');
    return shape(record);
  },
  update: async (id, payload) => {
    const updated = await Department.findByIdAndUpdate(id, buildInput(payload, false), {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, 'Department not found');
    return shape(updated);
  },
  remove: async (id) => {
    const deleted = await Department.findByIdAndDelete(id).lean();
    if (!deleted) throw new ApiError(StatusCodes.NOT_FOUND, 'Department not found');
    return shape(deleted);
  },
};
