const { Role } = require('../../models/enums');

const STAFF_VIEW_ROLES = [Role.ADMIN, Role.HELPDESK, Role.HOD];
const INTERNAL_COMMENT_ROLES = [Role.ADMIN, Role.HELPDESK, Role.HOD, Role.TECHNICIAN];
const STAFF_ACTION_ROLES = [Role.ADMIN, Role.HELPDESK, Role.HOD];
const ESCALATION_ROLES = [Role.ADMIN, Role.HELPDESK, Role.HOD];

module.exports = {
  STAFF_VIEW_ROLES,
  INTERNAL_COMMENT_ROLES,
  STAFF_ACTION_ROLES,
  ESCALATION_ROLES,
};
