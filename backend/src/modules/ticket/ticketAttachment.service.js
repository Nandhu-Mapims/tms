const path = require('path');
const ApiError = require('../../utils/ApiError');
const { StatusCodes } = require('http-status-codes');
const { createActivityLog } = require('./ticketActivity.service');
const { getTicketForAccess } = require('./ticket.shared');
const TicketAttachment = require('../../models/TicketAttachment.model');
const User = require('../../models/User.model');

const addAttachment = async (ticketId, file, user) => {
  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'attachment file is required');
  }

  const ticket = await getTicketForAccess(ticketId, user);

  const attachment = await TicketAttachment.create({
    ticketId: ticket._id,
    uploadedById: user.id,
    fileName: file.originalname,
    filePath: path.join('uploads', 'tickets', file.filename).replace(/\\/g, '/'),
    mimeType: file.mimetype,
    sizeBytes: file.size,
  });

  await createActivityLog(null, {
    ticketId: ticket._id,
    userId: user.id,
    action: 'ATTACHMENT_ADDED',
    newValue: {
      originalName: file.originalname,
      fileName: file.filename,
    },
    remarks: 'Ticket attachment uploaded',
  });

  const uploader = await User.findById(attachment.uploadedById).select('fullName email role').lean();

  return {
    id: attachment._id.toString(),
    ticketId: attachment.ticketId.toString(),
    uploadedById: attachment.uploadedById.toString(),
    originalName: file.originalname,
    fileName: file.filename,
    filePath: attachment.filePath,
    mimeType: attachment.mimeType,
    fileSize: attachment.sizeBytes,
    createdAt: attachment.createdAt,
    uploadedBy: uploader
      ? { id: uploader._id.toString(), fullName: uploader.fullName, email: uploader.email, role: uploader.role }
      : null,
  };
};

const getAttachments = async (ticketId, user) => {
  const ticket = await getTicketForAccess(ticketId, user);

  const attachments = await TicketAttachment.find({ ticketId: ticket._id })
    .sort({ createdAt: -1 })
    .populate({ path: 'uploadedById', select: 'fullName email role' })
    .lean();

  return attachments.map((a) => ({
    id: a._id.toString(),
    ticketId: a.ticketId.toString(),
    uploadedById: a.uploadedById?._id?.toString?.() ?? null,
    originalName: a.fileName,
    fileName: a.filePath?.split('/')?.pop?.() ?? a.fileName,
    filePath: a.filePath,
    mimeType: a.mimeType,
    fileSize: a.sizeBytes,
    createdAt: a.createdAt,
    uploadedBy: a.uploadedById
      ? {
          id: a.uploadedById._id.toString(),
          fullName: a.uploadedById.fullName,
          email: a.uploadedById.email,
          role: a.uploadedById.role,
        }
      : null,
  }));
};

module.exports = {
  addAttachment,
  getAttachments,
};
