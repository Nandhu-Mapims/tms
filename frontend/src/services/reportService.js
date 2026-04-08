import apiClient from './apiClient';

export const getTicketReportRequest = async (params = {}) => {
  const response = await apiClient.get('/reports/tickets', { params });
  return response.data;
};

export const getMonthlyReportBreakdownRequest = async (params = {}) => {
  const response = await apiClient.get('/reports/monthly-breakdown', { params });
  return response.data;
};

export const downloadTicketReportExport = async (params = {}) => {
  const response = await apiClient.get('/reports/tickets/export', {
    params,
    responseType: 'blob',
  });
  return response;
};
