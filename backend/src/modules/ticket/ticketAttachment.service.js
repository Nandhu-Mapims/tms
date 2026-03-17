const path = require('path');
const { prisma } = require('../../config/database');
const parsePositiveInt = require('../../utils/parsePositiveInt');
const ApiError = require('../../utils/ApiError');
const { StatusCodes } = require('http-status-codes');
const { createActivityLog } = require('./ticketActivity.service');
const { getTicketForAccess } = require('./ticket.shared');

const addAttachment = async (ticketId, file, user) => {
  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'attachment file is required');
  }

  const parsedTicketId = parsePositiveInt(ticketId, 'id');
  const ticket = await getTicketForAccess(parsedTicketId, user);

  return prisma.$transaction(async (tx) => {
    const attachment = await tx.ticketAttachment.create({
      data: {
        ticketId: ticket.id,
        uploadedById: user.id,
        originalName: file.originalname,
        fileName: file.filename,
        filePath: path.join('uploads', 'tickets', file.filename).replace(/\\/g, '/'),
        mimeType: file.mimetype,
        fileSize: file.size,
      },
      include: {
        uploadedBy: {
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
      action: 'ATTACHMENT_ADDED',
      newValue: {
        originalName: file.originalname,
        fileName: file.filename,
      },
      remarks: 'Ticket attachment uploaded',
    });

    return attachment;
  });
};

const getAttachments = async (ticketId, user) => {
  const parsedTicketId = parsePositiveInt(ticketId, 'id');
  const ticket = await getTicketForAccess(parsedTicketId, user);

  return prisma.ticketAttachment.findMany({
    where: { ticketId: ticket.id },
    include: {
      uploadedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = {
  addAttachment,
  getAttachments,
};
