const createMasterRouter = require('../../utils/createMasterRouter');
const controller = require('./slaConfig.controller');

module.exports = createMasterRouter(controller);
