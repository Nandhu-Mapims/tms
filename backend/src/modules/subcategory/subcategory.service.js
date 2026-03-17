const { StatusCodes } = require('http-status-codes');
const {
  createMasterService,
  buildNameCodeInput,
  buildSearchCondition,
  parsePositiveInt,
} = require('../../utils/masterServiceFactory');
const ApiError = require('../../utils/ApiError');

const buildSubcategoryInput = (payload, isCreate = false) => {
  const base = buildNameCodeInput(payload, isCreate);
  const categoryId = parsePositiveInt(payload.categoryId, 'categoryId');

  if (isCreate && categoryId === undefined) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'categoryId is required');
  }

  return {
    ...base,
    ...(categoryId !== undefined && { categoryId }),
  };
};

const subcategoryService = createMasterService({
  model: 'subcategory',
  entityLabel: 'Subcategory',
  searchFields: ['name', 'code', 'description'],
  transformCreateInput: (payload) => buildSubcategoryInput(payload, true),
  transformUpdateInput: (payload) => buildSubcategoryInput(payload, false),
  include: {
    category: {
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
    },
  },
  orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
  buildListWhere: (filters) => {
    const categoryId = filters.categoryId ? parsePositiveInt(filters.categoryId, 'categoryId') : undefined;

    return {
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(categoryId !== undefined && { categoryId }),
      ...buildSearchCondition(filters.search, ['name', 'code', 'description']),
    };
  },
});

module.exports = subcategoryService;
