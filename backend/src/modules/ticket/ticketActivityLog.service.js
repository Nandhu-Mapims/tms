const { getTicketForAccess } = require('./ticket.shared');
const TicketActivityLog = require('../../models/TicketActivityLog.model');

const getActivityLog = async (ticketId, user) => {
  const ticket = await getTicketForAccess(ticketId, user);

  const items = await TicketActivityLog.find({ ticketId: ticket._id })
    .sort({ createdAt: -1 })
    .populate({ path: 'actorId', select: 'fullName email role' })
    .lean();

  return items.map((i) => ({
    id: i._id.toString(),
    ticketId: i.ticketId.toString(),
    userId: i.actorId?._id?.toString?.() ?? null,
    action: i.action,
    oldValue: i.fromValue ?? null,
    newValue: i.toValue ?? null,
    remarks: i.note ?? null,
    createdAt: i.createdAt,
    user: i.actorId
      ? { id: i.actorId._id.toString(), fullName: i.actorId.fullName, email: i.actorId.email, role: i.actorId.role }
      : null,
  }));
};

module.exports = {
  getActivityLog,
};
