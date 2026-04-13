import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { factureService } from '../services/factureService';
import { AuthContext } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../components/Layout.css';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
    <div style={{
      width: 56, height: 56, borderRadius: 14,
      background: color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0
    }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentFactures, setRecentFactures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Stats et factures sont chargées indépendamment :
      // si l'une échoue, l'autre s'affiche quand même.
      try {
        const statsRes = await factureService.getStats();
        setStats(statsRes.data);
      } catch (err) {
        console.error('Erreur chargement stats dashboard', err);
      }

      try {
        const facturesRes = await factureService.getAll();
        setRecentFactures(facturesRes.data.slice(0, 5));
      } catch (err) {
        console.error('Erreur chargement factures récentes', err);
      }

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="loading">Chargement...</div>;

  const statutBadge = (s) => {
    const map = { BROUILLON: 'brouillon', ENVOYEE: 'envoyee', PAYEE: 'payee', ANNULEE: 'annulee' };
    return <span className={`badge badge-${map[s] || ''}`}>{s}</span>;
  };

  return (
    <div>
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord 📊</h1>
          <p className="page-subtitle">Bonjour, <strong>{user?.nom} {user?.prenom}</strong> — voici votre aperçu du jour.</p>
        </div>
        <Link to="/factures/nouvelle" className="btn btn-primary">
          ✚ Nouvelle facture
        </Link>
      </div>

      {/* Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'ADMIN' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard icon="👥" label="Clients" value={stats?.totalClients ?? 0} color="linear-gradient(135deg, #dbeafe, #bfdbfe)" />
        <StatCard icon="📦" label="Produits" value={stats?.totalProduits ?? 0} color="linear-gradient(135deg, #fef9c3, #fde68a)" />
        <StatCard icon="🧾" label="Factures" value={stats?.totalFactures ?? 0} color="linear-gradient(135deg, #ede9fe, #ddd6fe)" />
        {user?.role === 'ADMIN' && (
          <StatCard icon="💰" label="CA encaissé" value={`${Number(stats?.chiffreAffaires ?? 0).toFixed(2)} TND`} color="linear-gradient(135deg, #dcfce7, #bbf7d0)" />
        )}
      </div>

      {user?.role === 'ADMIN' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Graphique CA par mois */}
          <div className="card">
            <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Évolution du CA (Cette année)</h2>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={
                  stats?.revenueByMonth?.map(item => ({
                    name: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"][item.mois - 1],
                    ca: item.ca
                  })) || []
                }>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value} TND`} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} TND`, 'Chiffre d\'affaires']}
                  />
                  <Bar dataKey="ca" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 5 Clients */}
          <div className="card">
            <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Top 5 Clients</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats?.topClients && stats.topClients.length > 0 ? (
                stats.topClients.map((client, idx) => (
                  <div key={client.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: idx !== stats.topClients.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f8fafc', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', border: '1px solid #e2e8f0' }}>
                        {client.nom.substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{client.nom}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem' }}>{Number(client.ca).toFixed(2)} TND</span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Factures récentes */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Factures récentes</h2>
          <Link to="/factures" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>Voir tout →</Link>
        </div>

        {recentFactures.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-icon">🧾</div>
            <h3>Aucune facture</h3>
            <p>Créez votre première facture pour commencer.</p>
            <Link to="/factures/nouvelle" className="btn btn-primary">Créer une facture</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date</th>
                <th>Total TTC</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentFactures.map(f => (
                <tr key={f.id}>
                  <td><strong style={{ color: '#6366f1' }}>{f.numero}</strong></td>
                  <td>{f.client?.nom}</td>
                  <td>{f.dateEmission ? new Date(f.dateEmission).toLocaleDateString('fr-FR') : '-'}</td>
                  <td><strong>{Number(f.totalTTC || 0).toFixed(2)} TND</strong></td>
                  <td>{statutBadge(f.statut)}</td>
                  <td>
                    <Link to={`/factures/${f.id}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}>
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Raccourcis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {[
          { to: '/clients/nouveau', icon: '➕', label: 'Ajouter un client', sub: 'Gérer votre portefeuille', color: '#dbeafe', adminOnly: true },
          { to: '/produits/nouveau', icon: '📦', label: 'Ajouter un produit', sub: 'Enrichir votre catalogue', color: '#fef9c3', adminOnly: true },
          { to: '/factures/nouvelle', icon: '🧾', label: 'Nouvelle facture', sub: 'Facturer en 2 minutes', color: '#ede9fe', adminOnly: false },
        ].filter(item => !item.adminOnly || user?.role === 'ADMIN').map(({ to, icon, label, sub, color }) => (
          <Link to={to} key={to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{icon}</div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>{sub}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
