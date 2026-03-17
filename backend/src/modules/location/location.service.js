const { createMasterService, buildLocationInput } = require('../../utils/masterServiceFactory');

const locationService = createMasterService({
  model: 'location',
  entityLabel: 'Location',
  searchFields: ['block', 'floor', 'ward', 'room', 'unit', 'description'],
  transformCreateInput: (payload) => buildLocationInput(payload, true),
  transformUpdateInput: (payload) => buildLocationInput(payload, false),
  include: undefined,
  orderBy: [{ block: 'asc' }, { floor: 'asc' }, { ward: 'asc' }, { room: 'asc' }],
});

module.exports = locationService;
