import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress, Alert,
  Divider,
} from '@mui/material';
import {
  LocalShipping as BLIcon,
  Receipt as FactureIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { factureService } from '../services/factureService';
import { bonLivraisonService } from '../services/bonLivraisonService';

/**
 * Modal affiché quand l'utilisateur clique sur "Générer" dans la liste des commandes.
 * Permet de choisir entre : Bon de Livraison ou Facture.
 *
 * Props :
 *   open      — boolean
 *   onClose   — () => void
 *   commande  — { id, reference, client, statut }
 *   onSuccess — (type: 'BL'|'FACTURE', result) => void
 */
const ChoixGenerationModal = ({ open, onClose, commande, onSuccess }) => {
  const navigate = useNavigate();

  const [loadingCheck, setLoadingCheck] = useState(false);
  const [existingBLs, setExistingBLs] = useState([]);
  const [existingFacture, setExistingFacture] = useState(null);
  const [generating, setGenerating] = useState(null); // 'BL' | 'FACTURE'
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && commande?.id) {
      setError('');
      setGenerating(null);
      fetchExistingDocs();
    }
  }, [open, commande?.id]);

  const fetchExistingDocs = async () => {
    setLoadingCheck(true);
    try {
      const [blRes, factureRes] = await Promise.allSettled([
        bonLivraisonService.getByCommande(commande.id),
        factureService.getByCommande(commande.id),
      ]);

      if (blRes.status === 'fulfilled') {
        setExistingBLs(blRes.value.data || []);
      }

      if (factureRes.status === 'fulfilled' && factureRes.value.status === 200) {
        setExistingFacture(factureRes.value.data);
      } else {
        setExistingFacture(null);
      }
    } catch {
      // silently ignore — warnings are optional
    } finally {
      setLoadingCheck(false);
    }
  };

  const handleGenerateBL = () => {
    onClose();
    navigate(`/bons-livraison/nouveau?commandeId=${commande.id}`);
  };

  const handleGenerateFacture = async () => {
    setError('');
    setGenerating('FACTURE');
    try {
      const res = await factureService.createFromCommande(commande.id);
      onSuccess?.('FACTURE', res.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Erreur lors de la création de la facture.';
      setError(msg);
    } finally {
      setGenerating(null);
    }
  };

  if (!commande) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Que voulez-vous générer ?
        </Typography>
        <Button size="small" color="inherit" onClick={onClose} sx={{ minWidth: 0, p: 0.5 }}>
          <CloseIcon fontSize="small" />
        </Button>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Commande : <strong>{commande.reference}</strong> — Client : <strong>{commande.client?.nom}</strong>
        </Typography>

        {loadingCheck && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loadingCheck && (
          <>
            {existingBLs.length > 0 && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                {existingBLs.length === 1
                  ? `Un bon de livraison existe déjà pour cette commande (${existingBLs[0].numero}).`
                  : `${existingBLs.length} bons de livraison existent déjà pour cette commande.`}
              </Alert>
            )}

            {existingFacture && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                Une facture existe déjà pour cette commande ({existingFacture.numero}).
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<BLIcon sx={{ fontSize: 28 }} />}
                onClick={handleGenerateBL}
                sx={{
                  py: 2,
                  flexDirection: 'column',
                  gap: 0.5,
                  borderColor: '#0ea5e9',
                  color: '#0ea5e9',
                  '&:hover': { borderColor: '#0284c7', bgcolor: '#f0f9ff' },
                  borderWidth: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Bon de Livraison
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'none' }}>
                  Créer un BL depuis cette commande
                </Typography>
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<FactureIcon sx={{ fontSize: 28 }} />}
                onClick={handleGenerateFacture}
                disabled={generating === 'FACTURE'}
                sx={{
                  py: 2,
                  flexDirection: 'column',
                  gap: 0.5,
                  borderColor: '#7c3aed',
                  color: '#7c3aed',
                  '&:hover': { borderColor: '#6d28d9', bgcolor: '#faf5ff' },
                  '&:disabled': { borderColor: '#e2e8f0' },
                  borderWidth: 2,
                }}
              >
                {generating === 'FACTURE' ? (
                  <CircularProgress size={20} sx={{ color: '#7c3aed' }} />
                ) : (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Facture
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'none' }}>
                      Générer une facture directe
                    </Typography>
                  </>
                )}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} color="inherit" variant="outlined" size="small">
          Annuler
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChoixGenerationModal;
