const createMasterController = require('../../utils/createMasterController');
const categoryService = require('./category.service');

module.exports = createMasterController(categoryService, 'Category');
