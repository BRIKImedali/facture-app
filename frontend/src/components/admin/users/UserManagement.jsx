// components/admin/users/UserManagement.jsx — Gestion complète des utilisateurs
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { userService, roleService } from '../../../services/adminService';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 0, size: 15, total: 0, totalPages: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', nom: '', prenom: '', password: '', roleIds: [] });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [pagination.page]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userService.getAll(pagination.page, pagination.size);
      setUsers(res.data.users || []);
      setPagination(p => ({
        ...p,
        total: res.data.totalElements,
        totalPages: res.data.totalPages,
      }));
    } catch {
      toast.error('Erreur chargement utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.size]);

  const loadRoles = async () => {
    try {
      const res = await roleService.getAll();
      setRoles(res.data || []);
    } catch {}
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearch(q);
    if (q.length >= 2) {
      try {
        const res = await userService.search(q);
        setUsers(res.data || []);
      } catch {}
    } else if (q.length === 0) {
      loadUsers();
    }
  };

  const handleToggleStatus = async (user) => {
    if (!window.confirm(t('users.confirm_toggle'))) return;
    try {
      setActionLoading(true);
      const res = await userService.toggleStatus(user.id);
      toast.success(res.data.message);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRoleIds(user.appRoles?.map(r => r.id) || []);
    setShowRoleModal(true);
  };

  const handleAssignRoles = async () => {
    try {
      setActionLoading(true);
      await userService.assignRoles(selectedUser.id, selectedRoleIds);
      toast.success(t('users.role.assigned', { defaultValue: 'Rôles assignés' }));
      setShowRoleModal(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      toast.error(t('users.password.too.short', { defaultValue: 'Minimum 8 caractères' }));
      return;
    }
    try {
      setActionLoading(true);
      await userService.resetPassword(selectedUser.id, newPassword);
      toast.success(t('users.password.reset', { defaultValue: 'Mot de passe réinitialisé' }));
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password || newUser.password.length < 8) {
      toast.error('Veuillez remplir tous les champs obligatoires (Mot de passe min. 8 caractères)');
      return;
    }
    try {
      setActionLoading(true);
      await userService.create(newUser);
      toast.success('Utilisateur créé avec succès');
      setShowCreateModal(false);
      setNewUser({ username: '', nom: '', prenom: '', password: '', roleIds: [] });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleNewUserRole = (id) => {
    setNewUser(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(id)
        ? prev.roleIds.filter(r => r !== id)
        : [...prev.roleIds, id]
    }));
  };

  const toggleRoleId = (id) => {
    setSelectedRoleIds(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-header-title">👥 {t('users.title')}</h1>
          <p className="page-header-subtitle">{t('users.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Nouvel Utilisateur
        </button>
      </div>

      <div className="admin-card">
        {/* Barre filtres */}
        <div className="filters-bar">
          <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={t('users.search_placeholder')}
              value={search}
              onChange={handleSearch}
            />
          </div>
          <span style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginLeft: 'auto' }}>
            {t('common.total')}: {pagination.total}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={loadUsers}>🔄</button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('users.firstName')} / {t('users.lastName')}</th>
                  <th>Identifiant</th>
                  <th>{t('users.role')}</th>
                  <th>{t('users.appRoles')}</th>
                  <th>{t('users.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{user.prenom} {user.nom}</div>
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)', fontFamily: 'monospace', fontSize: 13 }}>
                      {user.username}
                    </td>
                    <td>
                      <span className="badge badge-primary">{user.role}</span>
                    </td>
                    <td>
                      {user.appRoles?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {user.appRoles.slice(0, 2).map(r => (
                            <span key={r.id} className="badge badge-muted">{r.name}</span>
                          ))}
                          {user.appRoles.length > 2 && (
                            <span className="badge badge-muted">+{user.appRoles.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                          {t('users.no_roles')}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${user.isActive ? 'success' : 'danger'}`}>
                        {user.isActive ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-icon"
                          title={t('users.assign_roles')}
                          onClick={() => openRoleModal(user)}
                        >🔑</button>
                        <button
                          className={`btn-icon ${user.isActive ? 'danger' : 'success'}`}
                          title={t('users.toggle_status')}
                          onClick={() => handleToggleStatus(user)}
                          disabled={actionLoading}
                        >
                          {user.isActive ? '🔒' : '🔓'}
                        </button>
                        <button
                          className="btn-icon"
                          title={t('users.reset_password')}
                          onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }}
                        >🔄</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">👤</div>
                <div className="empty-state-title">{t('common.noData')}</div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={pagination.page === 0}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            >←</button>
            <span style={{ fontSize: 13, color: 'var(--admin-text-muted)', padding: '0 12px' }}>
              {pagination.page + 1} / {pagination.totalPages}
            </span>
            <button
              className="page-btn"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            >→</button>
          </div>
        )}
      </div>

      {/* MODAL : Assignation de rôles */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔑 {t('users.assign_roles')} — {selectedUser.username}</h3>
              <button className="modal-close" onClick={() => setShowRoleModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roles.map(role => (
                  <label
                    key={role.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                      background: selectedRoleIds.includes(role.id)
                        ? 'var(--admin-primary-10)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedRoleIds.includes(role.id)
                        ? 'var(--admin-primary-20)' : 'var(--admin-border)'}`,
                      transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={() => toggleRoleId(role.id)}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{role.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                        {role.description} — {role.permissions?.length || 0} permission(s)
                      </div>
                    </div>
                    {role.isSystemRole &&
                      <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>
                        {t('roles.system_badge')}
                      </span>
                    }
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRoleModal(false)}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssignRoles}
                disabled={actionLoading}
              >
                {actionLoading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : Réinitialisation mot de passe */}
      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔄 {t('users.reset_password')}</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16 }}>
                Utilisateur : <strong>{selectedUser.username}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">{t('users.new_password')} <span className="required">*</span></label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  minLength={8}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowPasswordModal(false)}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleResetPassword}
                disabled={actionLoading || newPassword.length < 8}
              >
                {actionLoading ? t('common.loading') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : Création utilisateur */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Créer un utilisateur</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Identifiant (ex: USR-001) <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="USR-001"
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Prénom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUser.prenom}
                    onChange={e => setNewUser({ ...newUser, prenom: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUser.nom}
                    onChange={e => setNewUser({ ...newUser, nom: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe <span className="required">*</span></label>
                <input
                  type="password"
                  className="form-input"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minimum 8 caractères"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rôles (Optionnel)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto', padding: 8, border: '1px solid var(--admin-border)', borderRadius: 6 }}>
                  {roles.map(role => (
                    <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newUser.roleIds.includes(role.id)}
                        onChange={() => toggleNewUserRole(role.id)}
                      />
                      <span style={{ fontSize: 13 }}>{role.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateUser}
                disabled={actionLoading}
              >
                {actionLoading ? t('common.loading') : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
