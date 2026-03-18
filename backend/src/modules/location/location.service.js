const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const parseBoolean = require('../../utils/parseBoolean');
const Location = require('../../models/Location.model');

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);

const buildInput = (payload, isCreate = false) => {
  const block = normalizeText(payload?.block);
  if (isCreate && !block) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'block is required');
  }

  const data = {};
  if (payload?.block !== undefined) data.block = block;
  if (payload?.floor !== undefined) data.floor = normalizeText(payload.floor) || null;
  if (payload?.ward !== undefined) data.ward = normalizeText(payload.ward) || null;
  if (payload?.room !== undefined) data.room = normalizeText(payload.room) || null;
  if (payload?.unit !== undefined) data.unit = normalizeText(payload.unit) || null;
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
      { block: { $regex: search, $options: 'i' } },
      { floor: { $regex: search, $options: 'i' } },
      { ward: { $regex: search, $options: 'i' } },
      { room: { $regex: search, $options: 'i' } },
      { unit: { $regex: search, $options: 'i' } },
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
  create: async (payload) => shape((await Location.create(buildInput(payload, true))).toObject()),
  getAll: async (filters) => {
    const where = buildWhere(filters);
    const [items, total] = await Promise.all([
      Location.find(where).sort({ block: 1, floor: 1, ward: 1, room: 1 }).lean(),
      Location.countDocuments(where),
    ]);
    return { items: items.map(shape), total };
  },
  getById: async (id) => {
    const record = await Location.findById(id).lean();
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, 'Location not found');
    return shape(record);
  },
  update: async (id, payload) => {
    const updated = await Location.findByIdAndUpdate(id, buildInput(payload, false), {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, 'Location not found');
    return shape(updated);
  },
  remove: async (id) => {
    const deleted = await Location.findByIdAndDelete(id).lean();
    if (!deleted) throw new ApiError(StatusCodes.NOT_FOUND, 'Location not found');
    return shape(deleted);
  },
};
