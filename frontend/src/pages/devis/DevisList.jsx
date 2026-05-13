import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip
} from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon, Delete as DeleteIcon } from '@mui/icons-material';

import { devisService } from '../../services/devisService';
import Pagination from '../../components/Pagination';

const STATUTS = ['', 'BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE'];

const DevisList = () => {
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatut, setSelectedStatut] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  const handleStatutChange = (s) => {
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

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'ACCEPTE': return 'success';
      case 'ENVOYE': return 'info';
      case 'REFUSE': 
      case 'EXPIRE': return 'error';
      case 'BROUILLON': default: return 'default';
    }
  };

  const totalPages = Math.ceil(devisList.length / itemsPerPage);
  const paginatedDevis = devisList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestion des Devis</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/devis/nouveau')}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
        >
          Nouveau devis
        </Button>
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
            {s || 'Tous'}
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
                  <TableCell><b>Référence</b></TableCell>
                  <TableCell><b>Client</b></TableCell>
                  <TableCell><b>Date Devis</b></TableCell>
                  <TableCell><b>Expiration</b></TableCell>
                  <TableCell><b>Total TTC</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDevis.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#6366f1' }}>{d.reference}</Typography></TableCell>
                    <TableCell>{d.client?.nom}</TableCell>
                    <TableCell>{d.dateDevis ? new Date(d.dateDevis).toLocaleDateString('fr-FR') : '-'}</TableCell>
                    <TableCell>{d.dateExpiration ? new Date(d.dateExpiration).toLocaleDateString('fr-FR') : '-'}</TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{Number(d.totalTTC || 0).toFixed(2)} TND</Typography></TableCell>
                    <TableCell>
                      <Chip 
                        label={d.statut} 
                        size="small" 
                        color={getStatutColor(d.statut)}
                        sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: '24px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Voir le devis">
                          <IconButton color="primary" onClick={() => navigate(`/devis/${d.id}`)} size="small">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {d.statut !== 'ACCEPTE' && d.statut !== 'REFUSE' && (
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={() => confirmDelete(d)} size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {devisList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Aucun devis trouvé</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {devisList.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={devisList.length}
                pageSize={itemsPerPage}
              />
            </Box>
          )}
        </>
      )}

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer le devis "{devisToDelete?.reference}" ?</Typography>
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
