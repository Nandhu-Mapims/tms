const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const parseBoolean = require('../../utils/parseBoolean');
const mongoose = require('mongoose');
const Category = require('../../models/Category.model');
const Subcategory = require('../../models/Subcategory.model');

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);
const normalizeCode = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

const toObjectId = (value, fieldName) => {
  const normalized = String(value ?? '');
  if (!normalized) return undefined;
  if (!mongoose.Types.ObjectId.isValid(normalized)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${fieldName} must be a valid id`);
  }
  return new mongoose.Types.ObjectId(normalized);
};

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

  const categoryId = toObjectId(payload?.categoryId, 'categoryId');
  if (isCreate && !categoryId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'categoryId is required');
  }
  if (categoryId !== undefined) data.categoryId = categoryId;

  return data;
};

const buildWhere = (filters = {}) => {
  const where = {};
  const search = typeof filters.search === 'string' ? filters.search.trim() : '';

  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const categoryId = filters.categoryId ? toObjectId(filters.categoryId, 'categoryId') : undefined;
  if (categoryId) where.categoryId = categoryId;

  if (search) {
    where.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  return where;
};

const ensureCategoryExistsIfProvided = async (categoryId) => {
  if (!categoryId) return;
  const exists = await Category.exists({ _id: categoryId, isActive: true });
  if (!exists) throw new ApiError(StatusCodes.BAD_REQUEST, 'categoryId is invalid');
};

const shape = (doc) => ({
  ...(doc ?? {}),
  id: doc?._id?.toString?.() ?? doc?.id,
});

module.exports = {
  create: async (payload) => {
    const input = buildInput(payload, true);
    await ensureCategoryExistsIfProvided(input.categoryId);
    return shape((await Subcategory.create(input)).toObject());
  },
  getAll: async (filters) => {
    const where = buildWhere(filters);
    const [items, total] = await Promise.all([
      Subcategory.find(where)
        .sort({ categoryId: 1, name: 1 })
        .populate({ path: 'categoryId', select: 'name code isActive' })
        .lean(),
      Subcategory.countDocuments(where),
    ]);
    return {
      items: items.map((s) => ({
        ...shape(s),
        category: s.categoryId ?? null,
        categoryId: s.categoryId?._id?.toString?.() ?? s.categoryId,
      })),
      total,
    };
  },
  getById: async (id) => {
    const record = await Subcategory.findById(id)
      .populate({ path: 'categoryId', select: 'name code isActive' })
      .lean();
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, 'Subcategory not found');
    return {
      ...shape(record),
      category: record.categoryId ?? null,
      categoryId: record.categoryId?._id?.toString?.() ?? record.categoryId,
    };
  },
  update: async (id, payload) => {
    const input = buildInput(payload, false);
    if (input.categoryId) await ensureCategoryExistsIfProvided(input.categoryId);
    const updated = await Subcategory.findByIdAndUpdate(id, input, { new: true, runValidators: true })
      .populate({ path: 'categoryId', select: 'name code isActive' })
      .lean();
    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, 'Subcategory not found');
    return {
      ...shape(updated),
      category: updated.categoryId ?? null,
      categoryId: updated.categoryId?._id?.toString?.() ?? updated.categoryId,
    };
  },
  remove: async (id) => {
    const deleted = await Subcategory.findByIdAndDelete(id).lean();
    if (!deleted) throw new ApiError(StatusCodes.NOT_FOUND, 'Subcategory not found');
    return shape(deleted);
  },
};
