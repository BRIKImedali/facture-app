import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendeurService } from '../../services/vendeurService';
import { AuthContext } from '../../context/AuthContext';

const VendeurList = () => {
  const [vendeurs, setVendeurs] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [error, setError]       = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchVendeurs = async () => {
    try {
      const res = search
        ? await vendeurService.search(search)
        : await vendeurService.getAll();
      setVendeurs(res.data);
    } catch {
      setError('Erreur lors du chargement des vendeurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendeurs(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchVendeurs();
  };

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Supprimer le vendeur "${nom}" ?`)) return;
    try {
      await vendeurService.delete(id);
      setVendeurs(vendeurs.filter(v => v.id !== id));
    } catch {
      setError('Impossible de supprimer ce vendeur.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🧑‍💼 Vendeurs</h1>
          <p className="page-subtitle">{vendeurs.length} vendeur(s) enregistré(s)</p>
        </div>
        {isAdmin && (
          <Link to="/vendeurs/nouveau" className="btn btn-primary">✚ Nouveau vendeur</Link>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Barre de recherche */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher par nom, prénom, email, matricule..."
            className="form-control"
            style={{ maxWidth: 420 }}
          />
          <button type="submit" className="btn btn-primary">Rechercher</button>
          {search && (
            <button type="button" className="btn btn-secondary"
              onClick={() => { setSearch(''); setLoading(true); fetchVendeurs(); }}>
              Réinitialiser
            </button>
          )}
        </form>
      </div>

      {/* Tableau */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : vendeurs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧑‍💼</div>
            <h3>Aucun vendeur trouvé</h3>
            <p>Commencez par ajouter votre premier vendeur.</p>
            {isAdmin && (
              <Link to="/vendeurs/nouveau" className="btn btn-primary">Ajouter un vendeur</Link>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom complet</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Matricule</th>
                <th>Commission</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendeurs.map(v => (
                <tr key={v.id}>
                  <td>
                    <strong style={{ color: '#1e293b' }}>{v.nom} {v.prenom}</strong>
                    {v.ville && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{v.ville}</div>}
                  </td>
                  <td>{v.email || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td>{v.telephone || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td>
                    {v.matricule
                      ? <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace' }}>{v.matricule}</span>
                      : <span style={{ color: '#cbd5e1' }}>—</span>
                    }
                  </td>
                  <td>
                    <span style={{ color: v.tauxCommission > 0 ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                      {v.tauxCommission != null ? `${v.tauxCommission}%` : '0%'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${v.actif ? 'badge-payee' : 'badge-annulee'}`}>
                      {v.actif ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </td>
                  <td>
                    {isAdmin ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => navigate(`/vendeurs/${v.id}/modifier`)}>
                          ✏️ Modifier
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleDelete(v.id, `${v.nom} ${v.prenom}`)}>
                          🗑️ Supprimer
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right', color: '#cbd5e1' }}>—</div>
                    )}
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

export default VendeurList;
