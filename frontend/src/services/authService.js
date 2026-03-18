import apiClient from './apiClient';

export const loginRequest = async (payload) => {
  const response = await apiClient.post('/auth/login', payload);
  return response.data;
};

export const getCurrentUserRequest = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const registerUserRequest = async (payload) => {
  const response = await apiClient.post('/auth/register', payload);
  return response.data;
};

export const getAssignableUsersRequest = async () => {
  const response = await apiClient.get('/users/assignable');
  return response.data;
};

export const getUsersRequest = async (params = {}) => {
  const response = await apiClient.get('/users', { params });
  return response.data;
};

export const getUserByIdRequest = async (id) => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const updateUserRequest = async (id, payload) => {
  const response = await apiClient.patch(`/users/${id}`, payload);
  return response.data;
};

export const updateUserStatusRequest = async (id, payload) => {
  const response = await apiClient.patch(`/users/${id}/status`, payload);
  return response.data;
};
