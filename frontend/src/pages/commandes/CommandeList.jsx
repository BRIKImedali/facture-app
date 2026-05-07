import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { commandeService } from '../../services/commandeService';

const STATUTS = ['', 'EN_ATTENTE', 'VALIDEE', 'LIVREE', 'ANNULEE'];

const CommandeList = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const navigate = useNavigate();

  const fetchCommandes = async (s = selectedStatut) => {
    try {
      const res = await commandeService.getAll(s || null);
      setCommandes(res.data);
    } catch { setError('Erreur lors du chargement des commandes.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCommandes(); }, []);

  const handleStatutChange = (s) => {
    setSelectedStatut(s);
    setLoading(true);
    fetchCommandes(s);
  };

  const handleDelete = async (id, reference) => {
    if (!window.confirm(`Supprimer la commande ${reference} ?`)) return;
    try {
      await commandeService.delete(id);
      setCommandes(c => c.filter(x => x.id !== id));
    } catch (err) { setError(err.response?.data?.message || 'Suppression impossible.'); }
  };

  const statutBadge = (s) => {
    const map = { EN_ATTENTE: 'brouillon', VALIDEE: 'envoyee', LIVREE: 'payee', ANNULEE: 'annulee' };
    return <span className={`badge badge-${map[s] || ''}`}>{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Commandes</h1>
          <p className="page-subtitle">{commandes.length} commande(s)</p>
        </div>
        <Link to="/commandes/nouvelle" className="btn btn-primary">✚ Nouvelle commande</Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filtre par statut */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '0.5rem' }}>
        {STATUTS.map(s => (
          <button key={s} onClick={() => handleStatutChange(s)}
            className={`btn ${selectedStatut === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
            {s || 'Toutes'}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : commandes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>Aucune commande</h3>
            <Link to="/commandes/nouvelle" className="btn btn-primary">Créer la première commande</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Date</th>
                <th>Total TTC</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {commandes.map(c => (
                <tr key={c.id}>
                  <td><strong style={{ color: '#6366f1' }}>{c.reference}</strong></td>
                  <td>{c.client?.nom}</td>
                  <td>{c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : '—'}</td>
                  <td><strong>{Number(c.totalTTC || 0).toFixed(2)} TND</strong></td>
                  <td>{statutBadge(c.statut)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/commandes/${c.id}`)}>👁 Voir</button>
                      {c.statut !== 'VALIDEE' && c.statut !== 'LIVREE' && c.statut !== 'ANNULEE' && (
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => handleDelete(c.id, c.reference)}>🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CommandeList;
