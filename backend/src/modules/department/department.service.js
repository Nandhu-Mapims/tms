const createMasterService = require('../../utils/masterServiceFactory').createMasterService;
const { buildNameCodeInput } = require('../../utils/masterServiceFactory');

const departmentService = createMasterService({
  model: 'department',
  entityLabel: 'Department',
  searchFields: ['name', 'code', 'description'],
  transformCreateInput: (payload) => buildNameCodeInput(payload, true),
  transformUpdateInput: (payload) => buildNameCodeInput(payload, false),
  include: undefined,
  orderBy: { name: 'asc' },
});

module.exports = departmentService;
