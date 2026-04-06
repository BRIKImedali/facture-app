import api from './api';

export const clientService = {
  // Lister tous les clients
  getAll: () => api.get('/clients'),
  // Récupérer un client par ID
  getById: (id) => api.get(`/clients/${id}`),
  // Rechercher
  search: (q) => api.get(`/clients/search?q=${encodeURIComponent(q)}`),
  // Créer
  create: (data) => api.post('/clients', data),
  // Modifier
  update: (id, data) => api.put(`/clients/${id}`, data),
  // Supprimer
  delete: (id) => api.delete(`/clients/${id}`),
};
