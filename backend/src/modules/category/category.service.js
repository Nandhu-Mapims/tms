const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const parseBoolean = require('../../utils/parseBoolean');
const Category = require('../../models/Category.model');

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
  create: async (payload) => shape((await Category.create(buildInput(payload, true))).toObject()),
  getAll: async (filters) => {
    const where = buildWhere(filters);
    const [items, total] = await Promise.all([
      Category.find(where).sort({ name: 1 }).lean(),
      Category.countDocuments(where),
    ]);
    return { items: items.map(shape), total };
  },
  getById: async (id) => {
    const record = await Category.findById(id).lean();
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    return shape(record);
  },
  update: async (id, payload) => {
    const updated = await Category.findByIdAndUpdate(id, buildInput(payload, false), {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    return shape(updated);
  },
  remove: async (id) => {
    const deleted = await Category.findByIdAndDelete(id).lean();
    if (!deleted) throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    return shape(deleted);
  },
};
