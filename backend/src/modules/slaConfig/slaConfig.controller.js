const createMasterController = require('../../utils/createMasterController');
const slaConfigService = require('./slaConfig.service');

module.exports = createMasterController(slaConfigService, 'SLA configuration');
