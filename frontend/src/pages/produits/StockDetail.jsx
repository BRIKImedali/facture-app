import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { stockService } from '../../services/stockService';
import { Button, Box } from '@mui/material';
import { Edit as EditIcon, ArrowBack as BackIcon } from '@mui/icons-material';

export default function StockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stockService.getById(id)
      .then(res => setStock(res.data))
      .catch(() => toast.error('Stock introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Chargement…</div>;
  if (!stock) return (
    <div className="empty-state">
      <h3>Stock introuvable</h3>
      <Button variant="contained" onClick={() => navigate('/stock')}>Retour</Button>
    </div>
  );

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1 className="page-title">🗄️ {stock.produitNom}</h1>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/stock/edit/${stock.id}`)}
            sx={{ borderColor: '#4f46e5', color: '#4f46e5', '&:hover': { borderColor: '#4338ca', bgcolor: '#eef2ff' } }}
          >
            Modifier
          </Button>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/stock')}
            sx={{ borderColor: '#94a3b8', color: '#475569', '&:hover': { borderColor: '#64748b', bgcolor: '#f8fafc' } }}
          >
            Retour
          </Button>
        </Box>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="form-group">
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>PRODUIT</label>
            <div><strong style={{ fontSize: '1rem' }}>{stock.produitNom}</strong></div>
          </div>
          <div className="form-group">
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>SITE</label>
            <div><span className="badge badge-envoyee">{stock.siteNom}</span></div>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>EMPLACEMENT</label>
            <div>{stock.emplacementLabel || '—'}</div>
          </div>
          <div className="form-group">
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>QUANTITÉ</label>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: stock.enAlerte ? '#ef4444' : '#16a34a' }}>
              {stock.quantite}
            </div>
          </div>
          <div className="form-group">
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>SEUIL MINIMUM D'ALERTE</label>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{stock.seuilMinimum}</div>
          </div>
          <div className="form-group">
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>STATUT</label>
            <div>
              {stock.enAlerte
                ? <span className="badge badge-annulee">⚠️ Alerte stock</span>
                : <span className="badge badge-payee">✓ Niveau OK</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
