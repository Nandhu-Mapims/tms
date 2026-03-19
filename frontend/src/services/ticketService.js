import apiClient from './apiClient';

const jsonConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
};

export const getTicketsRequest = async (params = {}) => {
  const response = await apiClient.get('/tickets', { params });
  return response.data;
};

export const getTicketByIdRequest = async (id) => {
  const response = await apiClient.get(`/tickets/${id}`);
  return response.data;
};

export const createTicketRequest = async (payload) => {
  const hasAttachment = Boolean(payload.attachment);

  if (!hasAttachment) {
    const response = await apiClient.post('/tickets', payload, jsonConfig);
    return response.data;
  }

  const { attachment, ...ticketPayload } = payload;
  const ticketResponse = await apiClient.post('/tickets', ticketPayload, jsonConfig);

  const formData = new FormData();
  formData.append('attachment', attachment);

  const ticketId =
    ticketResponse?.data?.data?.id ??
    ticketResponse?.data?.id ??
    ticketResponse?.data?.data?._id ??
    ticketResponse?.data?._id;

  if (!ticketId) {
    throw new Error('Unable to upload attachment: created ticket id is missing');
  }

  await apiClient.post(`/tickets/${ticketId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return ticketResponse.data;
};

export const updateTicketRequest = async (id, payload) => {
  const response = await apiClient.patch(`/tickets/${id}`, payload, jsonConfig);
  return response.data;
};

export const updateTicketStatusRequest = async (id, payload) => {
  const response = await apiClient.patch(`/tickets/${id}/status`, payload, jsonConfig);
  return response.data;
};

export const claimTicketRequest = async (id) => {
  const response = await apiClient.patch(`/tickets/${id}/claim`, {}, jsonConfig);
  return response.data;
};

export const transferTicketRequest = async (id, payload) => {
  const response = await apiClient.patch(`/tickets/${id}/transfer`, payload, jsonConfig);
  return response.data;
};

export const resolveTicketRequest = async (id, payload) => {
  const response = await apiClient.patch(`/tickets/${id}/resolve`, payload, jsonConfig);
  return response.data;
};

export const closeTicketRequest = async (id) => {
  const response = await apiClient.patch(`/tickets/${id}/close`, {}, jsonConfig);
  return response.data;
};

export const reopenTicketRequest = async (id) => {
  const response = await apiClient.patch(`/tickets/${id}/reopen`, {}, jsonConfig);
  return response.data;
};

export const escalateTicketRequest = async (id, payload) => {
  const response = await apiClient.patch(`/tickets/${id}/escalate`, payload, jsonConfig);
  return response.data;
};

export const getTicketCommentsRequest = async (id) => {
  const response = await apiClient.get(`/tickets/${id}/comments`);
  return response.data;
};

export const addTicketCommentRequest = async (id, payload) => {
  const response = await apiClient.post(`/tickets/${id}/comments`, payload, jsonConfig);
  return response.data;
};

export const getTicketAttachmentsRequest = async (id) => {
  const response = await apiClient.get(`/tickets/${id}/attachments`);
  return response.data;
};

export const addTicketAttachmentRequest = async (id, file) => {
  const formData = new FormData();
  formData.append('attachment', file);

  const response = await apiClient.post(`/tickets/${id}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getTicketActivityLogRequest = async (id) => {
  const response = await apiClient.get(`/tickets/${id}/activity-log`);
  return response.data;
};
