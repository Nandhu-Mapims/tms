const mongoose = require('mongoose');
const { getTicketForAccess } = require('./ticket.shared');
const TicketActivityLog = require('../../models/TicketActivityLog.model');
const User = require('../../models/User.model');

const looksLikeObjectIdString = (value) => {
  if (value === undefined || value === null) return false;
  const str = String(value).trim();
  if (str.length !== 24) return false;
  return mongoose.Types.ObjectId.isValid(str);
};

const buildUserNameMap = async (rawValues) => {
  const idStrings = [...new Set((rawValues ?? []).filter(looksLikeObjectIdString))];
  if (!idStrings.length) return new Map();

  const objectIds = idStrings.map((id) => new mongoose.Types.ObjectId(id));
  const users = await User.find({ _id: { $in: objectIds } }).select('fullName').lean();
  return new Map(users.map((u) => [u._id.toString(), String(u.fullName ?? '').trim() || 'User']));
};

const formatActivityStoredValue = (raw, nameMap) => {
  if (raw === undefined || raw === null) return null;
  const str = typeof raw === 'string' ? raw : String(raw);
  if (!str.trim()) return null;
  if (looksLikeObjectIdString(str)) {
    return nameMap.get(str) ?? str;
  }
  return str;
};

const getActivityLog = async (ticketId, user) => {
  const ticket = await getTicketForAccess(ticketId, user);

  const items = await TicketActivityLog.find({ ticketId: ticket._id })
    .sort({ createdAt: -1 })
    .populate({ path: 'actorId', select: 'fullName email role' })
    .lean();

  const nameMap = await buildUserNameMap(items.flatMap((row) => [row.fromValue, row.toValue].filter(Boolean)));

  return items.map((i) => ({
    id: i._id.toString(),
    ticketId: i.ticketId.toString(),
    userId: i.actorId?._id?.toString?.() ?? null,
    action: i.action,
    oldValue: formatActivityStoredValue(i.fromValue, nameMap),
    newValue: formatActivityStoredValue(i.toValue, nameMap),
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
