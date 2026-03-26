// Recent “assigned to you” notices for helpdesk (from leadership transfers).
const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const parsePagination = require('../../utils/parsePagination');
const TicketActivityLog = require('../../models/TicketActivityLog.model');
const { Role } = require('../../models/enums');

const LEADERSHIP_ASSIGN_ROLES = [Role.HOD, Role.ADMIN];
const FETCH_CAP = 20;
const SIDEBAR_LIMIT = 5;
const LIST_FETCH_CAP = 500;

const shapeNotice = (log) => ({
  id: log?._id?.toString?.() ?? '',
  ticketId: log?.ticketId?._id?.toString?.() ?? log?.ticketId?.toString?.() ?? null,
  ticketNumber: log?.ticketId?.ticketNumber ?? '',
  ticketTitle: log?.ticketId?.title ?? '',
  actorName: log?.actorId?.fullName ?? 'Staff',
  actorRole: log?.actorId?.role ?? null,
  note: log?.note ?? null,
  createdAt: log?.createdAt ?? null,
});

const getAssignmentNoticesForSidebar = async (user) => {
  if (user?.role !== Role.HELPDESK) {
    return { items: [] };
  }

  const userId = String(user?.id ?? '').trim();
  if (!userId) {
    return { items: [] };
  }

  const logs = await TicketActivityLog.find({ action: 'TRANSFERRED', toValue: userId })
    .sort({ createdAt: -1 })
    .limit(FETCH_CAP)
    .populate({ path: 'actorId', select: 'fullName email role' })
    .populate({ path: 'ticketId', select: 'ticketNumber title' })
    .lean();

  const filtered = logs.filter((entry) => LEADERSHIP_ASSIGN_ROLES.includes(entry?.actorId?.role));
  return { items: filtered.slice(0, SIDEBAR_LIMIT).map(shapeNotice) };
};

const getLeadershipAssignmentsList = async (query, user) => {
  if (user?.role !== Role.HELPDESK) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only helpdesk agents can view leadership assignments');
  }

  const { page, limit, skip } = parsePagination(query);
  const userId = String(user?.id ?? '').trim();
  if (!userId) {
    return {
      items: [],
      meta: { page, limit, total: 0, count: 0, totalPages: 1 },
    };
  }

  const logs = await TicketActivityLog.find({ action: 'TRANSFERRED', toValue: userId })
    .sort({ createdAt: -1 })
    .limit(LIST_FETCH_CAP)
    .populate({ path: 'actorId', select: 'fullName email role' })
    .populate({ path: 'ticketId', select: 'ticketNumber title' })
    .lean();

  const filtered = logs.filter((entry) => LEADERSHIP_ASSIGN_ROLES.includes(entry?.actorId?.role));
  const total = filtered.length;
  const slice = filtered.slice(skip, skip + limit);

  return {
    items: slice.map(shapeNotice),
    meta: {
      page,
      limit,
      total,
      count: slice.length,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

module.exports = {
  getAssignmentNoticesForSidebar,
  getLeadershipAssignmentsList,
};
