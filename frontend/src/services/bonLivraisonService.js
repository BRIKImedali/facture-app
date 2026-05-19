import api from './api';

export const bonLivraisonService = {
  getAll: (params) => api.get('/bons-livraison', { params }),
  getById: (id) => api.get(`/bons-livraison/${id}`),
  getByCommande: (commandeId) => api.get('/bons-livraison', { params: { commandeId } }),
  getFacturables: (clientId) => api.get('/bons-livraison/facturables', { params: { clientId } }),
  create: (data) => api.post('/bons-livraison', data),
  updateStatut: (id, statut) => api.put(`/bons-livraison/${id}/statut`, { statut }),
  getPdfUrl: (id) => `/api/bons-livraison/${id}/pdf`,
};
