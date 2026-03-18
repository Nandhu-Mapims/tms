const { StatusCodes } = require('http-status-codes');
const { Role } = require('../../generated/prisma');
const { prisma } = require('../config/database');
const ApiError = require('./ApiError');
const parseBoolean = require('./parseBoolean');
const parsePositiveInt = require('./parsePositiveInt');

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);
const normalizeCode = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

const buildSearchCondition = (search, fields) => {
  if (!search) {
    return undefined;
  }

  const term = search.trim();

  if (!term || !fields.length) {
    return undefined;
  }

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: term,
      },
    })),
  };
};

const handlePrismaError = (error, entityLabel) => {
  if (error.code === 'P2025') {
    throw new ApiError(StatusCodes.NOT_FOUND, `${entityLabel} not found`);
  }

  if (error.code === 'P2002') {
    throw new ApiError(StatusCodes.CONFLICT, `A ${entityLabel.toLowerCase()} with the same unique value already exists`);
  }

  if (error.code === 'P2003') {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Unable to delete ${entityLabel.toLowerCase()} because it is referenced elsewhere`);
  }

  throw error;
};

const ensureRequesterVisibility = (where, user) => {
  if (user.role === Role.REQUESTER) {
    return {
      ...where,
      isActive: true,
    };
  }

  return where;
};

const createMasterService = ({
  model,
  entityLabel,
  searchFields,
  transformCreateInput,
  transformUpdateInput,
  buildListWhere,
  include,
  orderBy,
}) => {
  const delegate = prisma[model];

  return {
    create: async (payload) => {
      try {
        const data = await delegate.create({
          data: transformCreateInput(payload),
          include,
        });

        return data;
      } catch (error) {
        handlePrismaError(error, entityLabel);
      }
    },

    getAll: async (filters, user) => {
      const baseWhere = buildListWhere
        ? buildListWhere(filters)
        : {
            ...(filters.isActive !== undefined && { isActive: filters.isActive }),
            ...buildSearchCondition(filters.search, searchFields),
          };

      const where = ensureRequesterVisibility(baseWhere, user);

      const [items, total] = await Promise.all([
        delegate.findMany({
          where,
          include,
          orderBy: orderBy || { createdAt: 'desc' },
        }),
        delegate.count({ where }),
      ]);

      return { items, total };
    },

    getById: async (id, user) => {
      const parsedId = parsePositiveInt(id, 'id');
      const where = ensureRequesterVisibility({ id: parsedId }, user);

      const record = await delegate.findFirst({
        where,
        include,
      });

      if (!record) {
        throw new ApiError(StatusCodes.NOT_FOUND, `${entityLabel} not found`);
      }

      return record;
    },

    update: async (id, payload) => {
      const parsedId = parsePositiveInt(id, 'id');

      try {
        const data = await delegate.update({
          where: { id: parsedId },
          data: transformUpdateInput(payload),
          include,
        });

        return data;
      } catch (error) {
        handlePrismaError(error, entityLabel);
      }
    },

    remove: async (id) => {
      const parsedId = parsePositiveInt(id, 'id');

      try {
        const data = await delegate.delete({
          where: { id: parsedId },
          include,
        });

        return data;
      } catch (error) {
        handlePrismaError(error, entityLabel);
      }
    },
  };
};

const buildNameCodeInput = (payload, isCreate = false) => {
  const data = {};
  const name = normalizeText(payload.name);
  const code = normalizeCode(payload.code);

  if (isCreate && (!name || !code)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'name and code are required');
  }

  if (payload.name !== undefined) data.name = name;
  if (payload.code !== undefined) data.code = code;
  if (payload.description !== undefined) data.description = normalizeText(payload.description) || null;
  if (payload.isActive !== undefined) data.isActive = parseBoolean(payload.isActive);

  return data;
};

const buildLocationInput = (payload, isCreate = false) => {
  const block = normalizeText(payload.block);

  if (isCreate && !block) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'block is required');
  }

  const data = {};

  if (payload.block !== undefined) data.block = block;
  if (payload.floor !== undefined) data.floor = normalizeText(payload.floor) || null;
  if (payload.ward !== undefined) data.ward = normalizeText(payload.ward) || null;
  if (payload.room !== undefined) data.room = normalizeText(payload.room) || null;
  if (payload.unit !== undefined) data.unit = normalizeText(payload.unit) || null;
  if (payload.description !== undefined) data.description = normalizeText(payload.description) || null;
  if (payload.isActive !== undefined) data.isActive = parseBoolean(payload.isActive);

  return data;
};

const buildSLAInput = (payload, isCreate = false) => {
  const data = {};

  if (isCreate && !payload.priority) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'priority is required');
  }

  if (payload.priority !== undefined) data.priority = payload.priority;
  if (payload.firstResponseMinutes !== undefined) {
    data.firstResponseMinutes = parsePositiveInt(payload.firstResponseMinutes, 'firstResponseMinutes');
  }
  if (payload.resolutionMinutes !== undefined) {
    data.resolutionMinutes = parsePositiveInt(payload.resolutionMinutes, 'resolutionMinutes');
  }
  if (payload.escalationMinutes !== undefined) {
    data.escalationMinutes = parsePositiveInt(payload.escalationMinutes, 'escalationMinutes');
  }
  if (payload.isActive !== undefined) data.isActive = parseBoolean(payload.isActive);

  if (
    isCreate &&
    (data.firstResponseMinutes === undefined ||
      data.resolutionMinutes === undefined ||
      data.escalationMinutes === undefined)
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'firstResponseMinutes, resolutionMinutes, and escalationMinutes are required'
    );
  }

  return data;
};

module.exports = {
  createMasterService,
  buildNameCodeInput,
  buildLocationInput,
  buildSLAInput,
  buildSearchCondition,
  parseBoolean,
  parsePositiveInt,
};
