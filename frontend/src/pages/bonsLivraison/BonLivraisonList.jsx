import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Chip, CircularProgress, TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Snackbar, Alert, Menu,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon,
  PictureAsPdf as PdfIcon, Search as SearchIcon,
  LocalShipping as ShippingIcon, Receipt as FactureIcon,
  MoreVert as MoreIcon, ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bonLivraisonService } from '../../services/bonLivraisonService';
import { factureService } from '../../services/factureService';
import Pagination from '../../components/Pagination';
import usePermission from '../../hooks/usePermission';
import api from '../../services/api';

const STATUT_CONFIG = {
  BROUILLON: { label: 'Brouillon', color: 'default' },
  EN_COURS:  { label: 'En cours',  color: 'info' },
  LIVRE:     { label: 'Livré',     color: 'success' },
  ANNULE:    { label: 'Annulé',    color: 'error' },
};

const TRANSITIONS = {
  BROUILLON: ['EN_COURS', 'ANNULE'],
  EN_COURS:  ['LIVRE', 'ANNULE'],
  LIVRE:     [],
  ANNULE:    [],
};

const BonLivraisonList = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canCreate  = hasPermission('BON_LIVRAISON:CREATE');
  const canUpdate  = hasPermission('BON_LIVRAISON:UPDATE');
  const canFacture = hasPermission('FACTURE:CREATE');

  const [bls, setBls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Statut change menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuBl, setMenuBl] = useState(null);
  const [updatingStatut, setUpdatingStatut] = useState(null);

  // Facturer dialog
  const [factureDialog, setFactureDialog] = useState({ open: false, bl: null });
  const [facturing, setFacturing] = useState(false);

  useEffect(() => {
    fetchBls();
  }, []);

  const fetchBls = async () => {
    setLoading(true);
    try {
      const response = await bonLivraisonService.getAll();
      setBls(response.data);
    } catch {
      showSnackbar('Erreur lors du chargement des bons de livraison', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (bl) => {
    try {
      const response = await api.get(`/bons-livraison/${bl.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BL_${bl.numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showSnackbar('Erreur lors du téléchargement du PDF', 'error');
    }
  };

  const openStatutMenu = (event, bl) => {
    setAnchorEl(event.currentTarget);
    setMenuBl(bl);
  };

  const closeStatutMenu = () => {
    setAnchorEl(null);
    setMenuBl(null);
  };

  const handleStatutChange = async (nouveauStatut) => {
    const bl = menuBl;
    closeStatutMenu();
    setUpdatingStatut(bl.id);
    try {
      const res = await bonLivraisonService.updateStatut(bl.id, nouveauStatut);
      setBls(prev => prev.map(b => b.id === bl.id ? res.data : b));
      showSnackbar(`BL ${bl.numero} : statut changé en "${STATUT_CONFIG[nouveauStatut]?.label}"`, 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Erreur lors du changement de statut', 'error');
    } finally {
      setUpdatingStatut(null);
    }
  };

  const handleFacturer = async () => {
    const bl = factureDialog.bl;
    setFacturing(true);
    try {
      const res = await factureService.createFromSingleBL(bl.id);
      showSnackbar(`Facture ${res.data.numero} créée avec succès !`, 'success');
      // Refresh BL to get updated factureId/factureNumero
      const updated = await bonLivraisonService.getById(bl.id);
      setBls(prev => prev.map(b => b.id === bl.id ? updated.data : b));
      setFactureDialog({ open: false, bl: null });
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Erreur lors de la création de la facture', 'error');
    } finally {
      setFacturing(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filtered = bls.filter(bl => {
    const matchSearch =
      (bl.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bl.client?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bl.commandeReference || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = statutFilter ? bl.statut === statutFilter : true;
    return matchSearch && matchStatut;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShippingIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              Bons de Livraison
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
              Gérez les bons de livraison liés aux commandes
            </Typography>
          </Box>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/bons-livraison/nouveau')}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Nouveau BL
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          sx={{ flex: 1 }}
          variant="outlined"
          placeholder="Rechercher par numéro, client, commande..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          size="small"
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={statutFilter}
            label="Statut"
            onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}
          >
            <MenuItem value="">Tous</MenuItem>
            {Object.entries(STATUT_CONFIG).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell><b>Numéro</b></TableCell>
                  <TableCell><b>Client</b></TableCell>
                  <TableCell><b>Commande</b></TableCell>
                  <TableCell><b>Date création</b></TableCell>
                  <TableCell><b>Date livraison</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell><b>Total TTC</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((bl) => {
                  const statutCfg = STATUT_CONFIG[bl.statut] || { label: bl.statut, color: 'default' };
                  const nextStatuts = TRANSITIONS[bl.statut] || [];
                  const canFacturer = canFacture && bl.statut === 'LIVRE' && !bl.factureId;
                  const isUpdating = updatingStatut === bl.id;

                  return (
                    <TableRow key={bl.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: '#4f46e5' }}>{bl.numero}</Typography>
                      </TableCell>
                      <TableCell>{bl.client?.nom || '—'}</TableCell>
                      <TableCell>{bl.commandeReference || '—'}</TableCell>
                      <TableCell>{bl.dateCreation ? bl.dateCreation.substring(0, 10) : '—'}</TableCell>
                      <TableCell>{bl.dateLivraison || '—'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Chip label={statutCfg.label} color={statutCfg.color} size="small" />
                          {bl.factureNumero && (
                            <Chip
                              label="Facturé"
                              size="small"
                              sx={{ bgcolor: '#7c3aed', color: 'white', cursor: 'pointer' }}
                              onClick={() => navigate(`/factures/${bl.factureId}`)}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {bl.totalTTC != null
                          ? Number(bl.totalTTC).toLocaleString('fr-TN', { minimumFractionDigits: 3 }) + ' TND'
                          : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                          <Tooltip title="Voir le détail">
                            <IconButton color="primary" onClick={() => navigate(`/bons-livraison/${bl.id}`)}>
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          {canFacturer && (
                            <Tooltip title="Créer une facture pour ce BL">
                              <IconButton
                                sx={{ color: '#7c3aed' }}
                                onClick={() => setFactureDialog({ open: true, bl })}
                              >
                                <FactureIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {bl.factureId && !canFacturer && bl.statut === 'LIVRE' && (
                            <Tooltip title={`Voir la facture ${bl.factureNumero}`}>
                              <IconButton
                                sx={{ color: '#7c3aed' }}
                                onClick={() => navigate(`/factures/${bl.factureId}`)}
                              >
                                <FactureIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Télécharger PDF">
                            <IconButton color="secondary" onClick={() => handleDownloadPdf(bl)}>
                              <PdfIcon />
                            </IconButton>
                          </Tooltip>

                          {canUpdate && nextStatuts.length > 0 && (
                            <Button
                              size="small"
                              variant="outlined"
                              endIcon={isUpdating ? <CircularProgress size={12} /> : <ArrowDropDownIcon />}
                              onClick={(e) => openStatutMenu(e, bl)}
                              disabled={isUpdating}
                              sx={{
                                fontSize: '0.72rem',
                                py: 0.3,
                                px: 1,
                                borderColor: '#cbd5e1',
                                color: '#475569',
                                whiteSpace: 'nowrap',
                                '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                              }}
                            >
                              Statut
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                      Aucun bon de livraison trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filtered.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filtered.length}
                pageSize={itemsPerPage}
              />
            </Box>
          )}
        </>
      )}

      {/* Menu déroulant pour changer le statut */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeStatutMenu}>
        {(TRANSITIONS[menuBl?.statut] || []).map(s => (
          <MenuItem key={s} onClick={() => handleStatutChange(s)}>
            <Chip
              label={STATUT_CONFIG[s]?.label || s}
              color={STATUT_CONFIG[s]?.color || 'default'}
              size="small"
              sx={{ mr: 1 }}
            />
            Passer en {STATUT_CONFIG[s]?.label || s}
          </MenuItem>
        ))}
      </Menu>

      {/* Dialog de confirmation pour facturer un BL */}
      <Dialog open={factureDialog.open} onClose={() => !facturing && setFactureDialog({ open: false, bl: null })}>
        <DialogTitle>Créer une facture</DialogTitle>
        <DialogContent>
          <Typography>
            Créer une facture pour le bon de livraison <strong>{factureDialog.bl?.numero}</strong> ?
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
            Client : {factureDialog.bl?.client?.nom}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFactureDialog({ open: false, bl: null })} color="inherit" disabled={facturing}>
            Annuler
          </Button>
          <Button
            onClick={handleFacturer}
            variant="contained"
            disabled={facturing}
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
            startIcon={facturing ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <FactureIcon />}
          >
            {facturing ? 'Création...' : 'Créer la facture'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default BonLivraisonList;
