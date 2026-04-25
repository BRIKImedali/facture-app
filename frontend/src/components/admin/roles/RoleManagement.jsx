// components/admin/roles/RoleManagement.jsx — Gestion des rôles et permissions
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { roleService, permissionService } from '../../../services/adminService';
import toast from 'react-hot-toast';

/**
 * Interface de gestion des rôles avec matrice de permissions.
 * Permet de créer, modifier, supprimer des rôles et d'assigner des permissions.
 */
const RoleManagement = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([loadRoles(), loadPermissions()]);
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await roleService.getAll();
      setRoles(res.data || []);
    } catch {
      toast.error('Erreur chargement rôles');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const res = await permissionService.getAll();
      setPermissions(res.data || []);
    } catch {}
  };

  // Grouper les permissions par entité
  const groupedPermissions = permissions.reduce((groups, perm) => {
    if (!groups[perm.entity]) groups[perm.entity] = [];
    groups[perm.entity].push(perm);
    return groups;
  }, {});

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '' });
    setSelectedPermIds([]);
    setShowModal(true);
  };

  const openEditModal = (role) => {
    if (role.isSystemRole) {
      toast.error(t('roles.cannot_edit_system'));
      return;
    }
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '' });
    setSelectedPermIds(role.permissions?.map(p => p.id) || []);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom du rôle est obligatoire');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissionIds: selectedPermIds,
      };

      if (editingRole) {
        await roleService.update(editingRole.id, payload);
        toast.success(t('role.updated', { defaultValue: 'Rôle mis à jour' }));
      } else {
        await roleService.create(payload);
        toast.success(t('role.created', { defaultValue: 'Rôle créé' }));
      }

      setShowModal(false);
      loadRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role) => {
    if (role.isSystemRole) {
      toast.error(t('roles.cannot_edit_system'));
      return;
    }
    if (!window.confirm(t('roles.confirm_delete'))) return;
    try {
      await roleService.delete(role.id);
      toast.success('Rôle supprimé');
      loadRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const togglePermission = (permId) => {
    setSelectedPermIds(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const toggleEntityPermissions = (entity) => {
    const entityPerms = groupedPermissions[entity]?.map(p => p.id) || [];
    const allSelected = entityPerms.every(id => selectedPermIds.includes(id));
    if (allSelected) {
      setSelectedPermIds(prev => prev.filter(id => !entityPerms.includes(id)));
    } else {
      setSelectedPermIds(prev => [...new Set([...prev, ...entityPerms])]);
    }
  };

  const selectAll = () => setSelectedPermIds(permissions.map(p => p.id));
  const deselectAll = () => setSelectedPermIds([]);

  const entityIcons = {
    FACTURE: '🧾', CLIENT: '👤', PRODUIT: '📦',
    USER: '👥', ROLE: '🔐', SYSTEM: '⚙️',
    UNITE: '📏', CATEGORIE: '🏷️',
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-header-title">🔐 {t('roles.title')}</h1>
            <p className="page-header-subtitle">{t('roles.subtitle')}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            + {t('roles.create')}
          </button>
        </div>
      </div>

      {/* Liste des rôles */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">{t('roles.list')}</h2>
          <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
            {roles.length} rôle(s)
          </span>
        </div>
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('roles.name')}</th>
                  <th>{t('roles.description')}</th>
                  <th>{t('roles.permissions')}</th>
                  <th>Type</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id}>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{role.name}</span>
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                      {role.description || '—'}
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {role.permissions?.length || 0} permission(s)
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${role.isSystemRole ? 'warning' : 'info'}`}>
                        {role.isSystemRole ? t('roles.system_badge') : t('roles.custom_badge')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className={`btn-icon ${role.isSystemRole ? '' : ''}`}
                          title={t('common.edit')}
                          onClick={() => openEditModal(role)}
                          disabled={role.isSystemRole}
                        >✏️</button>
                        <button
                          className="btn-icon danger"
                          title={t('common.delete')}
                          onClick={() => handleDelete(role)}
                          disabled={role.isSystemRole}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL : Créer/Modifier un rôle */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRole ? `✏️ ${t('roles.edit')} — ${editingRole.name}` : `+ ${t('roles.create')}`}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Infos du rôle */}
              <div className="form-grid" style={{ marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label">{t('roles.name')} <span className="required">*</span></label>
                  <input
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: COMPTABLE"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('roles.description')}</label>
                  <input
                    className="form-input"
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description du rôle..."
                  />
                </div>
              </div>

              {/* Matrice des permissions */}
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                  {t('roles.permission_matrix')}
                  <span className="badge badge-primary" style={{ marginLeft: 8 }}>
                    {selectedPermIds.length} sélectionnée(s)
                  </span>
                </h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={selectAll}>
                    ✅ {t('roles.select_all')}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={deselectAll}>
                    ✕ {t('roles.deselect_all')}
                  </button>
                </div>
              </div>

              <div className="permission-matrix">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 140 }}>{t('roles.entity')}</th>
                      {['CREATE','READ','UPDATE','DELETE','EXPORT','APPROVE','CONFIG','AUDIT'].map(action => (
                        <th key={action} style={{ textAlign: 'center', fontSize: 10 }}>{action}</th>
                      ))}
                      <th style={{ textAlign: 'center' }}>Tout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedPermissions).map(([entity, perms]) => {
                      const entityPermIds = perms.map(p => p.id);
                      const allSelected = entityPermIds.every(id => selectedPermIds.includes(id));
                      return (
                        <tr key={entity}>
                          <td>
                            <div className="perm-entity-label">
                              {entityIcons[entity] || '📌'} {entity}
                            </div>
                          </td>
                          {['CREATE','READ','UPDATE','DELETE','EXPORT','APPROVE','CONFIG','AUDIT'].map(action => {
                            const perm = perms.find(p => p.action === action);
                            return (
                              <td key={action} style={{ textAlign: 'center' }}>
                                {perm ? (
                                  <input
                                    type="checkbox"
                                    className="perm-checkbox"
                                    checked={selectedPermIds.includes(perm.id)}
                                    onChange={() => togglePermission(perm.id)}
                                  />
                                ) : (
                                  <span style={{ color: 'var(--admin-border)' }}>—</span>
                                )}
                              </td>
                            );
                          })}
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              className="perm-checkbox"
                              checked={allSelected}
                              onChange={() => toggleEntityPermissions(entity)}
                              title="Sélectionner toutes les permissions de cette entité"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
