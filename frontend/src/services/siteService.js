import api from './api';

export const siteService = {
  getAll:   ()         => api.get('/sites'),
  getById:  (id)       => api.get(`/sites/${id}`),
  search:   (q)        => api.get(`/sites/search?q=${encodeURIComponent(q)}`),
  create:   (data)     => api.post('/sites', data),
  update:   (id, data) => api.put(`/sites/${id}`, data),
  delete:   (id)       => api.delete(`/sites/${id}`),
};
