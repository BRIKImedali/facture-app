import api from './api';

export const uniteService = {
  getAll: () => api.get('/unites'),
  getById: (id) => api.get(`/unites/${id}`),
  create: (data) => api.post('/unites', data),
  update: (id, data) => api.put(`/unites/${id}`, data),
  remove: (id) => api.delete(`/unites/${id}`),
};
