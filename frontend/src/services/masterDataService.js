import apiClient from './apiClient';

const jsonConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
};

export const getDepartments = async (params = {}) => {
  const response = await apiClient.get('/departments', { params });
  return response.data;
};

export const getCategories = async (params = {}) => {
  const response = await apiClient.get('/categories', { params });
  return response.data;
};

export const getSubcategories = async (params = {}) => {
  const response = await apiClient.get('/subcategories', { params });
  return response.data;
};

export const getLocations = async (params = {}) => {
  const response = await apiClient.get('/locations', { params });
  return response.data;
};

export const getSlaConfigs = async (params = {}) => {
  const response = await apiClient.get('/sla-configs', { params });
  return response.data;
};

export const createDepartment = async (payload) => {
  const response = await apiClient.post('/departments', payload, jsonConfig);
  return response.data;
};

export const updateDepartment = async (id, payload) => {
  const response = await apiClient.put(`/departments/${id}`, payload, jsonConfig);
  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await apiClient.delete(`/departments/${id}`);
  return response.data;
};

export const createCategory = async (payload) => {
  const response = await apiClient.post('/categories', payload, jsonConfig);
  return response.data;
};

export const updateCategory = async (id, payload) => {
  const response = await apiClient.put(`/categories/${id}`, payload, jsonConfig);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await apiClient.delete(`/categories/${id}`);
  return response.data;
};

export const createSubcategory = async (payload) => {
  const response = await apiClient.post('/subcategories', payload, jsonConfig);
  return response.data;
};

export const updateSubcategory = async (id, payload) => {
  const response = await apiClient.put(`/subcategories/${id}`, payload, jsonConfig);
  return response.data;
};

export const deleteSubcategory = async (id) => {
  const response = await apiClient.delete(`/subcategories/${id}`);
  return response.data;
};

export const createLocation = async (payload) => {
  const response = await apiClient.post('/locations', payload, jsonConfig);
  return response.data;
};

export const updateLocation = async (id, payload) => {
  const response = await apiClient.put(`/locations/${id}`, payload, jsonConfig);
  return response.data;
};

export const deleteLocation = async (id) => {
  const response = await apiClient.delete(`/locations/${id}`);
  return response.data;
};

export const createSlaConfig = async (payload) => {
  const response = await apiClient.post('/sla-configs', payload, jsonConfig);
  return response.data;
};

export const updateSlaConfig = async (id, payload) => {
  const response = await apiClient.put(`/sla-configs/${id}`, payload, jsonConfig);
  return response.data;
};

export const deleteSlaConfig = async (id) => {
  const response = await apiClient.delete(`/sla-configs/${id}`);
  return response.data;
};
