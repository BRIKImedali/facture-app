import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Add as AddIcon, Visibility as VisibilityIcon, Delete as DeleteIcon,
  Search as SearchIcon, ShoppingCart as ShoppingCartIcon, Build as GenerateIcon,
} from '@mui/icons-material';
import { commandeService } from '../../services/commandeService';
import Pagination from '../../components/Pagination';
import ChoixGenerationModal from '../../components/ChoixGenerationModal';

const STATUT_CONFIG = {
  EN_ATTENTE: { label: 'En attente', color: 'warning' },
  VALIDEE:    { label: 'Validée',    color: 'info' },
  LIVREE:     { label: 'Livrée',     color: 'success' },
  ANNULEE:    { label: 'Annulée',    color: 'error' },
};

const CommandeList = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatut, setSelectedStatut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [commandeToDelete, setCommandeToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [generateModal, setGenerateModal] = useState({ open: false, commande: null });

  const navigate = useNavigate();

  useEffect(() => { fetchCommandes(); }, []);

  const fetchCommandes = async (s = selectedStatut) => {
    setLoading(true);
    try {
      const res = await commandeService.getAll(s || null);
      setCommandes(res.data);
    } catch {
      showSnackbar('Erreur lors du chargement des commandes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatutFilter = (s) => {
    setSelectedStatut(s);
    setCurrentPage(1);
    fetchCommandes(s);
  };

  const confirmDelete = (commande) => {
    setCommandeToDelete(commande);
    setOpenConfirmDialog(true);
  };

  const handleDelete = async () => {
    try {
      await commandeService.delete(commandeToDelete.id);
      showSnackbar('Commande supprimée', 'success');
      setCommandes(commandes.filter(c => c.id !== commandeToDelete.id));
      setOpenConfirmDialog(false);
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Suppression impossible.', 'error');
      setOpenConfirmDialog(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleGenerationSuccess = (type, result) => {
    if (type === 'FACTURE') showSnackbar(`Facture ${result.numero} créée avec succès !`, 'success');
  };

  const filtered = commandes.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c.reference || '').toLowerCase().includes(term) ||
      (c.client?.nom || '').toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShoppingCartIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              Commandes
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
              Suivez et gérez les commandes clients
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/commandes/nouvelle')}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
        >
          Nouvelle commande
        </Button>
      </Box>

      {/* Search + Filter */}
      <Paper sx={{ mb: 3, p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          sx={{ flex: 1 }}
          variant="outlined"
          placeholder="Rechercher par référence ou client..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          size="small"
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={selectedStatut}
            label="Statut"
            onChange={(e) => handleStatutFilter(e.target.value)}
          >
            <MenuItem value="">Toutes</MenuItem>
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
                  <TableCell><b>Référence</b></TableCell>
                  <TableCell><b>Client</b></TableCell>
                  <TableCell><b>Date</b></TableCell>
                  <TableCell><b>Total TTC</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((c) => {
                  const statutCfg = STATUT_CONFIG[c.statut] || { label: c.statut, color: 'default' };
                  return (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: '#4f46e5' }}>{c.reference}</Typography>
                      </TableCell>
                      <TableCell>{c.client?.nom}</TableCell>
                      <TableCell>{c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : '—'}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {Number(c.totalTTC || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={statutCfg.label} color={statutCfg.color} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="Voir la commande">
                            <IconButton color="primary" onClick={() => navigate(`/commandes/${c.id}`)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {c.statut !== 'ANNULEE' && (
                            <Tooltip title="Générer BL ou Facture">
                              <IconButton
                                color="secondary"
                                onClick={() => setGenerateModal({ open: true, commande: c })}
                              >
                                <GenerateIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {c.statut !== 'VALIDEE' && c.statut !== 'LIVREE' && c.statut !== 'ANNULEE' && (
                            <Tooltip title="Supprimer">
                              <IconButton color="error" onClick={() => confirmDelete(c)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                      Aucune commande trouvée
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

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Supprimer la commande <strong>{commandeToDelete?.reference}</strong> ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="inherit">Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>

      <ChoixGenerationModal
        open={generateModal.open}
        onClose={() => setGenerateModal({ open: false, commande: null })}
        commande={generateModal.commande}
        onSuccess={handleGenerationSuccess}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CommandeList;
