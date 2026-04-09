const createMasterRouter = require('../../utils/createMasterRouter');
const controller = require('./subDepartment.controller');

module.exports = createMasterRouter(controller);
