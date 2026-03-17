const createMasterRouter = require('../../utils/createMasterRouter');
const controller = require('./department.controller');

module.exports = createMasterRouter(controller);
