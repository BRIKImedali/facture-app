import api from './api';

export const deviseService = {
  getAll:  ()           => api.get('/devises'),
  getById: (id)         => api.get(`/devises/${id}`),
  create:  (data)       => api.post('/devises', data),
  update:  (id, data)   => api.put(`/devises/${id}`, data),
  remove:  (id)         => api.delete(`/devises/${id}`),
};
