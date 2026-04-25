import api from './api';

export const categorieClientService = {
  getAll: () => api.get('/categories-clients'),
  getById: (id) => api.get(`/categories-clients/${id}`),
  create: (data) => api.post('/categories-clients', data),
  update: (id, data) => api.put(`/categories-clients/${id}`, data),
  remove: (id) => api.delete(`/categories-clients/${id}`),
};
