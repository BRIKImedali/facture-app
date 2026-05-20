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
  Search as SearchIcon, Description as DescriptionIcon,
} from '@mui/icons-material';
import { devisService } from '../../services/devisService';
import Pagination from '../../components/Pagination';

const STATUT_CONFIG = {
  BROUILLON: { label: 'Brouillon', color: 'default' },
  ENVOYE:    { label: 'Envoyé',    color: 'info' },
  ACCEPTE:   { label: 'Accepté',   color: 'success' },
  REFUSE:    { label: 'Refusé',    color: 'error' },
  EXPIRE:    { label: 'Expiré',    color: 'warning' },
};

const DevisList = () => {
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatut, setSelectedStatut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [devisToDelete, setDevisToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();

  useEffect(() => { fetchDevis(); }, []);

  const fetchDevis = async (s = selectedStatut) => {
    setLoading(true);
    try {
      const res = await devisService.getAll(s || null);
      setDevisList(res.data);
    } catch {
      showSnackbar('Erreur lors du chargement des devis.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatutFilter = (s) => {
    setSelectedStatut(s);
    setCurrentPage(1);
    fetchDevis(s);
  };

  const confirmDelete = (devis) => {
    setDevisToDelete(devis);
    setOpenConfirmDialog(true);
  };

  const handleDelete = async () => {
    try {
      await devisService.delete(devisToDelete.id);
      showSnackbar('Devis supprimé', 'success');
      setDevisList(devisList.filter(d => d.id !== devisToDelete.id));
      setOpenConfirmDialog(false);
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Suppression impossible.', 'error');
      setOpenConfirmDialog(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filtered = devisList.filter(d => {
    const term = searchTerm.toLowerCase();
    return (
      (d.reference || '').toLowerCase().includes(term) ||
      (d.client?.nom || '').toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DescriptionIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              Devis
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
              Gérez vos devis et propositions commerciales
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/devis/nouveau')}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
        >
          Nouveau devis
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
                  <TableCell><b>Référence</b></TableCell>
                  <TableCell><b>Client</b></TableCell>
                  <TableCell><b>Date devis</b></TableCell>
                  <TableCell><b>Expiration</b></TableCell>
                  <TableCell><b>Total TTC</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((d) => {
                  const statutCfg = STATUT_CONFIG[d.statut] || { label: d.statut, color: 'default' };
                  return (
                    <TableRow key={d.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: '#4f46e5' }}>{d.reference}</Typography>
                      </TableCell>
                      <TableCell>{d.client?.nom}</TableCell>
                      <TableCell>{d.dateDevis ? new Date(d.dateDevis).toLocaleDateString('fr-FR') : '—'}</TableCell>
                      <TableCell>{d.dateExpiration ? new Date(d.dateExpiration).toLocaleDateString('fr-FR') : '—'}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {Number(d.totalTTC || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={statutCfg.label} color={statutCfg.color} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="Voir le devis">
                            <IconButton color="primary" onClick={() => navigate(`/devis/${d.id}`)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {d.statut !== 'ACCEPTE' && d.statut !== 'REFUSE' && (
                            <Tooltip title="Supprimer">
                              <IconButton color="error" onClick={() => confirmDelete(d)}>
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
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                      Aucun devis trouvé
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
          <Typography>Supprimer le devis <strong>{devisToDelete?.reference}</strong> ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="inherit">Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DevisList;
