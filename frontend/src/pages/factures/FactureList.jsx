import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip,
  TextField, InputAdornment
} from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';

import { factureService } from '../../services/factureService';
import Pagination from '../../components/Pagination';

const STATUTS = ['', 'BROUILLON', 'ENVOYEE', 'PAYEE', 'ANNULEE'];

const FactureList = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatut, setSelectedStatut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  const handleStatutChange = (s) => {
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

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'PAYEE': return 'success';
      case 'ENVOYEE': return 'info';
      case 'ANNULEE': return 'error';
      case 'BROUILLON': default: return 'default';
    }
  };

  const filteredFactures = factures.filter(f => {
    const term = searchTerm.toLowerCase();
    return (
      f.numero?.toLowerCase().includes(term) ||
      f.client?.nom?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);
  const paginatedFactures = filteredFactures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestion des Factures</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/factures/nouvelle')}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
        >
          Nouvelle facture
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher par numéro ou client..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {STATUTS.map(s => (
          <Button
            key={s}
            variant={selectedStatut === s ? 'contained' : 'outlined'}
            onClick={() => handleStatutChange(s)}
            size="small"
            sx={{ borderRadius: 2 }}
          >
            {s || 'Toutes'}
          </Button>
        ))}
      </Box>

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
                {paginatedFactures.map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#6366f1' }}>{f.numero}</Typography></TableCell>
                    <TableCell>{f.client?.nom}</TableCell>
                    <TableCell>{f.dateEmission ? new Date(f.dateEmission).toLocaleDateString('fr-FR') : '-'}</TableCell>
                    <TableCell>{f.dateEcheance ? new Date(f.dateEcheance).toLocaleDateString('fr-FR') : '-'}</TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{Number(f.totalTTC || 0).toFixed(2)} TND</Typography></TableCell>
                    <TableCell>
                      <Chip 
                        label={f.statut} 
                        size="small" 
                        color={getStatutColor(f.statut)}
                        sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: '24px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Voir la facture">
                          <IconButton color="primary" onClick={() => navigate(`/factures/${f.id}`)} size="small">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {f.statut !== 'PAYEE' && f.statut !== 'ANNULEE' && (
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={() => confirmDelete(f)} size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFactures.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Aucune facture trouvée</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredFactures.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={factures.length}
                pageSize={itemsPerPage}
              />
            </Box>
          )}
        </>
      )}

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer la facture "{factureToDelete?.numero}" ?</Typography>
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
