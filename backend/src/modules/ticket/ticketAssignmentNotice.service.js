// Recent “assigned to you” notices for helpdesk (from leadership transfers).
const TicketActivityLog = require('../../models/TicketActivityLog.model');
const { Role } = require('../../models/enums');

const LEADERSHIP_ASSIGN_ROLES = [Role.HOD, Role.ADMIN];
const FETCH_CAP = 20;
const SIDEBAR_LIMIT = 5;

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

module.exports = {
  getAssignmentNoticesForSidebar,
};
