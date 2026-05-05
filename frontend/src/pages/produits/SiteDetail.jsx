import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { siteService } from '../../services/siteService';

export default function SiteDetail() {
  const { id } = useParams();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siteService.getById(id)
      .then(res => setSite(res.data))
      .catch(() => toast.error('Site introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Chargement…</div>;
  if (!site) return <div className="empty-state"><h3>Site introuvable</h3><Link to="/site" className="btn btn-primary">Retour</Link></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏭 {site.nom}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/site/edit/${site.id}`} className="btn btn-secondary">✏️ Modifier</Link>
            <Link to="/site" className="btn btn-primary">← Retour</Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
        <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Informations générales</h3>
        <div className="form-grid">
            <div className="form-group">
                <label>Nom</label>
                <div><strong>{site.nom}</strong></div>
            </div>
            <div className="form-group">
                <label>Responsable</label>
                <div>{site.responsable || '—'}</div>
            </div>
            <div className="form-group">
                <label>Téléphone</label>
                <div>{site.telephone || '—'}</div>
            </div>
        </div>

        <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }}>Adresse</h3>
        <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Adresse</label>
                <div>{site.adresse || '—'}</div>
            </div>
            <div className="form-group">
                <label>Ville</label>
                <div>{site.ville}</div>
            </div>
            <div className="form-group">
                <label>Code Postal</label>
                <div>{site.codePostal || '—'}</div>
            </div>
            <div className="form-group">
                <label>Pays</label>
                <div>{site.pays}</div>
            </div>
        </div>
      </div>
    </div>
  );
}
