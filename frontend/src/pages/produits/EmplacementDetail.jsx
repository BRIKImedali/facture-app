import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { emplacementService } from '../../services/emplacementService';

export default function EmplacementDetail() {
  const { id } = useParams();
  const [emplacement, setEmplacement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    emplacementService.getById(id)
      .then(res => setEmplacement(res.data))
      .catch(() => toast.error('Emplacement introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Chargement…</div>;
  if (!emplacement) return <div className="empty-state"><h3>Emplacement introuvable</h3><Link to="/emplacement" className="btn btn-primary">Retour</Link></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📍 Emplacement : {emplacement.zone}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/emplacement/edit/${emplacement.id}`} className="btn btn-secondary">✏️ Modifier</Link>
            <Link to="/emplacement" className="btn btn-primary">← Retour</Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="form-grid">
            <div className="form-group">
                <label>Site</label>
                <div><span className="badge badge-envoyee">{emplacement.siteNom}</span></div>
            </div>
            <div className="form-group">
                <label>Zone</label>
                <div><strong>{emplacement.zone}</strong></div>
            </div>
            <div className="form-group">
                <label>Rayon</label>
                <div>{emplacement.rayon || '—'}</div>
            </div>
            <div className="form-group">
                <label>Étagère</label>
                <div>{emplacement.etagere || '—'}</div>
            </div>
        </div>
      </div>
    </div>
  );
}
