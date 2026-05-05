import api from './api';

export const stockService = {
  getAll:       ()              => api.get('/stocks'),
  getById:      (id)            => api.get(`/stocks/${id}`),
  getByProduit: (produitId)     => api.get(`/stocks/produit/${produitId}`),
  getBySite:    (siteId)        => api.get(`/stocks/site/${siteId}`),
  getAlertes:   (siteId)        => api.get('/stocks/alertes', { params: siteId ? { siteId } : {} }),
  create:       (data)          => api.post('/stocks', data),
  update:       (id, data)      => api.put(`/stocks/${id}`, data),
  entree:       (id, quantite)  => api.patch(`/stocks/${id}/entree`, null, { params: { quantite } }),
  sortie:       (id, quantite)  => api.patch(`/stocks/${id}/sortie`, null, { params: { quantite } }),
  delete:       (id)            => api.delete(`/stocks/${id}`),
};
