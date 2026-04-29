// components/admin/AdminDashboard.jsx — Tableau de bord du module admin
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dashboardService } from '../../services/adminService';
import toast from 'react-hot-toast';

/**
 * Tableau de bord principal du module d'administration.
 * Affiche les statistiques globales : utilisateurs, BDD, ERP, audit.
 */
const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getStats();
      setStats(res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'success', UPDATE: 'warning', DELETE: 'danger',
      LOGIN: 'info', LOGOUT: 'muted', CONFIG_CHANGE: 'primary',
      PASSWORD_RESET: 'warning', ROLE_CHANGE: 'primary', ERP_SYNC: 'info'
    };
    return colors[action] || 'muted';
  };

  return (
    <div>
      {/* En-tête page */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-header-title">📊 {t('dashboard.title')}</h1>
            <p className="page-header-subtitle">{t('dashboard.subtitle')}</p>
          </div>
          <button className="btn btn-ghost" onClick={loadStats}>
            🔄 {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="stats-grid">
        <StatCard
          icon="👥"
          iconClass="primary"
          value={stats?.activeUsers ?? 0}
          label={t('dashboard.activeUsers')}
        />
        <StatCard
          icon={stats?.dbStatus === 'CONNECTED' ? '✅' : '❌'}
          iconClass={stats?.dbStatus === 'CONNECTED' ? 'success' : 'danger'}
          value={stats?.dbStatus === 'CONNECTED' ? '●' : '○'}
          label={t('dashboard.dbStatus')}
          sub={stats?.dbProfileName || t('dashboard.noProfile')}
        />
        <StatCard
          icon="🔗"
          iconClass="info"
          value={stats?.activeErpConfigs ?? 0}
          label={t('dashboard.activeErp')}
          sub={stats?.lastErpSync ? formatDate(stats.lastErpSync) : t('dashboard.neverSynced')}
        />
        <StatCard
          icon="📋"
          iconClass="warning"
          value={stats?.auditActionsThisMonth ?? 0}
          label={t('dashboard.auditActions')}
        />
      </div>

      {/* Activité récente */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">⚡ {t('dashboard.recentActivity')}</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => window.location.href = '/admin/audit'}
          >
            Voir tout →
          </button>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('audit.user')}</th>
                <th>{t('audit.action')}</th>
                <th>{t('audit.entity')}</th>
                <th>{t('audit.ip_address')}</th>
                <th>{t('audit.date')}</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentLogs?.length > 0 ? (
                stats.recentLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{log.username || 'SYSTEM'}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${getActionColor(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>
                      {log.entityType || '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {log.ipAddress || '—'}
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state" style={{ padding: 32 }}>
                      <div className="empty-state-icon">📭</div>
                      <div>{t('common.noData')}</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Widgets informatifs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        {/* Infos BDD */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">🗄️ {t('nav.database')}</h2>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow label="Profil actif" value={stats?.dbProfileName || 'Aucun'} />
              <InfoRow label="Type BDD" value={stats?.dbType || '—'} />
              <InfoRow
                label="Statut"
                value={
                  <span className={`badge badge-${stats?.dbStatus === 'CONNECTED' ? 'success' : 'danger'}`}>
                    {stats?.dbStatus === 'CONNECTED' ? '● Connecté' : '○ Déconnecté'}
                  </span>
                }
              />
            </div>
          </div>
        </div>

        {/* Infos ERP */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">🔗 {t('nav.erp')}</h2>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow
                label="Dernière sync"
                value={stats?.lastErpSync ? formatDate(stats.lastErpSync) : 'Jamais'}
              />
              <InfoRow
                label="Statut sync"
                value={
                  stats?.lastErpSyncStatus ? (
                    <span className={`badge badge-${stats.lastErpSyncStatus === 'SUCCESS' ? 'success' : 'danger'}`}>
                      {stats.lastErpSyncStatus}
                    </span>
                  ) : '—'
                }
              />
              <InfoRow label="Configs actives" value={stats?.activeErpConfigs ?? 0} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Composant Card statistique */
const StatCard = ({ icon, iconClass, value, label, sub }) => (
  <div className="stat-card">
    <div className={`stat-card-icon ${iconClass}`}>{icon}</div>
    <div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  </div>
);

/* Composant ligne info */
const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
    <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
  </div>
);

export default AdminDashboard;
