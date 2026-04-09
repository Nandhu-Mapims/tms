const createMasterController = require('../../utils/createMasterController');
const subDepartmentService = require('./subDepartment.service');

module.exports = createMasterController(subDepartmentService, 'Sub-department');
