// Ticket transfer-request service for helpdesk agents.
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const parsePagination = require('../../utils/parsePagination');

const { Role, TransferRequestStatus } = require('../../models/enums');
const Ticket = require('../../models/Ticket.model');
const User = require('../../models/User.model');
const TicketTransferRequest = require('../../models/TicketTransferRequest.model');

const { getTicketForAccess } = require('./ticket.shared');
const ticketService = require('./ticket.service');

const toObjectId = (value, fieldName) => {
  const normalized = String(value ?? '').trim();
  if (!normalized || !mongoose.Types.ObjectId.isValid(normalized)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${fieldName} must be a valid id`);
  }
  return new mongoose.Types.ObjectId(normalized);
};

const MAX_NOTE_LENGTH = 200;

const normalizeText = (value, fieldName) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (fieldName === 'note' && text.length > MAX_NOTE_LENGTH) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `note must be ${MAX_NOTE_LENGTH} characters or less`);
  }
  return text;
};

const toIdString = (value) => {
  if (value === undefined || value === null) return null;
  return value?.toString?.() ?? String(value);
};

const shapeTransferRequest = (doc) => {
  const d = doc?.toObject ? doc.toObject() : doc;
  return {
    id: d?._id?.toString?.() ?? d?.id ?? null,
    ticketId: toIdString(d?.ticketId?._id ?? d?.ticketId),
    ticketNumber: d?.ticketNumber ?? null,
    ticketTitle: d?.ticketTitle ?? null,
    requesterId: toIdString(d?.requesterId?._id ?? d?.requesterId),
    requester: d?.requesterId ?? null,
    targetAgentId: toIdString(d?.targetAgentId?._id ?? d?.targetAgentId),
    targetAgent: d?.targetAgentId ?? null,
    status: d?.status ?? null,
    requestedNote: d?.requestedNote ?? null,
    decidedNote: d?.decidedNote ?? null,
    createdAt: d?.createdAt ?? null,
    decidedAt: d?.decidedAt ?? null,
  };
};

const canCreateTransferRequest = (user) => user?.role === Role.HELPDESK;

const canApproveTransferRequest = (user, request) => {
  if (!user || !request) return false;
  if ([Role.ADMIN, Role.HOD].includes(user.role)) return true;
  if (user.role === Role.HELPDESK) {
    const userId = String(user.id ?? '');
    const targetAgentId = request?.targetAgentId?.toString?.() ?? '';
    return Boolean(targetAgentId && targetAgentId === userId);
  }
  return false;
};

const createTransferRequest = async (ticketIdentifier, payload, user) => {
  if (!ticketIdentifier) throw new ApiError(StatusCodes.BAD_REQUEST, 'ticket id is required');
  if (!canCreateTransferRequest(user)) throw new ApiError(StatusCodes.FORBIDDEN, 'Only helpdesk agents can request transfers');

  const requestedNote = normalizeText(payload?.note, 'note');
  const ticket = await getTicketForAccess(ticketIdentifier, user);

  const requesterId = toObjectId(user.id, 'requesterId');
  const targetAgentId = ticket?.assignedToId;
  if (!targetAgentId) throw new ApiError(StatusCodes.CONFLICT, 'Ticket is not assigned to any agent');

  const targetUser = await User.findOne({ _id: targetAgentId, isActive: true, role: Role.HELPDESK })
    .select('_id role fullName')
    .lean();
  if (!targetUser) throw new ApiError(StatusCodes.FORBIDDEN, 'Ticket is assigned to a non-helpdesk agent');

  if (String(targetAgentId) === String(requesterId)) {
    throw new ApiError(StatusCodes.CONFLICT, 'You are already the assigned agent for this ticket');
  }

  const alreadyPending = await TicketTransferRequest.findOne({
    ticketId: ticket._id,
    requesterId,
    targetAgentId,
    status: TransferRequestStatus.PENDING,
  });
  if (alreadyPending) {
    throw new ApiError(StatusCodes.CONFLICT, 'A pending transfer request already exists for this ticket');
  }

  const doc = await TicketTransferRequest.create({
    ticketId: ticket._id,
    ticketNumber: ticket.ticketNumber ?? '',
    ticketTitle: ticket.title ?? '',
    requesterId,
    targetAgentId,
    status: TransferRequestStatus.PENDING,
    requestedNote,
  });

  return shapeTransferRequest(doc);
};

const getSentTransferRequests = async (query, user) => {
  if (!canCreateTransferRequest(user)) throw new ApiError(StatusCodes.FORBIDDEN, 'Only helpdesk agents can view transfer requests');
  const { page, limit, skip } = parsePagination(query);

  const requesterId = toObjectId(user.id, 'requesterId');
  const [items, total] = await Promise.all([
    TicketTransferRequest.find({ requesterId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'requesterId', select: 'fullName email role' })
      .populate({ path: 'targetAgentId', select: 'fullName email role' })
      .lean(),
    TicketTransferRequest.countDocuments({ requesterId }),
  ]);

  return {
    items: items.map(shapeTransferRequest),
    meta: { page, limit, total, count: items.length, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

const getReceivedTransferRequests = async (query, user) => {
  if (!canCreateTransferRequest(user)) throw new ApiError(StatusCodes.FORBIDDEN, 'Only helpdesk agents can view transfer requests');
  const { page, limit, skip } = parsePagination(query);

  const targetAgentId = toObjectId(user.id, 'targetAgentId');
  const [items, total] = await Promise.all([
    TicketTransferRequest.find({ targetAgentId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'requesterId', select: 'fullName email role' })
      .populate({ path: 'targetAgentId', select: 'fullName email role' })
      .lean(),
    TicketTransferRequest.countDocuments({ targetAgentId }),
  ]);

  return {
    items: items.map(shapeTransferRequest),
    meta: { page, limit, total, count: items.length, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

const approveTransferRequest = async (requestId, payload, user) => {
  const decidedNote = normalizeText(payload?.note, 'note');
  const requestObjectId = toObjectId(requestId, 'requestId');

  const request = await TicketTransferRequest.findById(requestObjectId);
  if (!request) throw new ApiError(StatusCodes.NOT_FOUND, 'Transfer request not found');
  if (!canApproveTransferRequest(user, request)) throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to approve this request');
  if (request.status !== TransferRequestStatus.PENDING) {
    throw new ApiError(StatusCodes.CONFLICT, `Transfer request cannot be approved in its current state (${request.status})`);
  }

  const ticket = await Ticket.findById(request.ticketId);
  if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');

  const approverId = String(user.id ?? '');
  const currentAssigneeId = ticket?.assignedToId?.toString?.() ?? '';
  if (currentAssigneeId !== String(request.targetAgentId?.toString?.() ?? '')) {
    throw new ApiError(StatusCodes.CONFLICT, 'Ticket assignment has changed. Refresh and try again.');
  }
  if (String(request.targetAgentId?.toString?.() ?? '') !== approverId && user.role === Role.HELPDESK) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only the assigned helpdesk agent can approve this request');
  }

  await ticketService.transferTicket(ticket._id, { assignedToId: request.requesterId, note: decidedNote ?? '' }, user);

  request.status = TransferRequestStatus.APPROVED;
  request.decidedById = toObjectId(user.id, 'decidedById');
  request.decidedNote = decidedNote;
  request.decidedAt = new Date();
  await request.save();

  return shapeTransferRequest(request);
};

const rejectTransferRequest = async (requestId, payload, user) => {
  const decidedNote = normalizeText(payload?.note, 'note');
  const requestObjectId = toObjectId(requestId, 'requestId');

  const request = await TicketTransferRequest.findById(requestObjectId);
  if (!request) throw new ApiError(StatusCodes.NOT_FOUND, 'Transfer request not found');
  if (!canApproveTransferRequest(user, request)) throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to reject this request');
  if (request.status !== TransferRequestStatus.PENDING) {
    throw new ApiError(StatusCodes.CONFLICT, `Transfer request cannot be rejected in its current state (${request.status})`);
  }

  request.status = TransferRequestStatus.REJECTED;
  request.decidedById = toObjectId(user.id, 'decidedById');
  request.decidedNote = decidedNote;
  request.decidedAt = new Date();
  await request.save();

  return shapeTransferRequest(request);
};

module.exports = {
  createTransferRequest,
  getSentTransferRequests,
  getReceivedTransferRequests,
  approveTransferRequest,
  rejectTransferRequest,
};

