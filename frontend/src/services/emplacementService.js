import api from './api';

export const emplacementService = {
  getAll:       ()           => api.get('/emplacements'),
  getById:      (id)         => api.get(`/emplacements/${id}`),
  getBySite:    (siteId)     => api.get(`/emplacements/site/${siteId}`),
  search:       (q)          => api.get(`/emplacements/search?q=${encodeURIComponent(q)}`),
  create:       (data)       => api.post('/emplacements', data),
  update:       (id, data)   => api.put(`/emplacements/${id}`, data),
  delete:       (id)         => api.delete(`/emplacements/${id}`),
};
