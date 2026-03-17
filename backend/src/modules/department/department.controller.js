const createMasterController = require('../../utils/createMasterController');
const departmentService = require('./department.service');

module.exports = createMasterController(departmentService, 'Department');
