import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { siteService } from '../../services/siteService';

/* ─────────────────────────────────────────────────────── helpers ── */
const EMPTY_FORM = {
  nom: '', adresse: '', ville: '', codePostal: '',
  pays: 'France', responsable: '', telephone: '',
};

/* ═══════════════════════════════════════════════════════════════════
   SitePage — Liste + modale CRUD pour les sites
═══════════════════════════════════════════════════════════════════ */
export default function SitePage() {
  const [sites,     setSites]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [deleteId,  setDeleteId]  = useState(null);

  /* ── Chargement ─────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await siteService.getAll();
      setSites(res.data);
    } catch {
      toast.error('Impossible de charger les sites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Filtrage local ─────────────────────────────────────────── */
  const filtered = sites.filter(s =>
    [s.nom, s.ville, s.responsable].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  /* ── Suppression ────────────────────────────────────────────── */
  const confirmDelete = async () => {
    try {
      await siteService.delete(deleteId);
      toast.success('Site supprimé');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Impossible de supprimer ce site');
    }
  };

  /* ══════════════════════════════════════════════════════ render ══ */
  return (
    <div>
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🏭 Sites</h1>
          <p className="page-subtitle">Gestion des sites géographiques</p>
        </div>
        <Link to="/site/create" className="btn btn-primary">+ Nouveau site</Link>
      </div>

      {/* Barre de recherche */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
        <input
          className="form-control"
          placeholder="Rechercher par nom, ville ou responsable…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tableau */}
      <div className="card">
        {loading ? (
          <div className="loading">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏭</div>
            <h3>Aucun site</h3>
            <p>Créez votre premier site pour commencer.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th><th>Ville</th><th>Code Postal</th>
                <th>Pays</th><th>Responsable</th><th>Téléphone</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.nom}</strong></td>
                  <td>{s.ville}</td>
                  <td>{s.codePostal}</td>
                  <td>{s.pays}</td>
                  <td>{s.responsable || '—'}</td>
                  <td>{s.telephone  || '—'}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/site/${s.id}`} className="btn btn-secondary" title="Voir">👁️</Link>
                    <Link to={`/site/edit/${s.id}`} className="btn btn-secondary" title="Modifier">✏️</Link>
                    <button className="btn btn-danger" onClick={() => setDeleteId(s.id)} title="Supprimer">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Confirmation suppression ─────────────────────────── */}
      {deleteId && (
        <div style={overlay}>
          <div style={{ ...modalBox, maxWidth: '400px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>🗑️</p>
            <p>Confirmer la suppression de ce site ?</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Les emplacements et stocks liés seront également supprimés.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Annuler</button>
              <button className="btn btn-danger"    onClick={confirmDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── styles inline modaux ── */
const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
  backdropFilter: 'blur(3px)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalBox = {
  background: '#fff', borderRadius: '16px', padding: '2rem',
  width: '95%', maxWidth: '640px', boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
  maxHeight: '90vh', overflowY: 'auto',
};
