const { StatusCodes } = require('http-status-codes');
const parseBoolean = require('./parseBoolean');

const buildListMeta = (items, total) => ({
  count: items.length,
  total,
});

const createMasterController = (service, entityLabel) => ({
  create: async (req, res) => {
    const data = await service.create(req.body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `${entityLabel} created successfully`,
      data,
    });
  },

  getAll: async (req, res) => {
    const filters = {
      search: req.query.search,
      isActive: parseBoolean(req.query.isActive),
      categoryId: req.query.categoryId,
    };

    const result = await service.getAll(filters, req.user);

    res.status(StatusCodes.OK).json({
      success: true,
      message: `${entityLabel} list fetched successfully`,
      data: result.items,
      meta: buildListMeta(result.items, result.total),
    });
  },

  getById: async (req, res) => {
    const data = await service.getById(req.params.id, req.user);

    res.status(StatusCodes.OK).json({
      success: true,
      message: `${entityLabel} fetched successfully`,
      data,
    });
  },

  update: async (req, res) => {
    const data = await service.update(req.params.id, req.body);

    res.status(StatusCodes.OK).json({
      success: true,
      message: `${entityLabel} updated successfully`,
      data,
    });
  },

  remove: async (req, res) => {
    const data = await service.remove(req.params.id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: `${entityLabel} deleted successfully`,
      data,
    });
  },
});

module.exports = createMasterController;
