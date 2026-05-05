import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { stockService } from '../../services/stockService';

export default function StockDetail() {
  const { id } = useParams();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stockService.getById(id)
      .then(res => setStock(res.data))
      .catch(() => toast.error('Stock introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Chargement…</div>;
  if (!stock) return <div className="empty-state"><h3>Stock introuvable</h3><Link to="/stock" className="btn btn-primary">Retour</Link></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🗄️ Détail Stock : {stock.produitNom}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/stock/edit/${stock.id}`} className="btn btn-secondary">✏️ Modifier</Link>
            <Link to="/stock" className="btn btn-primary">← Retour</Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
        <div className="form-grid">
            <div className="form-group">
                <label>Produit</label>
                <div><strong>{stock.produitNom}</strong></div>
            </div>
            <div className="form-group">
                <label>Site</label>
                <div><span className="badge badge-envoyee">{stock.siteNom}</span></div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Emplacement</label>
                <div>{stock.emplacementLabel || '—'}</div>
            </div>
            <div className="form-group">
                <label>Quantité</label>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: stock.enAlerte ? '#ef4444' : '#16a34a' }}>
                    {stock.quantite}
                </div>
            </div>
            <div className="form-group">
                <label>Seuil Minimum d'Alerte</label>
                <div>{stock.seuilMinimum}</div>
            </div>
            <div className="form-group">
                <label>Statut</label>
                <div>
                  {stock.enAlerte
                    ? <span className="badge badge-annulee">⚠️ Alerte</span>
                    : <span className="badge badge-payee">✓ OK</span>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
