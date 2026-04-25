import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { produitService } from '../../services/produitService';
import { AuthContext } from '../../context/AuthContext';

const ProduitList = () => {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const fetchProduits = async () => {
    try {
      const res = search
        ? await produitService.search(search)
        : await produitService.getAll();
      setProduits(res.data);
    } catch {
      setError('Erreur lors du chargement des produits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProduits(); }, []);

  const handleSearch = (e) => { e.preventDefault(); setLoading(true); fetchProduits(); };

  const handleToggleActif = async (p) => {
    try {
      if (p.actif) {
        await produitService.desactiver(p.id);
      } else {
        await produitService.update(p.id, { ...p, actif: true });
      }
      fetchProduits();
    } catch { setError('Erreur lors de la mise à jour du statut.'); }
  };

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Supprimer "${nom}" définitivement ?`)) return;
    try {
      await produitService.delete(id);
      setProduits(produits.filter(p => p.id !== id));
    } catch { setError('Impossible de supprimer ce produit.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Produits & Services</h1>
          <p className="page-subtitle">{produits.length} produit(s) dans le catalogue</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Link to="/produits/nouveau" className="btn btn-primary">✚ Nouveau produit</Link>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un produit..." className="form-control" style={{ maxWidth: 380 }} />
          <button type="submit" className="btn btn-primary">Rechercher</button>
          {search && <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); fetchProduits(); }}>Réinitialiser</button>}
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : produits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>Aucun produit</h3>
            <p>Ajoutez vos produits et services.</p>
            {user?.role === 'ADMIN' && (
              <Link to="/produits/nouveau" className="btn btn-primary">Ajouter un produit</Link>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Nom</th>
                <th>Prix HT</th>
                <th>TVA</th>
                <th>Unité</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {produits.map(p => (
                <tr key={p.id} style={{ opacity: p.actif ? 1 : 0.55 }}>
                  <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{p.reference || '—'}</code></td>
                  <td><strong>{p.nom}</strong>{p.description && <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>{p.description.substring(0, 60)}{p.description.length > 60 ? '...' : ''}</p>}</td>
                  <td><strong>{Number(p.prixHT).toFixed(2)} TND</strong></td>
                  <td>{p.tauxTva}%</td>
                  <td>{p.unite?.nom || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td>
                    <span className={`badge ${p.actif ? 'badge-payee' : 'badge-annulee'}`}>{p.actif ? '✓ Actif' : '✗ Inactif'}</span>
                  </td>
                  <td>
                    {user?.role === 'ADMIN' ? (
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => navigate(`/produits/${p.id}/modifier`)}>✏️</button>
                        <button className={`btn ${p.actif ? 'btn-warning' : 'btn-success'}`} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => handleToggleActif(p)}>{p.actif ? '⏸' : '▶'}</button>
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => handleDelete(p.id, p.nom)}>🗑️</button>
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

export default ProduitList;
