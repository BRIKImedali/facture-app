import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clientService } from '../../services/clientService';
import { AuthContext } from '../../context/AuthContext';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const fetchClients = async () => {
    try {
      const res = search
        ? await clientService.search(search)
        : await clientService.getAll();
      setClients(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchClients();
  };

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Supprimer le client "${nom}" ?`)) return;
    try {
      await clientService.delete(id);
      setClients(clients.filter(c => c.id !== id));
    } catch {
      setError('Impossible de supprimer ce client (il a peut-être des factures liées).');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Clients</h1>
          <p className="page-subtitle">{clients.length} client(s) enregistré(s)</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Link to="/clients/nouveau" className="btn btn-primary">✚ Nouveau client</Link>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Barre de recherche */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher par nom, email, ville..."
            className="form-control"
            style={{ maxWidth: 380 }}
          />
          <button type="submit" className="btn btn-primary">Rechercher</button>
          {search && (
            <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setLoading(true); fetchClients(); }}>
              Réinitialiser
            </button>
          )}
        </form>
      </div>

      {/* Tableau */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>Aucun client trouvé</h3>
            <p>Commencez par ajouter votre premier client.</p>
            {user?.role === 'ADMIN' && (
              <Link to="/clients/nouveau" className="btn btn-primary">Ajouter un client</Link>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Ville</th>
                <th>Catégories</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td><strong style={{ color: '#1e293b' }}>{c.nom}</strong></td>
                  <td>{c.email || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td>{c.telephone || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td>{c.ville || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td>
                    {c.categories && c.categories.length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {c.categories.map(cat => (
                          <span key={cat.id} style={{ 
                            background: '#e0e7ff', color: '#3730a3', 
                            padding: '2px 8px', borderRadius: '12px', 
                            fontSize: '0.75rem', fontWeight: 500 
                          }}>
                            {cat.nom}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>—</span>
                    )}
                  </td>
                  <td>
                    {user?.role === 'ADMIN' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => navigate(`/clients/${c.id}/modifier`)}>
                          ✏️ Modifier
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleDelete(c.id, c.nom)}>
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

export default ClientList;
