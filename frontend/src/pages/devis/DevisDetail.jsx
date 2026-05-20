import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { devisService } from '../../services/devisService';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, CircularProgress,
} from '@mui/material';

const STATUT_CONFIG = {
  BROUILLON: { label: 'Brouillon', color: '#64748b', bg: '#f1f5f9' },
  ENVOYE:    { label: 'Envoyé',    color: '#0ea5e9', bg: '#e0f2fe' },
  ACCEPTE:   { label: 'Accepté',   color: '#15803d', bg: '#dcfce7' },
  REFUSE:    { label: 'Refusé',    color: '#b91c1c', bg: '#fee2e2' },
  EXPIRE:    { label: 'Expiré',    color: '#d97706', bg: '#fef3c7' },
};

const fmt = (n) => Number(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 });

const DevisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [envoyant, setEnvoyant] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });

  useEffect(() => {
    devisService.getById(id)
      .then(res => setDevis(res.data))
      .catch(() => toast.error('Impossible de charger le devis.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleConfirmAction = async () => {
    const { action } = confirmDialog;
    setConfirmDialog({ open: false, action: null });

    if (action === 'ACCEPTE') {
      setConfirming(true);
      try {
        await devisService.updateStatut(id, 'ACCEPTE');
        toast.success('Devis accepté ! Une commande a été créée automatiquement.');
        const res = await devisService.getById(id);
        setDevis(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Erreur lors du changement de statut.');
      } finally {
        setConfirming(false);
      }
    } else if (action === 'ENVOYE') {
      setEnvoyant(true);
      try {
        await devisService.updateStatut(id, 'ENVOYE');
        toast.success('Devis marqué comme envoyé.');
        const res = await devisService.getById(id);
        setDevis(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Erreur.');
      } finally {
        setEnvoyant(false);
      }
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  if (!devis) return <div style={{ padding: '2rem' }}>Devis introuvable.</div>;

  const statut = STATUT_CONFIG[devis.statut] || { label: devis.statut, color: '#64748b', bg: '#f1f5f9' };
  const remise = parseFloat(devis.remise) || 0;
  const canEdit = devis.statut === 'BROUILLON' || devis.statut === 'ENVOYE';

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📄 {devis.reference}</h1>
          <span style={{
            display: 'inline-block', marginTop: 4, padding: '3px 10px',
            borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
            color: statut.color, background: statut.bg,
          }}>
            {statut.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canEdit && (
            <Link to={`/devis/${id}/modifier`} className="btn btn-secondary">✏️ Modifier</Link>
          )}
          {devis.statut === 'BROUILLON' && (
            <button
              className="btn btn-secondary"
              onClick={() => setConfirmDialog({ open: true, action: 'ENVOYE' })}
              disabled={envoyant}
              style={{ color: '#0ea5e9', borderColor: '#0ea5e9' }}
            >
              {envoyant ? 'Traitement...' : '📤 Marquer Envoyé'}
            </button>
          )}
          {(devis.statut === 'BROUILLON' || devis.statut === 'ENVOYE') && (
            <button
              className="btn btn-primary"
              onClick={() => setConfirmDialog({ open: true, action: 'ACCEPTE' })}
              disabled={confirming}
            >
              {confirming ? 'Traitement...' : '✅ Confirmer → Créer Commande'}
            </button>
          )}
          <Link to="/devis" className="btn btn-secondary">← Retour</Link>
        </div>
      </div>

      {/* Infos générales */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Informations générales</h3>
        <div className="form-grid">
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>CLIENT</label>
            <p style={{ margin: '4px 0', fontWeight: 600 }}>{devis.client?.nom}</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{devis.client?.email}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>DATE DU DEVIS</label>
            <p style={{ margin: '4px 0' }}>{devis.dateDevis ? new Date(devis.dateDevis).toLocaleDateString('fr-FR') : '—'}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>DATE D'EXPIRATION</label>
            <p style={{ margin: '4px 0' }}>{devis.dateExpiration || '—'}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>CRÉÉ PAR</label>
            <p style={{ margin: '4px 0' }}>{devis.createdBy || '—'}</p>
          </div>
          {devis.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>NOTES</label>
              <p style={{ margin: '4px 0', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, fontSize: '0.9rem' }}>
                {devis.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lignes */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0 }}>Lignes du devis</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th style={{ width: 70 }}>Qté</th>
              <th style={{ width: 120 }}>PU HT</th>
              <th style={{ width: 80 }}>TVA %</th>
              <th style={{ width: 110 }}>Mont. HT</th>
              <th style={{ width: 110 }}>Mont. TTC</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes?.map((l, i) => (
              <tr key={l.id || i}>
                <td><strong>{l.designation}</strong></td>
                <td>{l.quantite}</td>
                <td>{fmt(l.prixUnitaireHT)} TND</td>
                <td>{l.tauxTva}%</td>
                <td>{fmt(l.montantHT)} TND</td>
                <td><strong>{fmt(l.montantTTC)} TND</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right', minWidth: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
              <span>Total HT :</span><span>{fmt(devis.totalHT)} TND</span>
            </div>
            {remise > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#d97706', fontWeight: 600 }}>
                  <span>Remise ({remise}%) :</span>
                  <span>-{fmt(Number(devis.totalHT || 0) * remise / 100)} TND</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <span>HT après remise :</span><span>{fmt(devis.totalHT_apres_remise)} TND</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
              <span>Total TVA :</span><span>{fmt(devis.totalTva)} TND</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', borderTop: '2px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Total TTC :</span><span style={{ color: '#4f46e5' }}>{fmt(devis.totalTTC)} TND</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog confirmation */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => !confirming && !envoyant && setConfirmDialog({ open: false, action: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog.action === 'ACCEPTE' ? 'Confirmer le devis' : 'Marquer comme envoyé'}
        </DialogTitle>
        <DialogContent>
          {confirmDialog.action === 'ACCEPTE' ? (
            <Typography>
              Confirmer le devis <strong>{devis.reference}</strong> ? Une commande sera automatiquement créée.
            </Typography>
          ) : (
            <Typography>
              Marquer le devis <strong>{devis.reference}</strong> comme envoyé au client ?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, action: null })}
            color="inherit"
            disabled={confirming || envoyant}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            disabled={confirming || envoyant}
            sx={{
              bgcolor: confirmDialog.action === 'ACCEPTE' ? '#15803d' : '#0ea5e9',
              '&:hover': { filter: 'brightness(0.9)' },
            }}
          >
            {confirming || envoyant
              ? <CircularProgress size={18} sx={{ color: 'white' }} />
              : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default DevisDetail;
