const { StatusCodes } = require('http-status-codes');
const { prisma } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const parsePositiveInt = require('../../utils/parsePositiveInt');
const { canViewInternalComments, ensureInternalCommentPermission, createActivityLog } = require('./ticketActivity.service');
const { getTicketForAccess } = require('./ticket.shared');

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);

const addComment = async (ticketId, payload, user) => {
  const parsedTicketId = parsePositiveInt(ticketId, 'id');
  const ticket = await getTicketForAccess(parsedTicketId, user);
  const comment = normalizeText(payload.comment);
  const isInternal = payload.isInternal === true;

  if (!comment) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'comment is required');
  }

  ensureInternalCommentPermission(user, isInternal);

  return prisma.$transaction(async (tx) => {
    const createdComment = await tx.ticketComment.create({
      data: {
        ticketId: ticket.id,
        userId: user.id,
        comment,
        isInternal,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await createActivityLog(tx, {
      ticketId: ticket.id,
      userId: user.id,
      action: 'COMMENT_ADDED',
      newValue: { comment, isInternal },
      remarks: isInternal ? 'Internal ticket comment added' : 'Public ticket comment added',
    });

    return createdComment;
  });
};

const getComments = async (ticketId, user) => {
  const parsedTicketId = parsePositiveInt(ticketId, 'id');
  const ticket = await getTicketForAccess(parsedTicketId, user);

  const where = {
    ticketId: ticket.id,
    ...(canViewInternalComments(user) ? {} : { isInternal: false }),
  };

  return prisma.ticketComment.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

module.exports = {
  addComment,
  getComments,
};
