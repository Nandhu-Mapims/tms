const createMasterRouter = require('../../utils/createMasterRouter');
const controller = require('./category.controller');

module.exports = createMasterRouter(controller);
