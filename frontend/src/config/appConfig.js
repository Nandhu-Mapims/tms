export const APP_NAME = 'MAPIMS';
export const APP_SUBTITLE = 'Hospital Ticket Management System';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const API_PUBLIC_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/** Where Feedback serves `/uploads/...` for voice. Prefer `VITE_FEEDBACK_SYSTEM_ORIGIN` at build time. */
export function getFeedbackSystemOrigin() {
  const fromEnv = (import.meta.env.VITE_FEEDBACK_SYSTEM_ORIGIN || '').trim();
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h === 'tms.mapims.edu.in') {
      return 'https://feedback.mapims.edu.in';
    }
  }
  return '';
}

export const ROLE_LABELS = {
  ADMIN: 'Administrator',
  CHIEF: 'Chief',
  HELPDESK: 'Helpdesk',
  HOD: 'Head of Department',
  REQUESTER: 'Requester',
};

export const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'bi-speedometer2',
    path: '/dashboard',
    roles: ['ADMIN', 'CHIEF', 'HELPDESK', 'HOD', 'REQUESTER'],
  },
  {
    key: 'tickets',
    label: 'Tickets',
    icon: 'bi-file-earmark-medical',
    path: '/tickets',
    roles: ['ADMIN', 'CHIEF', 'HELPDESK', 'HOD', 'REQUESTER'],
  },
  {
    key: 'feedback-tickets',
    label: 'Feedback Tickets',
    icon: 'bi-chat-left-text',
    path: '/feedback-tickets',
    roles: ['ADMIN', 'CHIEF', 'HELPDESK', 'HOD', 'REQUESTER'],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: 'bi-graph-up-arrow',
    path: '/reports',
    roles: ['ADMIN', 'CHIEF'],
  },
  {
    key: 'hod-tickets',
    label: 'HOD Tickets',
    icon: 'bi-briefcase',
    path: '/hod-to-hod-tickets',
    roles: ['HOD'],
  },
  {
    key: 'transfer-requests',
    label: 'Transfer Requests',
    icon: 'bi-arrow-repeat',
    path: '/transfer-requests',
    roles: ['HELPDESK'],
  },
  {
    key: 'leadership-assignments',
    label: 'Leadership Assignments',
    icon: 'bi-person-badge',
    path: '/leadership-assignments',
    roles: ['HELPDESK'],
  },
  {
    key: 'create-ticket',
    label: 'Create Ticket',
    icon: 'bi-plus-square',
    path: '/tickets/create',
    roles: ['REQUESTER', 'HOD'],
  },
  {
    key: 'departments',
    label: 'Departments',
    icon: 'bi-building',
    path: '/admin/departments',
    roles: ['ADMIN', 'CHIEF', 'HELPDESK', 'HOD'],
  },
  {
    key: 'sub-departments',
    label: 'Sub-Departments',
    icon: 'bi-diagram-2',
    path: '/admin/sub-departments',
    roles: ['ADMIN', 'CHIEF', 'HELPDESK', 'HOD'],
  },
  {
    key: 'categories',
    label: 'Categories',
    icon: 'bi-tags',
    path: '/admin/categories',
    roles: ['ADMIN', 'CHIEF', 'HELPDESK', 'HOD'],
  },
  {
    key: 'subcategories',
    label: 'Subcategories',
    icon: 'bi-diagram-3',
    path: '/admin/subcategories',
    roles: ['ADMIN', 'CHIEF', 'HELPDESK', 'HOD'],
  },
  {
    key: 'locations',
    label: 'Locations',
    icon: 'bi-geo-alt',
    path: '/admin/locations',
    roles: ['ADMIN', 'CHIEF', 'HELPDESK', 'HOD'],
  },
  {
    key: 'sla',
    label: 'SLA Settings',
    icon: 'bi-clock-history',
    path: '/admin/sla-settings',
    roles: ['ADMIN'],
  },
  {
    key: 'users',
    label: 'Users',
    icon: 'bi-people',
    path: '/admin/users',
    roles: ['ADMIN'],
  },
];
