const createMasterRouter = require('../../utils/createMasterRouter');
const controller = require('./location.controller');

module.exports = createMasterRouter(controller);
