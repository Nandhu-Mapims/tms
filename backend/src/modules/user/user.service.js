// User service backed by MongoDB (Mongoose).
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

const { env } = require('../../config');
const ApiError = require('../../utils/ApiError');
const sanitizeUser = require('../../utils/sanitizeUser');
const { Role } = require('../../models/enums');
const User = require('../../models/User.model');
const Department = require('../../models/Department.model');

const MIN_PASSWORD_LENGTH = 8;
const ASSIGNABLE_ROLES = [Role.TECHNICIAN];

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);

const toObjectIdOrNull = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const normalized = String(value);
  if (!mongoose.Types.ObjectId.isValid(normalized)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${fieldName} must be a valid id`);
  }
  return new mongoose.Types.ObjectId(normalized);
};

const validateRole = (role) => {
  if (role !== undefined && !Object.values(Role).includes(role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid hospital role supplied');
  }
};

const validatePassword = (password) => {
  if (password !== undefined && password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }
};

const ensureDepartmentExists = async (departmentId) => {
  if (!departmentId) return;
  const exists = await Department.exists({ _id: departmentId });
  if (!exists) throw new ApiError(StatusCodes.BAD_REQUEST, 'Selected department does not exist');
};

const getAssignableUsers = async () => {
  const users = await User.find({ isActive: true, role: { $in: ASSIGNABLE_ROLES } })
    .select('fullName email role')
    .sort({ fullName: 1 })
    .lean();
  return users.map((u) => ({ id: u._id.toString(), fullName: u.fullName, email: u.email, role: u.role }));
};

const getUsers = async (query = {}) => {
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const role = typeof query.role === 'string' ? query.role.trim() : '';
  const isActive = query.isActive === undefined ? undefined : query.isActive === 'true';

  validateRole(role || undefined);

  const where = {};
  if (role) where.role = role;
  if (query.departmentId) where.departmentId = toObjectIdOrNull(query.departmentId, 'departmentId');
  if (query.isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { empId: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(where).sort({ createdAt: -1 }).populate({ path: 'departmentId', select: 'name code isActive' }).lean();

  return users.map((u) => ({
    ...sanitizeUser(u),
    department: u.departmentId ?? null,
    departmentId: u.departmentId?._id?.toString?.() ?? u.departmentId ?? null,
  }));
};

const getUserById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User id must be a valid id');
  }

  const user = await User.findById(id).populate({ path: 'departmentId', select: 'name code isActive' }).lean();
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  return {
    ...sanitizeUser(user),
    department: user.departmentId ?? null,
    departmentId: user.departmentId?._id?.toString?.() ?? user.departmentId ?? null,
  };
};

const updateUser = async (id, payload = {}, currentUser) => {
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User id must be a valid id');
  }

  const existingUser = await User.findById(id);
  if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  validateRole(payload.role);
  if (payload.password !== undefined && payload.password !== '') validatePassword(payload.password);

  const departmentId = toObjectIdOrNull(payload.departmentId, 'departmentId');
  if (departmentId !== undefined) await ensureDepartmentExists(departmentId);

  if (payload.email !== undefined && payload.email) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const duplicateUser = await User.findOne({ email: normalizedEmail, _id: { $ne: existingUser._id } }).lean();
    if (duplicateUser) throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
  }

  if (String(currentUser.id) === String(existingUser._id) && payload.role && payload.role !== existingUser.role) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot change your own role');
  }

  if (payload.fullName !== undefined) existingUser.fullName = normalizeText(payload.fullName);
  if (payload.email !== undefined) existingUser.email = payload.email ? payload.email.trim().toLowerCase() : null;
  if (payload.phone !== undefined) existingUser.phone = payload.phone ? payload.phone.trim() : null;
  if (payload.role !== undefined) existingUser.role = payload.role;
  if (departmentId !== undefined) existingUser.departmentId = departmentId;
  if (payload.password) existingUser.password = await bcrypt.hash(payload.password, env.bcryptSaltRounds);

  await existingUser.save();

  const updated = await User.findById(existingUser._id)
    .populate({ path: 'departmentId', select: 'name code isActive' })
    .lean();

  return {
    ...sanitizeUser(updated),
    department: updated.departmentId ?? null,
    departmentId: updated.departmentId?._id?.toString?.() ?? updated.departmentId ?? null,
  };
};

const updateUserStatus = async (id, payload = {}, currentUser) => {
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User id must be a valid id');
  }

  if (typeof payload.isActive !== 'boolean') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'isActive must be true or false');
  }

  if (String(currentUser.id) === String(id) && payload.isActive === false) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot deactivate your own account');
  }

  const existingUser = await User.findById(id);
  if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  existingUser.isActive = payload.isActive;
  await existingUser.save();

  const updated = await User.findById(existingUser._id)
    .populate({ path: 'departmentId', select: 'name code isActive' })
    .lean();

  return {
    ...sanitizeUser(updated),
    department: updated.departmentId ?? null,
    departmentId: updated.departmentId?._id?.toString?.() ?? updated.departmentId ?? null,
  };
};

module.exports = {
  getAssignableUsers,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
};

