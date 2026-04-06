import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { factureService } from '../../services/factureService';

const STATUTS = ['', 'BROUILLON', 'ENVOYEE', 'PAYEE', 'ANNULEE'];

const FactureList = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const navigate = useNavigate();

  const fetchFactures = async (s = selectedStatut) => {
    try {
      const res = await factureService.getAll(s || null);
      setFactures(res.data);
    } catch { setError('Erreur lors du chargement des factures.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFactures(); }, []);

  const handleStatutChange = (s) => {
    setSelectedStatut(s);
    setLoading(true);
    fetchFactures(s);
  };

  const handleDelete = async (id, numero) => {
    if (!window.confirm(`Supprimer la facture ${numero} ?`)) return;
    try {
      await factureService.delete(id);
      setFactures(f => f.filter(x => x.id !== id));
    } catch (err) { setError(err.response?.data?.message || 'Suppression impossible.'); }
  };

  const statutBadge = (s) => {
    const map = { BROUILLON: 'brouillon', ENVOYEE: 'envoyee', PAYEE: 'payee', ANNULEE: 'annulee' };
    return <span className={`badge badge-${map[s] || ''}`}>{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🧾 Factures</h1>
          <p className="page-subtitle">{factures.length} facture(s)</p>
        </div>
        <Link to="/factures/nouvelle" className="btn btn-primary">✚ Nouvelle facture</Link>
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
        ) : factures.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <h3>Aucune facture</h3>
            <Link to="/factures/nouvelle" className="btn btn-primary">Créer la première facture</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date émission</th>
                <th>Échéance</th>
                <th>Total TTC</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {factures.map(f => (
                <tr key={f.id}>
                  <td><strong style={{ color: '#6366f1' }}>{f.numero}</strong></td>
                  <td>{f.client?.nom}</td>
                  <td>{f.dateEmission ? new Date(f.dateEmission).toLocaleDateString('fr-FR') : '—'}</td>
                  <td>{f.dateEcheance || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td><strong>{Number(f.totalTTC || 0).toFixed(2)} TND</strong></td>
                  <td>{statutBadge(f.statut)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/factures/${f.id}`)}>👁 Voir</button>
                      {f.statut !== 'PAYEE' && f.statut !== 'ANNULEE' && (
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => handleDelete(f.id, f.numero)}>🗑️</button>
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

export default FactureList;
