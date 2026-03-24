const bcrypt = require('bcryptjs');
const { Role } = require('../../models/enums');
const { StatusCodes } = require('http-status-codes');
const { env } = require('../../config');
const ApiError = require('../../utils/ApiError');
const generateToken = require('../../utils/generateToken');
const sanitizeUser = require('../../utils/sanitizeUser');
const User = require('../../models/User.model');
const { normalizeEmpId } = require('../../utils/empId');

const MIN_PASSWORD_LENGTH = 8;

const validatePassword = (password) => {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    );
  }
};

const validateRole = (role) => {
  if (!Object.values(Role).includes(role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid hospital role supplied');
  }
};

const normalizeDepartmentId = (departmentId) => {
  if (departmentId === undefined || departmentId === null || departmentId === '') {
    return null;
  }

  const parsedDepartmentId = Number(departmentId);

  if (!Number.isInteger(parsedDepartmentId) || parsedDepartmentId <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'departmentId must be a valid positive integer');
  }

  return parsedDepartmentId;
};

const registerUser = async (payload) => {
  const { fullName, empId, email, phone, password, role, departmentId } = payload;

  if (!fullName || !empId || !password || !role) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'fullName, empId, password, and role are required to create a hospital user account'
    );
  }

  validatePassword(password);
  validateRole(role);

  const normalizedEmpId = normalizeEmpId(empId);
  const normalizedEmail = email ? email.trim().toLowerCase() : null;
  // Mongo uses ObjectId; keep null for missing values and let later modules validate.
  const normalizedDepartmentId = departmentId ? String(departmentId) : null;

  const [existingEmpId, existingEmail] = await Promise.all([
    User.findOne({ empId: normalizedEmpId }).lean(),
    normalizedEmail ? User.findOne({ email: normalizedEmail }).lean() : null,
  ]);

  if (existingEmpId) {
    throw new ApiError(StatusCodes.CONFLICT, 'Employee ID is already registered');
  }

  if (existingEmail) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(password, env.bcryptSaltRounds);

  const user = await User.create({
    fullName: fullName.trim(),
    empId: normalizedEmpId,
    email: normalizedEmail,
    phone: phone ? phone.trim() : null,
    password: hashedPassword,
    role,
    departmentId: normalizedDepartmentId,
  });

  return sanitizeUser(user);
};

const loginUser = async (payload) => {
  const { empId, password } = payload;

  if (empId === undefined || empId === null || String(empId).trim() === '' || !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Employee ID and password are required');
  }

  const normalizedEmpId = normalizeEmpId(empId);

  const user = await User.findOne({ empId: normalizedEmpId });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid employee ID or password');
  }

  if (!user.isActive) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'User account is inactive');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid employee ID or password');
  }

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Authenticated user not found');
  }

  return sanitizeUser(user);
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
