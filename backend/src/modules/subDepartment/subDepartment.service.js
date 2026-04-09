const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const ApiError = require('../../utils/ApiError');
const parseBoolean = require('../../utils/parseBoolean');
const Department = require('../../models/Department.model');
const SubDepartment = require('../../models/SubDepartment.model');

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

  const departmentId = toObjectId(payload?.departmentId, 'departmentId');
  if (isCreate && !departmentId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'departmentId is required');
  }
  if (departmentId !== undefined) data.departmentId = departmentId;

  return data;
};

const buildWhere = (filters = {}) => {
  const where = {};
  const search = typeof filters.search === 'string' ? filters.search.trim() : '';

  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const departmentId = filters.departmentId ? toObjectId(filters.departmentId, 'departmentId') : undefined;
  if (departmentId) where.departmentId = departmentId;

  if (search) {
    where.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  return where;
};

const ensureDepartmentExists = async (departmentId) => {
  if (!departmentId) return;
  const exists = await Department.exists({ _id: departmentId, isActive: true });
  if (!exists) throw new ApiError(StatusCodes.BAD_REQUEST, 'departmentId is invalid');
};

const shape = (doc) => ({
  ...(doc ?? {}),
  id: doc?._id?.toString?.() ?? doc?.id,
});

module.exports = {
  create: async (payload) => {
    const input = buildInput(payload, true);
    await ensureDepartmentExists(input.departmentId);
    return shape((await SubDepartment.create(input)).toObject());
  },
  getAll: async (filters) => {
    const where = buildWhere(filters);
    const [items, total] = await Promise.all([
      SubDepartment.find(where)
        .sort({ departmentId: 1, name: 1 })
        .populate({ path: 'departmentId', select: 'name code isActive' })
        .lean(),
      SubDepartment.countDocuments(where),
    ]);
    return {
      items: items.map((s) => ({
        ...shape(s),
        department: s.departmentId ?? null,
        departmentId: s.departmentId?._id?.toString?.() ?? s.departmentId,
      })),
      total,
    };
  },
  getById: async (id) => {
    const record = await SubDepartment.findById(id)
      .populate({ path: 'departmentId', select: 'name code isActive' })
      .lean();
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, 'Sub-department not found');
    return {
      ...shape(record),
      department: record.departmentId ?? null,
      departmentId: record.departmentId?._id?.toString?.() ?? record.departmentId,
    };
  },
  update: async (id, payload) => {
    const input = buildInput(payload, false);
    if (input.departmentId) await ensureDepartmentExists(input.departmentId);
    const updated = await SubDepartment.findByIdAndUpdate(id, input, { new: true, runValidators: true })
      .populate({ path: 'departmentId', select: 'name code isActive' })
      .lean();
    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, 'Sub-department not found');
    return {
      ...shape(updated),
      department: updated.departmentId ?? null,
      departmentId: updated.departmentId?._id?.toString?.() ?? updated.departmentId,
    };
  },
  remove: async (id) => {
    const deleted = await SubDepartment.findByIdAndDelete(id).lean();
    if (!deleted) throw new ApiError(StatusCodes.NOT_FOUND, 'Sub-department not found');
    return shape(deleted);
  },
};
