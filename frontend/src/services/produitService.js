import api from './api';

export const produitService = {
  getAll: () => api.get('/produits'),
  getActifs: () => api.get('/produits/actifs'),
  getById: (id) => api.get(`/produits/${id}`),
  search: (q) => api.get(`/produits/search?q=${encodeURIComponent(q)}`),
  create: (data) => api.post('/produits', data),
  update: (id, data) => api.put(`/produits/${id}`, data),
  desactiver: (id) => api.patch(`/produits/${id}/desactiver`),
  delete: (id) => api.delete(`/produits/${id}`),
};
