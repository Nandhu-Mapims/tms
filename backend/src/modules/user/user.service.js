const bcrypt = require('bcryptjs');
const { Role } = require('@prisma/client');
const { StatusCodes } = require('http-status-codes');
const { prisma } = require('../../config/database');
const { env } = require('../../config');
const ApiError = require('../../utils/ApiError');
const sanitizeUser = require('../../utils/sanitizeUser');

const MIN_PASSWORD_LENGTH = 8;

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

const buildUserInclude = () => ({
  department: {
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
    },
  },
});

const ensureDepartmentExists = async (departmentId) => {
  if (!departmentId) {
    return;
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Selected department does not exist');
  }
};

const getUsers = async (query) => {
  const search = query.search?.trim();
  const role = query.role?.trim();
  const isActive = query.isActive === undefined ? undefined : query.isActive === 'true';

  validateRole(role);

  const where = {
    ...(role ? { role } : {}),
    ...(query.departmentId ? { departmentId: Number(query.departmentId) } : {}),
    ...(query.isActive !== undefined ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  const users = await prisma.user.findMany({
    where,
    include: buildUserInclude(),
    orderBy: { createdAt: 'desc' },
  });

  return users.map((user) => ({
    ...sanitizeUser(user),
    department: user.department,
  }));
};

const getUserById = async (id) => {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User id must be a valid positive integer');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: buildUserInclude(),
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return {
    ...sanitizeUser(user),
    department: user.department,
  };
};

const updateUser = async (id, payload, currentUser) => {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User id must be a valid positive integer');
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  validateRole(payload.role);
  validatePassword(payload.password);

  const departmentId = payload.departmentId === undefined ? undefined : normalizeDepartmentId(payload.departmentId);
  if (departmentId !== undefined) {
    await ensureDepartmentExists(departmentId);
  }

  if (payload.email) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const duplicateUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        NOT: { id: userId },
      },
    });

    if (duplicateUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
    }
  }

  if (currentUser.id === userId && payload.role && payload.role !== existingUser.role) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot change your own role');
  }

  const data = {
    ...(payload.fullName !== undefined ? { fullName: payload.fullName.trim() } : {}),
    ...(payload.email !== undefined ? { email: payload.email.trim().toLowerCase() } : {}),
    ...(payload.phone !== undefined ? { phone: payload.phone ? payload.phone.trim() : null } : {}),
    ...(payload.role !== undefined ? { role: payload.role } : {}),
    ...(departmentId !== undefined ? { departmentId } : {}),
  };

  if (payload.password) {
    data.password = await bcrypt.hash(payload.password, env.bcryptSaltRounds);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: buildUserInclude(),
  });

  return {
    ...sanitizeUser(user),
    department: user.department,
  };
};

const updateUserStatus = async (id, payload, currentUser) => {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User id must be a valid positive integer');
  }

  if (typeof payload.isActive !== 'boolean') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'isActive must be true or false');
  }

  if (currentUser.id === userId && payload.isActive === false) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot deactivate your own account');
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: payload.isActive },
    include: buildUserInclude(),
  });

  return {
    ...sanitizeUser(user),
    department: user.department,
  };
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
};
