// components/admin/database/DatabaseConfig.jsx — Configuration des profils de connexion BDD
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { databaseService } from '../../../services/adminService';
import toast from 'react-hot-toast';

const DB_TYPES = ['POSTGRESQL', 'MYSQL', 'ORACLE', 'SQLSERVER'];
const DEFAULT_PORTS = { POSTGRESQL: 5432, MYSQL: 3306, ORACLE: 1521, SQLSERVER: 1433 };

const DatabaseConfig = () => {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);

  const emptyForm = { profileName: '', dbType: 'POSTGRESQL', host: 'localhost', port: 5432, databaseName: '', username: '', passwordEncrypted: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const res = await databaseService.getAll();
      setProfiles(res.data || []);
    } catch { toast.error('Erreur chargement profils'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingProfile(null);
    setForm(emptyForm);
    setTestResult(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingProfile(p);
    setForm({ ...p, passwordEncrypted: '' });
    setTestResult(null);
    setShowModal(true);
  };

  const handleDbTypeChange = (type) => {
    setForm(f => ({ ...f, dbType: type, port: DEFAULT_PORTS[type] || f.port }));
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      let res;
      if (editingProfile) {
        res = await databaseService.testConnection(editingProfile.id);
      } else {
        res = await databaseService.testConnectionWithParams({
          dbType: form.dbType, host: form.host, port: form.port,
          databaseName: form.databaseName, username: form.username,
          password: form.passwordEncrypted,
        });
      }
      setTestResult(res.data);
      if (res.data.success) toast.success(res.data.message);
      else toast.error(res.data.message);
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.message || 'Erreur réseau' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!form.profileName || !form.host || !form.databaseName || !form.username) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      setSaving(true);
      if (editingProfile) {
        await databaseService.update(editingProfile.id, form);
        toast.success(t('database.profile.updated', { defaultValue: 'Profil mis à jour' }));
      } else {
        await databaseService.create(form);
        toast.success(t('database.profile.created', { defaultValue: 'Profil créé' }));
      }
      setShowModal(false);
      loadProfiles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id, name) => {
    if (!window.confirm(t('database.confirm_activate'))) return;
    try {
      setActivating(true);
      const res = await databaseService.activate(id);
      toast.success(res.data.message);
      loadProfiles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Activation échouée');
    } finally {
      setActivating(false);
    }
  };

  const handleDelete = async (p) => {
    if (p.isActive) { toast.error(t('database.cannot_delete_active')); return; }
    if (!window.confirm(t('database.confirm_delete'))) return;
    try {
      await databaseService.delete(p.id);
      toast.success('Profil supprimé');
      loadProfiles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-header-title">🗄️ {t('database.title')}</h1>
            <p className="page-header-subtitle">{t('database.subtitle')}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ {t('database.create')}</button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">{t('database.profiles')}</h2>
          <button className="btn btn-ghost btn-sm" onClick={loadProfiles}>🔄</button>
        </div>
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('database.profile_name')}</th>
                  <th>{t('database.db_type')}</th>
                  <th>{t('database.host')} / {t('database.port')}</th>
                  <th>{t('database.database_name')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('database.created_by')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.profileName}</div>
                      {p.isDefault && <span className="badge badge-warning" style={{ fontSize: 10 }}>DEFAULT</span>}
                    </td>
                    <td><span className="badge badge-info">{t(`database.types.${p.dbType}`, { defaultValue: p.dbType })}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.host}:{p.port}</td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>{p.databaseName}</td>
                    <td>
                      {p.isActive
                        ? <span className="badge badge-success">● {t('common.active')}</span>
                        : <span className="badge badge-muted">○ {t('common.inactive')}</span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{p.createdBy || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn-icon" title={t('common.edit')} onClick={() => openEdit(p)}>✏️</button>
                        {!p.isActive && (
                          <button className="btn-icon success" title={t('database.activate_profile')}
                            onClick={() => handleActivate(p.id, p.profileName)} disabled={activating}>✅</button>
                        )}
                        <button className="btn-icon danger" title={t('common.delete')}
                          onClick={() => handleDelete(p)} disabled={p.isActive}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {profiles.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🗄️</div>
                <div className="empty-state-title">Aucun profil configuré</div>
                <div className="empty-state-subtitle">Créez votre premier profil de connexion</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL Profil */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProfile ? `✏️ ${t('database.edit')}` : `+ ${t('database.create')}`}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t('database.profile_name')} <span className="required">*</span></label>
                  <input className="form-input" value={form.profileName}
                    onChange={e => setForm(f => ({ ...f, profileName: e.target.value }))}
                    placeholder="Production, Test, Dev..." />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('database.db_type')} <span className="required">*</span></label>
                  <select className="form-select" value={form.dbType}
                    onChange={e => handleDbTypeChange(e.target.value)}>
                    {DB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('database.host')} <span className="required">*</span></label>
                  <input className="form-input" value={form.host}
                    onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
                    placeholder="localhost" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('database.port')} <span className="required">*</span></label>
                  <input className="form-input" type="number" value={form.port}
                    onChange={e => setForm(f => ({ ...f, port: parseInt(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('database.database_name')} <span className="required">*</span></label>
                  <input className="form-input" value={form.databaseName}
                    onChange={e => setForm(f => ({ ...f, databaseName: e.target.value }))}
                    placeholder="facturation_db" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('database.username')} <span className="required">*</span></label>
                  <input className="form-input" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="postgres" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  {t('database.password')}
                  {editingProfile && <span className="form-hint"> (laisser vide pour ne pas modifier)</span>}
                </label>
                <input className="form-input" type="password" value={form.passwordEncrypted}
                  onChange={e => setForm(f => ({ ...f, passwordEncrypted: e.target.value }))}
                  placeholder={editingProfile ? '••••••••' : 'Mot de passe'} />
                <p className="form-hint">Chiffré en AES-256 avant stockage</p>
              </div>

              {/* Résultat du test */}
              {testResult && (
                <div style={{
                  padding: '12px 16px', borderRadius: 8, marginBottom: 16,
                  background: testResult.success ? 'var(--admin-success-10)' : 'var(--admin-danger-10)',
                  border: `1px solid ${testResult.success ? 'var(--admin-success)' : 'var(--admin-danger)'}`,
                  color: testResult.success ? 'var(--admin-success)' : 'var(--admin-danger)',
                  fontSize: 13,
                }}>
                  {testResult.success ? '✅' : '❌'} {testResult.message}
                  {testResult.durationMs > 0 && ` (${testResult.durationMs}ms)`}
                </div>
              )}

              <button
                className={`btn ${testResult?.success ? 'btn-success' : 'btn-ghost'}`}
                onClick={handleTestConnection}
                disabled={testing}
                style={{ width: '100%' }}
              >
                {testing ? '⏳ ' + t('database.testing') : '🔌 ' + t('database.test_connection')}
              </button>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
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

export default DatabaseConfig;
