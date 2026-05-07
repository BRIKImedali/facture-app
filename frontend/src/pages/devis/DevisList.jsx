import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { devisService } from '../../services/devisService';

const STATUTS = ['', 'BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE'];

const DevisList = () => {
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const navigate = useNavigate();

  const fetchDevis = async (s = selectedStatut) => {
    try {
      const res = await devisService.getAll(s || null);
      setDevisList(res.data);
    } catch { setError('Erreur lors du chargement des devis.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDevis(); }, []);

  const handleStatutChange = (s) => {
    setSelectedStatut(s);
    setLoading(true);
    fetchDevis(s);
  };

  const handleDelete = async (id, reference) => {
    if (!window.confirm(`Supprimer le devis ${reference} ?`)) return;
    try {
      await devisService.delete(id);
      setDevisList(d => d.filter(x => x.id !== id));
    } catch (err) { setError(err.response?.data?.message || 'Suppression impossible.'); }
  };

  const statutBadge = (s) => {
    const map = { BROUILLON: 'brouillon', ENVOYE: 'envoyee', ACCEPTE: 'payee', REFUSE: 'annulee', EXPIRE: 'annulee' };
    return <span className={`badge badge-${map[s] || ''}`}>{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📄 Devis</h1>
          <p className="page-subtitle">{devisList.length} devis</p>
        </div>
        <Link to="/devis/nouveau" className="btn btn-primary">✚ Nouveau devis</Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filtre par statut */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '0.5rem' }}>
        {STATUTS.map(s => (
          <button key={s} onClick={() => handleStatutChange(s)}
            className={`btn ${selectedStatut === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
            {s || 'Tous'}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : devisList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Aucun devis</h3>
            <Link to="/devis/nouveau" className="btn btn-primary">Créer le premier devis</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Date Devis</th>
                <th>Expiration</th>
                <th>Total TTC</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devisList.map(d => (
                <tr key={d.id}>
                  <td><strong style={{ color: '#6366f1' }}>{d.reference}</strong></td>
                  <td>{d.client?.nom}</td>
                  <td>{d.dateDevis ? new Date(d.dateDevis).toLocaleDateString('fr-FR') : '—'}</td>
                  <td>{d.dateExpiration ? new Date(d.dateExpiration).toLocaleDateString('fr-FR') : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td><strong>{Number(d.totalTTC || 0).toFixed(2)} TND</strong></td>
                  <td>{statutBadge(d.statut)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/devis/${d.id}`)}>👁 Voir</button>
                      {d.statut !== 'ACCEPTE' && d.statut !== 'REFUSE' && (
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => handleDelete(d.id, d.reference)}>🗑️</button>
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

export default DevisList;
