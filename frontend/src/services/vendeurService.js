import api from './api';

export const vendeurService = {
  getAll:    ()       => api.get('/vendeurs'),
  getActifs: ()       => api.get('/vendeurs/actifs'),
  getById:   (id)     => api.get(`/vendeurs/${id}`),
  search:    (q)      => api.get(`/vendeurs/search?q=${encodeURIComponent(q)}`),
  create:    (data)   => api.post('/vendeurs', data),
  update:    (id, data) => api.put(`/vendeurs/${id}`, data),
  delete:    (id)     => api.delete(`/vendeurs/${id}`),
};
