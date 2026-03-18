const bcrypt = require('bcryptjs');
const { Role } = require('../../../generated/prisma');
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
  const { fullName, empId, email, phone, password, role, departmentId } = payload;

  if (!fullName || !empId || !password || !role) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'fullName, empId, password, and role are required to create a hospital user account'
    );
  }

  validatePassword(password);
  validateRole(role);

  const normalizedEmpId = empId.trim();
  const normalizedEmail = email ? email.trim().toLowerCase() : null;
  const normalizedDepartmentId = normalizeDepartmentId(departmentId);

  const [existingEmpId, existingEmail] = await Promise.all([
    prisma.user.findUnique({ where: { empId: normalizedEmpId } }),
    normalizedEmail
      ? prisma.user.findUnique({
          where: { email: normalizedEmail },
        })
      : null,
  ]);

  if (existingEmpId) {
    throw new ApiError(StatusCodes.CONFLICT, 'Employee ID is already registered');
  }

  if (existingEmail) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(password, env.bcryptSaltRounds);

  const user = await prisma.user.create({
    data: {
      fullName: fullName.trim(),
      empId: normalizedEmpId,
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
  const { empId, password } = payload;

  if (!empId || !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Employee ID and password are required');
  }

  const normalizedEmpId = empId.trim();

  const user = await prisma.user.findUnique({
    where: { empId: normalizedEmpId },
  });

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
