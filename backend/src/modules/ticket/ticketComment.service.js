const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const { canViewInternalComments, ensureInternalCommentPermission, createActivityLog } = require('./ticketActivity.service');
const { getTicketForAccess } = require('./ticket.shared');
const TicketComment = require('../../models/TicketComment.model');
const User = require('../../models/User.model');

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);

const addComment = async (ticketId, payload, user) => {
  const ticket = await getTicketForAccess(ticketId, user);
  const comment = normalizeText(payload?.comment);
  const isInternal = payload.isInternal === true;

  if (!comment) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'comment is required');
  }

  ensureInternalCommentPermission(user, isInternal);

  const createdComment = await TicketComment.create({
    ticketId: ticket._id,
    authorId: user.id,
    content: comment,
    isInternal,
  });

  await createActivityLog(null, {
    ticketId: ticket._id,
    userId: user.id,
    action: 'COMMENT_ADDED',
    newValue: { comment, isInternal },
    remarks: isInternal ? 'Internal ticket comment added' : 'Public ticket comment added',
  });

  const author = await User.findById(createdComment.authorId).select('fullName email role').lean();
  return {
    id: createdComment._id.toString(),
    ticketId: createdComment.ticketId.toString(),
    userId: createdComment.authorId.toString(),
    comment: createdComment.content,
    isInternal: createdComment.isInternal,
    createdAt: createdComment.createdAt,
    user: author
      ? { id: author._id.toString(), fullName: author.fullName, email: author.email, role: author.role }
      : null,
  };
};

const getComments = async (ticketId, user) => {
  const ticket = await getTicketForAccess(ticketId, user);

  const where = {
    ticketId: ticket._id,
    ...(canViewInternalComments(user) ? {} : { isInternal: false }),
  };

  const comments = await TicketComment.find(where)
    .sort({ createdAt: 1 })
    .populate({ path: 'authorId', select: 'fullName email role' })
    .lean();

  return comments.map((c) => ({
    id: c._id.toString(),
    ticketId: c.ticketId.toString(),
    userId: c.authorId?._id?.toString?.() ?? null,
    comment: c.content,
    isInternal: c.isInternal,
    createdAt: c.createdAt,
    user: c.authorId
      ? { id: c.authorId._id.toString(), fullName: c.authorId.fullName, email: c.authorId.email, role: c.authorId.role }
      : null,
  }));
};

module.exports = {
  addComment,
  getComments,
};
