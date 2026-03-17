const createMasterController = require('../../utils/createMasterController');
const subcategoryService = require('./subcategory.service');

module.exports = createMasterController(subcategoryService, 'Subcategory');
