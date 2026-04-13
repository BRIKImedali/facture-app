// components/admin/erp/ErpConfig.jsx — Gestion intégrations ERP
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { erpService } from '../../../services/adminService';
import toast from 'react-hot-toast';

const ERP_TYPES = ['ODOO', 'SAP', 'SAGE', 'DYNAMICS', 'CUSTOM'];
const AUTH_TYPES = ['API_KEY', 'OAUTH', 'BASIC_AUTH'];
const ENTITY_TYPES = ['CLIENT', 'PRODUIT', 'FACTURE'];
const STATUS_COLORS = { SUCCESS: 'success', PARTIAL_SUCCESS: 'warning', FAILED: 'danger', IN_PROGRESS: 'info' };

const ErpConfig = () => {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('configs');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [syncing, setSyncing] = useState(null);
  const [testing, setTesting] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { erpType: 'ODOO', displayName: '', apiUrl: '', authType: 'API_KEY', apiKeyEncrypted: '', username: '', passwordEncrypted: '', syncIntervalMinutes: 60, isActive: false };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadConfigs();
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const loadConfigs = async () => {
    try { setLoading(true); const r = await erpService.getAll(); setConfigs(r.data || []); }
    catch { toast.error('Erreur chargement ERP'); }
    finally { setLoading(false); }
  };

  const loadHistory = async () => {
    try { const r = await erpService.getSyncHistory({}); setHistory(r.data?.history || []); }
    catch {}
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c, apiKeyEncrypted: '', passwordEncrypted: '' }); setShowModal(true); };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editing) await erpService.update(editing.id, form);
      else         await erpService.create(form);
      toast.success(editing ? 'Configuration mise à jour' : 'Configuration créée');
      setShowModal(false);
      loadConfigs();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c) => {
    if (!window.confirm('Supprimer cette configuration ERP ?')) return;
    try { await erpService.delete(c.id); toast.success('Configuration supprimée'); loadConfigs(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleTest = async (id) => {
    try {
      setTesting(id);
      const r = await erpService.testConnection(id);
      if (r.data.success) toast.success(r.data.message);
      else toast.error(r.data.message);
    } catch { toast.error('Test échoué'); }
    finally { setTesting(null); }
  };

  const handleSync = async (id, entityType = 'ALL') => {
    try {
      setSyncing(id);
      const r = await erpService.syncManual(id, entityType);
      if (r.data.success) toast.success(r.data.message);
      else toast.error(r.data.message);
      loadHistory();
    } catch { toast.error('Synchronisation échouée'); }
    finally { setSyncing(null); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-header-title">🔗 {t('erp.title')}</h1>
            <p className="page-header-subtitle">{t('erp.subtitle')}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ {t('erp.create')}</button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[['configs','🔗 Configurations'],['history','📋 Historique des syncs']].map(([tab, label]) => (
          <button key={tab} className={`btn ${activeTab===tab ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setActiveTab(tab)}>{label}</button>
        ))}
      </div>

      {activeTab === 'configs' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">{t('erp.configs')}</h2>
            <button className="btn btn-ghost btn-sm" onClick={loadConfigs}>🔄</button>
          </div>
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Nom</th>
                    <th>URL API</th>
                    <th>Auth</th>
                    <th>Statut</th>
                    <th>Intervalle</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map(c => (
                    <tr key={c.id}>
                      <td><span className="badge badge-primary">{t(`erp.types.${c.erpType}`, { defaultValue: c.erpType })}</span></td>
                      <td style={{ fontWeight: 600 }}>{c.displayName || c.erpType}</td>
                      <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--admin-text-muted)' }}>
                        {c.apiUrl ? (c.apiUrl.length > 40 ? c.apiUrl.substring(0,40)+'…' : c.apiUrl) : '—'}
                      </td>
                      <td><span className="badge badge-muted">{t(`erp.auth_types.${c.authType}`, { defaultValue: c.authType || '—' })}</span></td>
                      <td>
                        <span className={`badge badge-${c.isActive ? 'success' : 'muted'}`}>
                          {c.isActive ? '● Actif' : '○ Inactif'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{c.syncIntervalMinutes} min</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button className="btn-icon" title={t('common.edit')} onClick={() => openEdit(c)}>✏️</button>
                          <button className="btn-icon" title={t('erp.test_connection')} onClick={() => handleTest(c.id)} disabled={testing === c.id}>
                            {testing === c.id ? '⏳' : '🔌'}
                          </button>
                          <button className="btn-icon success" title={t('erp.sync_manual')} onClick={() => handleSync(c.id)} disabled={syncing === c.id}>
                            {syncing === c.id ? '⏳' : '🔄'}
                          </button>
                          <button className="btn-icon danger" title={t('common.delete')} onClick={() => handleDelete(c)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {configs.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🔗</div>
                  <div className="empty-state-title">Aucune configuration ERP</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">📋 Historique des synchronisations</h2>
            <button className="btn btn-ghost btn-sm" onClick={loadHistory}>🔄</button>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type ERP</th>
                  <th>{t('erp.entity_type')}</th>
                  <th>Statut</th>
                  <th>{t('erp.records_imported')}</th>
                  <th>{t('erp.records_exported')}</th>
                  <th>{t('erp.duration')}</th>
                  <th>Erreurs</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(h.syncDate)}</td>
                    <td><span className="badge badge-primary">{h.erpConfig?.erpType || '—'}</span></td>
                    <td><span className="badge badge-muted">{h.entityType || 'ALL'}</span></td>
                    <td>
                      <span className={`badge badge-${STATUS_COLORS[h.status] || 'muted'}`}>
                        {t(`erp.statuses.${h.status}`, { defaultValue: h.status })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{h.recordsImported ?? 0}</td>
                    <td style={{ textAlign: 'center' }}>{h.recordsExported ?? 0}</td>
                    <td style={{ fontSize: 12 }}>{h.durationMs ? `${h.durationMs}ms` : '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--admin-danger)' }}>
                      {h.errors ? h.errors.substring(0, 40) + (h.errors.length > 40 ? '…' : '') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && (
              <div className="empty-state"><div className="empty-state-icon">📭</div><div>{t('common.noData')}</div></div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ERP */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? `✏️ ${t('erp.edit')}` : `+ ${t('erp.create')}`}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t('erp.erp_type')} <span className="required">*</span></label>
                  <select className="form-select" value={form.erpType} onChange={e => setForm(f => ({ ...f, erpType: e.target.value }))}>
                    {ERP_TYPES.map(type => <option key={type} value={type}>{t(`erp.types.${type}`, { defaultValue: type })}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('erp.display_name')}</label>
                  <input className="form-input" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Mon ERP Odoo" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('erp.api_url')}</label>
                <input className="form-input" value={form.apiUrl} onChange={e => setForm(f => ({ ...f, apiUrl: e.target.value }))} placeholder="https://mon-erp.com/api" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t('erp.auth_type')}</label>
                  <select className="form-select" value={form.authType} onChange={e => setForm(f => ({ ...f, authType: e.target.value }))}>
                    {AUTH_TYPES.map(a => <option key={a} value={a}>{t(`erp.auth_types.${a}`, { defaultValue: a })}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('erp.sync_interval')}</label>
                  <input className="form-input" type="number" min={5} value={form.syncIntervalMinutes} onChange={e => setForm(f => ({ ...f, syncIntervalMinutes: parseInt(e.target.value) }))} />
                </div>
              </div>
              {form.authType === 'API_KEY' && (
                <div className="form-group">
                  <label className="form-label">{t('erp.api_key')}</label>
                  <input className="form-input" type="password" value={form.apiKeyEncrypted} onChange={e => setForm(f => ({ ...f, apiKeyEncrypted: e.target.value }))} placeholder={editing ? '••••••••' : 'Clé API'} />
                  <p className="form-hint">Chiffrée en AES-256</p>
                </div>
              )}
              {['OAUTH','BASIC_AUTH'].includes(form.authType) && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">{t('erp.username')}</label>
                    <input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('erp.password')}</label>
                    <input className="form-input" type="password" value={form.passwordEncrypted} onChange={e => setForm(f => ({ ...f, passwordEncrypted: e.target.value }))} placeholder={editing ? '••••••••' : 'Mot de passe'} />
                  </div>
                </div>
              )}
              <label className="form-toggle" style={{ marginTop: 8 }}>
                <div className="toggle-switch">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  <div className="toggle-track" />
                </div>
                <span style={{ fontSize: 13 }}>{t('erp.is_active')}</span>
              </label>
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

export default ErpConfig;
