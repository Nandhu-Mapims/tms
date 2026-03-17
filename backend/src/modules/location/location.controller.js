const createMasterController = require('../../utils/createMasterController');
const locationService = require('./location.service');

module.exports = createMasterController(locationService, 'Location');
