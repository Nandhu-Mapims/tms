import apiClient from './apiClient';

export const getDashboardSummary = async () => {
  const response = await apiClient.get('/dashboard/summary');
  return response.data;
};

export const getDashboardCategoryWise = async () => {
  const response = await apiClient.get('/dashboard/category-wise');
  return response.data;
};

export const getDashboardDepartmentWise = async () => {
  const response = await apiClient.get('/dashboard/department-wise');
  return response.data;
};

export const getDashboardPriorityWise = async () => {
  const response = await apiClient.get('/dashboard/priority-wise');
  return response.data;
};

export const getDashboardStatusWise = async () => {
  const response = await apiClient.get('/dashboard/status-wise');
  return response.data;
};

export const getDashboardMonthlyTrend = async (months = 6) => {
  const response = await apiClient.get('/dashboard/monthly-trend', { params: { months } });
  return response.data;
};

export const getDashboardTechnicianPerformance = async () => {
  const response = await apiClient.get('/dashboard/technician-performance');
  return response.data;
};
