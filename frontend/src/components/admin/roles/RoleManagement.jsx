// components/admin/roles/RoleManagement.jsx — Gestion des rôles et permissions
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { roleService, permissionService } from '../../../services/adminService';
import toast from 'react-hot-toast';
import './RoleManagement.css';

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
          <div className="role-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="role-modal__header">
              <h3 className="role-modal__title">
                {editingRole ? t('roles.edit') : t('roles.create')}
              </h3>
              <button className="role-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Body */}
            <div className="role-modal__body">

              {/* Champs Nom + Description */}
              <div className="role-modal__fields">
                <div className="role-modal__field">
                  <label className="role-modal__label">
                    Role Identifier (Name) <span className="required">*</span>
                  </label>
                  <input
                    className="role-modal__input"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: COMPTABLE"
                  />
                  {formData.name && (
                    <span className="role-modal__hint">
                      Will be saved as ROLE_{formData.name.toUpperCase().replace(/\s+/g, '_')}
                    </span>
                  )}
                </div>
                <div className="role-modal__field">
                  <label className="role-modal__label">Description</label>
                  <input
                    className="role-modal__input"
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description du rôle..."
                  />
                </div>
              </div>

              {/* Séparateur Assign Permissions */}
              <div className="role-modal__section-header">
                <span className="role-modal__section-title">Assign Permissions</span>
                <div className="role-modal__section-actions">
                  <button className="role-modal__action-btn" onClick={selectAll}>Select All</button>
                  <button className="role-modal__action-btn" onClick={deselectAll}>Clear</button>
                </div>
              </div>
              <div className="role-modal__divider" />

              {/* Grille de permissions */}
              <div className="role-modal__perm-grid">
                {permissions.map(perm => {
                  const isChecked = selectedPermIds.includes(perm.id);
                  // Construire un label lisible : "Read Users", "Write Inventory", etc.
                  const actionLabel = perm.action
                    ? perm.action.charAt(0).toUpperCase() + perm.action.slice(1).toLowerCase()
                    : perm.name;
                  const entityLabel = perm.entity
                    ? perm.entity.charAt(0).toUpperCase() + perm.entity.slice(1).toLowerCase()
                    : '';
                  const label = perm.name || `${actionLabel} ${entityLabel}`;

                  return (
                    <label
                      key={perm.id}
                      className={`role-modal__perm-card ${isChecked ? 'role-modal__perm-card--checked' : ''}`}
                      onClick={() => togglePermission(perm.id)}
                    >
                      <span className={`role-modal__perm-checkbox ${isChecked ? 'role-modal__perm-checkbox--checked' : ''}`}>
                        {isChecked && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <span className="role-modal__perm-label">{label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Badge compteur */}
              <div className="role-modal__counter">
                <span className="badge badge-primary">{selectedPermIds.length} permission(s) sélectionnée(s)</span>
              </div>
            </div>

            {/* Footer */}
            <div className="role-modal__footer">
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
