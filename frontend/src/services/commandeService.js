import api from './api';

export const commandeService = {
  getAll: (statut = null) => api.get('/commandes', { params: { statut } }),
  getById: (id) => api.get(`/commandes/${id}`),
  getByClient: (clientId) => api.get(`/commandes/client/${clientId}`),
  create: (data) => api.post('/commandes', data),
  updateStatut: (id, statut) => api.patch(`/commandes/${id}/statut`, { statut }),
  delete: (id) => api.delete(`/commandes/${id}`)
};
