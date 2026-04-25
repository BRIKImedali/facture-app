// components/admin/audit/AuditLog.jsx — Journal d'audit complet
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auditService } from '../../../services/adminService';
import toast from 'react-hot-toast';

const ACTION_TYPES = ['CREATE','READ','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','CONFIG_CHANGE','ROLE_CHANGE','PASSWORD_RESET','ERP_SYNC'];
const ENTITY_TYPES = ['Facture','Client','Produit','User','AppRole','DatabaseProfile','ErpConfig'];

const ACTION_COLORS = {
  CREATE: 'success', UPDATE: 'warning', DELETE: 'danger', LOGIN: 'info',
  LOGOUT: 'muted', EXPORT: 'info', CONFIG_CHANGE: 'primary',
  ROLE_CHANGE: 'primary', PASSWORD_RESET: 'warning', ERP_SYNC: 'info',
};

const AuditLog = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, size: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    username: '', actionType: '', entityType: '', startDate: '', endDate: ''
  });

  useEffect(() => { loadLogs(); }, [pagination.page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.username) params.username = filters.username;
      if (filters.actionType) params.actionType = filters.actionType;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.startDate) params.startDate = filters.startDate + ':00';
      if (filters.endDate)   params.endDate   = filters.endDate   + ':00';

      const res = await auditService.getLogs(params, pagination.page, pagination.size);
      setLogs(res.data.logs || []);
      setPagination(p => ({
        ...p,
        total: res.data.totalElements,
        totalPages: res.data.totalPages,
      }));
    } catch {
      toast.error('Erreur chargement logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPagination(p => ({ ...p, page: 0 }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 0 }));
    loadLogs();
  };

  const clearFilters = () => {
    setFilters({ username: '', actionType: '', entityType: '', startDate: '', endDate: '' });
    setPagination(p => ({ ...p, page: 0 }));
    setTimeout(loadLogs, 50);
  };

  const handleExport = async () => {
    try {
      const res = await auditService.exportLogs(filters.startDate || null, filters.endDate || null);
      const json = JSON.stringify(res.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export téléchargé');
    } catch {
      toast.error('Erreur export');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const truncate = (str, n = 60) => str && str.length > n ? str.substring(0, n) + '…' : str;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-header-title">📋 {t('audit.title')}</h1>
            <p className="page-header-subtitle">{t('audit.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={loadLogs}>🔄 {t('common.refresh')}</button>
            <button className="btn btn-ghost" onClick={handleExport}>⬇️ {t('audit.export')}</button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">🔍 Filtres</h2>
        </div>
        <div className="admin-card-body">
          <form onSubmit={applyFilters}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('audit.filter_user')}</label>
                <input className="form-input" placeholder="Identifiant"
                  value={filters.username} onChange={e => handleFilterChange('username', e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('audit.filter_action')}</label>
                <select className="form-select" value={filters.actionType}
                  onChange={e => handleFilterChange('actionType', e.target.value)}>
                  <option value="">Toutes les actions</option>
                  {ACTION_TYPES.map(a => (
                    <option key={a} value={a}>{t(`audit.actions.${a}`, { defaultValue: a })}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('audit.filter_entity')}</label>
                <select className="form-select" value={filters.entityType}
                  onChange={e => handleFilterChange('entityType', e.target.value)}>
                  <option value="">Toutes les entités</option>
                  {ENTITY_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('audit.filter_date_start')}</label>
                <input className="form-input" type="datetime-local"
                  value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('audit.filter_date_end')}</label>
                <input className="form-input" type="datetime-local"
                  value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary btn-sm">🔍 Appliquer</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ {t('common.clear')}</button>
              <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginLeft: 'auto', alignSelf: 'center' }}>
                {pagination.total} résultat(s)
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Table des logs */}
      <div className="admin-card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('audit.user')}</th>
                  <th>{t('audit.action')}</th>
                  <th>{t('audit.entity')}</th>
                  <th>{t('audit.ip_address')}</th>
                  <th>{t('audit.description')}</th>
                  <th>{t('audit.date')}</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>#{log.id}</td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{log.username || 'SYSTEM'}</td>
                    <td>
                      <span className={`badge badge-${ACTION_COLORS[log.actionType] || 'muted'}`}>
                        {t(`audit.actions.${log.actionType}`, { defaultValue: log.actionType })}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{log.entityType || '—'}{log.entityId ? ` #${log.entityId}` : ''}</td>
                    <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--admin-text-muted)' }}>
                      {log.ipAddress || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                      {truncate(log.description)}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => setSelectedLog(log)} title="Voir détails">
                        👁️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-title">Aucun log trouvé</div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={pagination.page === 0}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>←</button>
            <span style={{ fontSize: 13, color: 'var(--admin-text-muted)', padding: '0 12px' }}>
              {pagination.page + 1} / {pagination.totalPages}
            </span>
            <button className="page-btn" disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>→</button>
          </div>
        )}
      </div>

      {/* MODAL : Détails d'un log */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📋 Détail du log #{selectedLog.id}</h3>
              <button className="modal-close" onClick={() => setSelectedLog(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <Detail label="Utilisateur" value={selectedLog.username || 'SYSTEM'} />
                <Detail label="Action" value={<span className={`badge badge-${ACTION_COLORS[selectedLog.actionType] || 'muted'}`}>{selectedLog.actionType}</span>} />
                <Detail label="Entité" value={selectedLog.entityType || '—'} />
                <Detail label="ID Entité" value={selectedLog.entityId || '—'} />
                <Detail label="IP" value={<code>{selectedLog.ipAddress || '—'}</code>} />
                <Detail label="Date" value={formatDate(selectedLog.createdAt)} />
              </div>
              {selectedLog.description && (
                <div style={{ marginBottom: 12 }}>
                  <div className="form-label">Description</div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                    {selectedLog.description}
                  </div>
                </div>
              )}
              {selectedLog.newValue && (
                <div style={{ marginBottom: 12 }}>
                  <div className="form-label">{t('audit.new_value')}</div>
                  <pre style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 8, fontSize: 11, overflow: 'auto', maxHeight: 200, margin: 0, color: 'var(--admin-success)' }}>
                    {selectedLog.newValue}
                  </pre>
                </div>
              )}
              {selectedLog.oldValue && (
                <div>
                  <div className="form-label">{t('audit.old_value')}</div>
                  <pre style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 8, fontSize: 11, overflow: 'auto', maxHeight: 200, margin: 0, color: 'var(--admin-danger)' }}>
                    {selectedLog.oldValue}
                  </pre>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedLog(null)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14 }}>{value}</div>
  </div>
);

export default AuditLog;
