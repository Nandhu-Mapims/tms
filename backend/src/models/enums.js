// Shared application enums — replaces generated/prisma enum imports across all modules.

const Role = Object.freeze({
  ADMIN: 'ADMIN',
  HELPDESK: 'HELPDESK',
  HOD: 'HOD',
  REQUESTER: 'REQUESTER',
});

const Priority = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
});

const TicketStatus = Object.freeze({
  NEW: 'NEW',
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
  ESCALATED: 'ESCALATED',
  CANCELLED: 'CANCELLED',
});

module.exports = { Role, Priority, TicketStatus };
