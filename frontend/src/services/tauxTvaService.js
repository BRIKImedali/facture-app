import api from './api';

export const tauxTvaService = {
  getAll:      ()         => api.get('/taux-tva'),
  getAllActifs: ()         => api.get('/taux-tva/actifs'),
  getById:     (id)       => api.get(`/taux-tva/${id}`),
  create:      (data)     => api.post('/taux-tva', data),
  update:      (id, data) => api.put(`/taux-tva/${id}`, data),
  remove:      (id)       => api.delete(`/taux-tva/${id}`),
};
