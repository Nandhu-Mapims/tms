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

export const canAssignTicket = (role) => ['ADMIN', 'HELPDESK', 'HOD'].includes(role);
export const canResolveTicket = (role, ticket, userId) =>
  ['ADMIN', 'HELPDESK', 'HOD'].includes(role) || ticket?.assignedToId === userId;
export const canCloseTicket = (role) => ['ADMIN', 'HELPDESK', 'HOD'].includes(role);
export const canReopenTicket = (role) => ['ADMIN', 'HELPDESK', 'HOD'].includes(role);
export const canEscalateTicket = (role) => ['ADMIN', 'HELPDESK', 'HOD'].includes(role);
export const canUseInternalComments = (role) => ['ADMIN', 'HELPDESK', 'HOD', 'TECHNICIAN'].includes(role);
