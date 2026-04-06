import api from './api';

export const factureService = {
  // Lister toutes les factures (optionnel: filtrer par statut)
  getAll: (statut) => api.get('/factures', { params: statut ? { statut } : {} }),
  getById: (id) => api.get(`/factures/${id}`),
  getByClient: (clientId) => api.get(`/factures/client/${clientId}`),
  getStats: () => api.get('/factures/stats'),
  create: (data) => api.post('/factures', data),
  // Changer le statut : statut = 'ENVOYEE' | 'PAYEE' | 'ANNULEE'
  updateStatut: (id, statut) => api.patch(`/factures/${id}/statut`, { statut }),
  delete: (id) => api.delete(`/factures/${id}`),
  downloadPdf: (id) => api.get(`/factures/${id}/pdf`, { responseType: 'blob' }),
  // Export XML structuré (endpoint principal)
  exportXml: (id) => api.get(`/factures/${id}/export-xml`, { responseType: 'blob' }),
  // Validation IA de la facture
  validerIA: (id) => api.post(`/ai/valider-facture`, null, { params: { id } }),
  // Envoyer la facture par email au client
  envoyerParEmail: (id) => api.post(`/factures/${id}/send-email`),
};

