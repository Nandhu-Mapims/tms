const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const { INTERNAL_COMMENT_ROLES } = require('./ticket.constants');

const serializeValue = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  return typeof value === 'string' ? value : JSON.stringify(value);
};

const createActivityLog = async (tx, { ticketId, userId, action, oldValue = null, newValue = null, remarks = null }) => {
  return tx.ticketActivityLog.create({
    data: {
      ticketId,
      userId,
      action,
      oldValue: serializeValue(oldValue),
      newValue: serializeValue(newValue),
      remarks,
    },
  });
};

const canViewInternalComments = (user) => INTERNAL_COMMENT_ROLES.includes(user.role);

const ensureInternalCommentPermission = (user, isInternal) => {
  if (isInternal && !canViewInternalComments(user)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only hospital operations roles can add internal comments');
  }
};

module.exports = {
  createActivityLog,
  canViewInternalComments,
  ensureInternalCommentPermission,
};
