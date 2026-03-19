export const APP_NAME = 'MAPIMS';
export const APP_SUBTITLE = 'Hospital Ticket Management System';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const API_PUBLIC_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const ROLE_LABELS = {
  ADMIN: 'Administrator',
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
    roles: ['ADMIN', 'HELPDESK', 'HOD', 'REQUESTER'],
  },
  {
    key: 'tickets',
    label: 'Tickets',
    icon: 'bi-file-earmark-medical',
    path: '/tickets',
    roles: ['ADMIN', 'HELPDESK', 'HOD', 'REQUESTER'],
  },
  {
    key: 'create-ticket',
    label: 'Create Ticket',
    icon: 'bi-plus-square',
    path: '/tickets/create',
    roles: ['REQUESTER'],
  },
  {
    key: 'departments',
    label: 'Departments',
    icon: 'bi-building',
    path: '/admin/departments',
    roles: ['ADMIN', 'HELPDESK', 'HOD'],
  },
  {
    key: 'categories',
    label: 'Categories',
    icon: 'bi-tags',
    path: '/admin/categories',
    roles: ['ADMIN', 'HELPDESK', 'HOD'],
  },
  {
    key: 'subcategories',
    label: 'Subcategories',
    icon: 'bi-diagram-3',
    path: '/admin/subcategories',
    roles: ['ADMIN', 'HELPDESK', 'HOD'],
  },
  {
    key: 'locations',
    label: 'Locations',
    icon: 'bi-geo-alt',
    path: '/admin/locations',
    roles: ['ADMIN', 'HELPDESK', 'HOD'],
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
