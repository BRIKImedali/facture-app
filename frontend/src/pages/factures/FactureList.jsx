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
  Search as SearchIcon, Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { factureService } from '../../services/factureService';
import Pagination from '../../components/Pagination';

const STATUT_CONFIG = {
  BROUILLON: { label: 'Brouillon', color: 'default' },
  ENVOYEE:   { label: 'Envoyée',   color: 'info' },
  PAYEE:     { label: 'Payée',     color: 'success' },
  ANNULEE:   { label: 'Annulée',   color: 'error' },
};

const FactureList = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatut, setSelectedStatut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [factureToDelete, setFactureToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();

  useEffect(() => { fetchFactures(); }, []);

  const fetchFactures = async (s = selectedStatut) => {
    setLoading(true);
    try {
      const res = await factureService.getAll(s || null);
      setFactures(res.data);
    } catch {
      showSnackbar('Erreur lors du chargement des factures.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatutFilter = (s) => {
    setSelectedStatut(s);
    setCurrentPage(1);
    fetchFactures(s);
  };

  const confirmDelete = (facture) => {
    setFactureToDelete(facture);
    setOpenConfirmDialog(true);
  };

  const handleDelete = async () => {
    try {
      await factureService.delete(factureToDelete.id);
      showSnackbar('Facture supprimée', 'success');
      setFactures(factures.filter(f => f.id !== factureToDelete.id));
      setOpenConfirmDialog(false);
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Suppression impossible.', 'error');
      setOpenConfirmDialog(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filtered = factures.filter(f => {
    const term = searchTerm.toLowerCase();
    return (
      (f.numero || '').toLowerCase().includes(term) ||
      (f.client?.nom || '').toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReceiptIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              Factures
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
              Gérez et suivez vos factures clients
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/factures/nouvelle')}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
        >
          Nouvelle facture
        </Button>
      </Box>

      {/* Search + Filter */}
      <Paper sx={{ mb: 3, p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          sx={{ flex: 1 }}
          variant="outlined"
          placeholder="Rechercher par numéro ou client..."
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
                  <TableCell><b>Numéro</b></TableCell>
                  <TableCell><b>Client</b></TableCell>
                  <TableCell><b>Date émission</b></TableCell>
                  <TableCell><b>Échéance</b></TableCell>
                  <TableCell><b>Total TTC</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((f) => {
                  const statutCfg = STATUT_CONFIG[f.statut] || { label: f.statut, color: 'default' };
                  return (
                    <TableRow key={f.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: '#4f46e5' }}>{f.numero}</Typography>
                      </TableCell>
                      <TableCell>{f.client?.nom}</TableCell>
                      <TableCell>{f.dateEmission ? new Date(f.dateEmission).toLocaleDateString('fr-FR') : '—'}</TableCell>
                      <TableCell>{f.dateEcheance ? new Date(f.dateEcheance).toLocaleDateString('fr-FR') : '—'}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {Number(f.totalTTC || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={statutCfg.label} color={statutCfg.color} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="Voir la facture">
                            <IconButton color="primary" onClick={() => navigate(`/factures/${f.id}`)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {f.statut !== 'PAYEE' && f.statut !== 'ANNULEE' && (
                            <Tooltip title="Supprimer">
                              <IconButton color="error" onClick={() => confirmDelete(f)}>
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
                      Aucune facture trouvée
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
          <Typography>Supprimer la facture <strong>{factureToDelete?.numero}</strong> ?</Typography>
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

export default FactureList;
