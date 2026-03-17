const bcrypt = require('bcryptjs');
const { Role } = require('@prisma/client');
const { StatusCodes } = require('http-status-codes');
const { prisma } = require('../../config/database');
const { env } = require('../../config');
const ApiError = require('../../utils/ApiError');
const generateToken = require('../../utils/generateToken');
const sanitizeUser = require('../../utils/sanitizeUser');

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
  const { fullName, email, phone, password, role, departmentId } = payload;

  if (!fullName || !email || !password || !role) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'fullName, email, password, and role are required to create a hospital user account'
    );
  }

  validatePassword(password);
  validateRole(role);

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedDepartmentId = normalizeDepartmentId(departmentId);

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(password, env.bcryptSaltRounds);

  const user = await prisma.user.create({
    data: {
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : null,
      password: hashedPassword,
      role,
      departmentId: normalizedDepartmentId,
    },
  });

  return sanitizeUser(user);
};

const loginUser = async (payload) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'User account is inactive');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
};

const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

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
