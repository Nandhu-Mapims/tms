export const STATUS_OPTIONS = [
  'NEW',
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_HOLD',
  'ESCALATED',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
  'CANCELLED',
];

export const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const STATUS_LABELS = {
  NEW: 'New',
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
  CANCELLED: 'Cancelled',
};

export const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const getStatusBadgeClass = (status) => {
  const map = {
    NEW: 'text-bg-primary',
    OPEN: 'text-bg-info',
    ASSIGNED: 'text-bg-secondary',
    IN_PROGRESS: 'text-bg-warning',
    ON_HOLD: 'text-bg-dark',
    ESCALATED: 'text-bg-danger',
    RESOLVED: 'text-bg-success',
    CLOSED: 'text-bg-success',
    REOPENED: 'text-bg-warning',
    CANCELLED: 'text-bg-light',
  };

  return map[status] || 'text-bg-light';
};

export const getPriorityBadgeClass = (priority) => {
  const map = {
    LOW: 'bg-success-subtle text-success',
    MEDIUM: 'bg-info-subtle text-info-emphasis',
    HIGH: 'bg-warning-subtle text-warning-emphasis',
    CRITICAL: 'bg-danger-subtle text-danger',
  };

  return map[priority] || 'bg-light text-dark';
};

export const formatDateTime = (value) => {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const canResolveTicket = (role, ticket, userId) =>
  ['ADMIN', 'HELPDESK', 'HOD'].includes(role) || ticket?.requesterId === userId;
export const canCloseTicket = (role) => ['ADMIN', 'HELPDESK', 'HOD'].includes(role);
export const canReopenTicket = (role) => ['ADMIN', 'HELPDESK', 'HOD'].includes(role);
export const canEscalateTicket = (role) => ['ADMIN', 'HELPDESK', 'HOD'].includes(role);
export const canUseInternalComments = (role) => ['ADMIN', 'HELPDESK', 'HOD'].includes(role);

export const getTimeTakenLabel = (ticket) => {
  const createdAt = ticket?.createdAt ? new Date(ticket.createdAt) : null;
  const end =
    ticket?.closedAt ? new Date(ticket.closedAt) : ticket?.cancelledAt ? new Date(ticket.cancelledAt) : ticket?.resolvedAt ? new Date(ticket.resolvedAt) : null;

  if (!createdAt || Number.isNaN(createdAt.getTime())) return 'Not available';
  if (!end || Number.isNaN(end.getTime())) {
    const diffMs = Date.now() - createdAt.getTime();
    const days = Math.floor(diffMs / 86400000);
    return days <= 0 ? 'Opened today' : `${days} day(s) open`;
  }

  const diffMs = Math.max(0, end.getTime() - createdAt.getTime());
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${Math.max(0, hours)}h`;
};
