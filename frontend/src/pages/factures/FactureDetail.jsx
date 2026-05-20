import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { factureService } from '../../services/factureService';
import toast from 'react-hot-toast';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, CircularProgress, TextField, MenuItem,
} from '@mui/material';

const STATUT_CONFIG = {
  BROUILLON: { label: 'Brouillon', color: '#64748b', bg: '#f1f5f9' },
  ENVOYEE:   { label: 'Envoyée',   color: '#1d4ed8', bg: '#dbeafe' },
  PAYEE:     { label: 'Payée',     color: '#15803d', bg: '#dcfce7' },
  ANNULEE:   { label: 'Annulée',   color: '#b91c1c', bg: '#fee2e2' },
};

const TRANSITIONS = {
  BROUILLON: ['ENVOYEE', 'ANNULEE'],
  ENVOYEE:   ['PAYEE', 'ANNULEE'],
  PAYEE:     [],
  ANNULEE:   [],
};

const TRANSITION_LABELS = {
  ENVOYEE: '📤 Marquer Envoyée',
  PAYEE:   '✅ Marquer Payée',
  ANNULEE: '❌ Annuler la facture',
};

const fmt = (n) => Number(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 });

const FactureDetail = () => {
  const { id } = useParams();
  const [facture, setFacture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [statutDialog, setStatutDialog] = useState({ open: false, cible: null });
  const [paymentMethod, setPaymentMethod] = useState('VIREMENT');

  useEffect(() => {
    factureService.getById(id)
      .then(res => setFacture(res.data))
      .catch(() => toast.error('Impossible de charger la facture.'))
      .finally(() => setLoading(false));
  }, [id]);

  const openStatutDialog = (cible) => {
    setPaymentMethod('VIREMENT');
    setStatutDialog({ open: true, cible });
  };

  const handleStatutChange = async () => {
    const { cible } = statutDialog;
    setUpdating(true);
    try {
      const payload = { statut: cible };
      if (cible === 'PAYEE') payload.paymentMethod = paymentMethod;
      const res = await factureService.updateStatut(id, payload);
      setFacture(res.data);
      toast.success(`Statut mis à jour : ${STATUT_CONFIG[cible]?.label}`);
      setStatutDialog({ open: false, cible: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de statut.');
    } finally {
      setUpdating(false);
    }
  };

  const handleValiderIA = async () => {
    setValidating(true);
    setValidationErrors(null);
    try {
      const res = await factureService.validerIA(id);
      setValidationErrors(res.data);
    } catch {
      toast.error('Erreur lors de la validation IA.');
    } finally {
      setValidating(false);
    }
  };

  const handleDownload = async (type) => {
    setDownloading(true);
    try {
      const response = type === 'pdf'
        ? await factureService.downloadPdf(id)
        : await factureService.exportXml(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture_${facture.numero}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(`Erreur lors du téléchargement du ${type.toUpperCase()}.`);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!window.confirm(`Envoyer la facture ${facture.numero} par email à ${facture.client?.email || 'le client'} ?`)) return;
    setIsSendingEmail(true);
    const toastId = toast.loading("Envoi de l'email en cours...");
    try {
      const res = await factureService.envoyerParEmail(id);
      toast.success(res.data?.message || 'Email envoyé avec succès !', { id: toastId, duration: 5000 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'envoi.", { id: toastId, duration: 6000 });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  if (!facture) return <div style={{ padding: '2rem' }}>Facture introuvable.</div>;

  const statut = STATUT_CONFIG[facture.statut] || { label: facture.statut, color: '#64748b', bg: '#f1f5f9' };
  const nextStatuts = TRANSITIONS[facture.statut] || [];

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🧾 {facture.numero}</h1>
          <span style={{
            display: 'inline-block', marginTop: 4, padding: '3px 10px',
            borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
            color: statut.color, background: statut.bg,
          }}>
            {statut.label}
          </span>
          {facture.commandeReference && (
            <Link to={`/commandes/${facture.commandeId}`} style={{ marginLeft: 10, fontSize: '0.8rem', color: '#6366f1' }}>
              📦 Commande : {facture.commandeReference}
            </Link>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {nextStatuts.map(s => (
            <button
              key={s}
              className="btn btn-secondary"
              onClick={() => openStatutDialog(s)}
              style={{ color: STATUT_CONFIG[s]?.color, borderColor: STATUT_CONFIG[s]?.color, fontWeight: 600 }}
            >
              {TRANSITION_LABELS[s]}
            </button>
          ))}
          <button
            className="btn btn-secondary"
            onClick={() => handleDownload('pdf')}
            disabled={downloading}
            style={{ color: '#4f46e5', borderColor: '#4f46e5' }}
          >
            {downloading ? 'Génération...' : '📄 PDF'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleDownload('xml')}
            style={{ color: '#0ea5e9', borderColor: '#0ea5e9' }}
          >
            📥 XML
          </button>
          <button
            onClick={handleSendEmail}
            disabled={isSendingEmail || !facture.client?.email}
            className="btn btn-secondary"
            title={!facture.client?.email ? "Ce client n'a pas d'adresse email" : ''}
            style={{
              background: isSendingEmail ? undefined : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              color: isSendingEmail ? undefined : '#fff',
              borderColor: 'transparent',
              opacity: !facture.client?.email ? 0.5 : 1,
              cursor: !facture.client?.email ? 'not-allowed' : 'pointer',
            }}
          >
            {isSendingEmail ? '⏳ Envoi...' : '✉️ Email'}
          </button>
          <button
            onClick={handleValiderIA}
            disabled={validating}
            className="btn btn-secondary"
            style={{
              background: validating ? undefined : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: validating ? undefined : '#fff',
              borderColor: 'transparent',
            }}
          >
            {validating ? '⏳ Validation...' : '🤖 Valider (IA)'}
          </button>
          <Link to="/factures" className="btn btn-secondary">← Retour</Link>
        </div>
      </div>

      {/* Résultats validation IA */}
      {validationErrors !== null && (
        <div style={{
          marginBottom: '1.25rem', padding: '1rem 1.25rem',
          borderRadius: 12, border: '1px solid',
          borderColor: validationErrors.length === 0 ? '#34d399' : '#f87171',
          background: validationErrors.length === 0 ? '#f0fdf4' : '#fef2f2',
        }}>
          {validationErrors.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: 600 }}>
              <span>✅ Facture valide — aucune erreur détectée par l'assistant IA.</span>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
                ⚠️ {validationErrors.length} erreur(s) détectée(s) :
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#7f1d1d', fontSize: '0.875rem' }}>
                {validationErrors.map((err, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>
                    <strong style={{ color: '#991b1b' }}>[{err.champ}]</strong> {err.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Infos générales */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Informations</h3>
        <div className="form-grid">
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>CLIENT</label>
            <p style={{ margin: '4px 0', fontWeight: 600 }}>{facture.client?.nom}</p>
            {facture.client?.email && <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>✉️ {facture.client.email}</p>}
            {facture.client?.telephone && <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>📞 {facture.client.telephone}</p>}
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>DATE D'ÉMISSION</label>
            <p style={{ margin: '4px 0' }}>{facture.dateEmission ? new Date(facture.dateEmission).toLocaleDateString('fr-FR') : '—'}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>DATE D'ÉCHÉANCE</label>
            <p style={{ margin: '4px 0' }}>{facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR') : '—'}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>MODE DE PAIEMENT</label>
            <p style={{ margin: '4px 0' }}>
              {facture.paymentMethod === 'ESPECES' ? 'Espèces' :
               facture.paymentMethod === 'VIREMENT' ? 'Virement bancaire' :
               facture.paymentMethod === 'CHEQUE' ? 'Chèque' :
               facture.paymentMethod || '—'}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>CRÉÉE PAR</label>
            <p style={{ margin: '4px 0' }}>{facture.createdByEmail || '—'}</p>
          </div>
          {facture.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>NOTES</label>
              <p style={{ margin: '4px 0', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, fontSize: '0.9rem' }}>
                {facture.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lignes */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0 }}>Détail des prestations</h3>
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
            {facture.lignes?.map((l, i) => (
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
              <span>Total HT :</span><span>{fmt(facture.totalHT)} TND</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
              <span>Total TVA :</span><span>{fmt(facture.totalTva)} TND</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', borderTop: '2px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Total TTC :</span><span style={{ color: '#4f46e5' }}>{fmt(facture.totalTTC)} TND</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog changement de statut */}
      <Dialog
        open={statutDialog.open}
        onClose={() => !updating && setStatutDialog({ open: false, cible: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Changer le statut</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Passer la facture <strong>{facture.numero}</strong> au statut{' '}
            <strong style={{ color: STATUT_CONFIG[statutDialog.cible]?.color }}>
              {STATUT_CONFIG[statutDialog.cible]?.label}
            </strong> ?
          </Typography>
          {statutDialog.cible === 'PAYEE' && (
            <TextField
              select
              label="Mode de paiement"
              fullWidth
              size="small"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="ESPECES">Espèces</MenuItem>
              <MenuItem value="VIREMENT">Virement bancaire</MenuItem>
              <MenuItem value="CHEQUE">Chèque</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setStatutDialog({ open: false, cible: null })}
            color="inherit"
            disabled={updating}
          >
            Annuler
          </Button>
          <Button
            onClick={handleStatutChange}
            variant="contained"
            disabled={updating}
            sx={{
              bgcolor: STATUT_CONFIG[statutDialog.cible]?.color,
              '&:hover': { filter: 'brightness(0.9)' },
            }}
          >
            {updating
              ? <CircularProgress size={18} sx={{ color: 'white' }} />
              : `Confirmer → ${STATUT_CONFIG[statutDialog.cible]?.label}`}
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default FactureDetail;
