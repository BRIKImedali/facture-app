// services/adminService.js — Service API pour tous les endpoints admin
import api from './api';

// ================================================================
// SERVICE : DASHBOARD
// ================================================================
export const dashboardService = {
  /** Récupère les statistiques globales du dashboard */
  getStats: () => api.get('/admin/dashboard/stats'),
};

// ================================================================
// SERVICE : GESTION DES UTILISATEURS
// ================================================================
export const userService = {
  /** Liste paginée des utilisateurs */
  getAll: (page = 0, size = 20, sortBy = 'email') =>
    api.get('/admin/users', { params: { page, size, sortBy } }),

  /** Recherche d'utilisateurs */
  search: (q) => api.get('/admin/users/search', { params: { q } }),

  /** Détail d'un utilisateur */
  getById: (id) => api.get(`/admin/users/${id}`),

  /** Mise à jour des informations */
  update: (id, data) => api.put(`/admin/users/${id}`, data),

  /** Assigner des rôles à un utilisateur */
  assignRoles: (id, roleIds) => api.post(`/admin/users/${id}/roles`, { roleIds }),

  /** Activer/désactiver un compte */
  toggleStatus: (id) => api.post(`/admin/users/${id}/toggle-status`),

  /** Réinitialiser le mot de passe */
  resetPassword: (id, newPassword) =>
    api.post(`/admin/users/${id}/reset-password`, { newPassword }),
};

// ================================================================
// SERVICE : RÔLES ET PERMISSIONS
// ================================================================
export const roleService = {
  /** Liste tous les rôles */
  getAll: () => api.get('/admin/roles'),

  /** Détail d'un rôle */
  getById: (id) => api.get(`/admin/roles/${id}`),

  /** Crée un nouveau rôle */
  create: (data) => api.post('/admin/roles', data),

  /** Met à jour un rôle */
  update: (id, data) => api.put(`/admin/roles/${id}`, data),

  /** Supprime un rôle */
  delete: (id) => api.delete(`/admin/roles/${id}`),

  /** Met à jour les permissions d'un rôle */
  updatePermissions: (id, permissionIds) =>
    api.post(`/admin/roles/${id}/permissions`, { permissionIds }),
};

export const permissionService = {
  /** Liste toutes les permissions disponibles */
  getAll: () => api.get('/admin/permissions'),
};

// ================================================================
// SERVICE : CONFIGURATION BASE DE DONNÉES
// ================================================================
export const databaseService = {
  /** Liste tous les profils */
  getAll: () => api.get('/admin/database/profiles'),

  /** Détail d'un profil */
  getById: (id) => api.get(`/admin/database/profiles/${id}`),

  /** Crée un profil */
  create: (data) => api.post('/admin/database/profiles', data),

  /** Met à jour un profil */
  update: (id, data) => api.put(`/admin/database/profiles/${id}`, data),

  /** Supprime un profil */
  delete: (id) => api.delete(`/admin/database/profiles/${id}`),

  /** Teste la connexion d'un profil existant */
  testConnection: (id) => api.post(`/admin/database/profiles/${id}/test`),

  /** Teste avec des paramètres directs (avant sauvegarde) */
  testConnectionWithParams: (params) => api.post('/admin/database/test-params', params),

  /** Active un profil */
  activate: (id) => api.post(`/admin/database/profiles/${id}/activate`),
};

// ================================================================
// SERVICE : INTÉGRATION ERP
// ================================================================
export const erpService = {
  /** Liste toutes les configurations ERP */
  getAll: () => api.get('/admin/erp/configs'),

  /** Détail d'une configuration */
  getById: (id) => api.get(`/admin/erp/configs/${id}`),

  /** Crée une configuration */
  create: (data) => api.post('/admin/erp/configs', data),

  /** Met à jour une configuration */
  update: (id, data) => api.put(`/admin/erp/configs/${id}`, data),

  /** Supprime une configuration */
  delete: (id) => api.delete(`/admin/erp/configs/${id}`),

  /** Teste la connexion à l'ERP */
  testConnection: (id) => api.post(`/admin/erp/configs/${id}/test`),

  /** Déclenche une synchronisation manuelle */
  syncManual: (configId, entityType = 'ALL') =>
    api.post('/admin/erp/sync/manual', { configId, entityType }),

  /** Historique des synchronisations */
  getSyncHistory: (params) => api.get('/admin/erp/sync/history', { params }),
};

// ================================================================
// SERVICE : AUDIT
// ================================================================
export const auditService = {
  /**
   * Liste paginée des logs avec filtres.
   * @param {Object} filters - { userEmail, actionType, entityType, startDate, endDate }
   * @param {number} page  - Numéro de page
   * @param {number} size  - Taille de page
   */
  getLogs: (filters = {}, page = 0, size = 20) =>
    api.get('/admin/audit/logs', { params: { ...filters, page, size } }),

  /** Détail d'un log */
  getById: (id) => api.get(`/admin/audit/logs/${id}`),

  /** Statistiques des logs */
  getStats: () => api.get('/admin/audit/stats'),

  /** Export des logs */
  exportLogs: (startDate, endDate) =>
    api.get('/admin/audit/export', { params: { startDate, endDate } }),
};

export default {
  dashboard: dashboardService,
  users: userService,
  roles: roleService,
  permissions: permissionService,
  database: databaseService,
  erp: erpService,
  audit: auditService,
};
