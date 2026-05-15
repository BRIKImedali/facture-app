import api from './api';

export const commandeService = {
  getAll: (statut) => api.get('/commandes', { params: statut ? { statut } : {} }),
  getById: (id) => api.get(`/commandes/${id}`),
  getByClient: (clientId) => api.get(`/commandes/client/${clientId}`),
  create: (data) => api.post('/commandes', data),
  update: (id, data) => api.put(`/commandes/${id}`, data),
  updateStatut: (id, statut) => api.patch(`/commandes/${id}/statut`, { statut }),
  delete: (id) => api.delete(`/commandes/${id}`),
};
