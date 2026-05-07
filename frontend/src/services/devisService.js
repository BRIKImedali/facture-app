import api from './api';

export const devisService = {
  getAll: (statut = null) => api.get('/devis', { params: { statut } }),
  getById: (id) => api.get(`/devis/${id}`),
  getByClient: (clientId) => api.get(`/devis/client/${clientId}`),
  create: (data) => api.post('/devis', data),
  updateStatut: (id, statut) => api.patch(`/devis/${id}/statut`, { statut }),
  delete: (id) => api.delete(`/devis/${id}`)
};
