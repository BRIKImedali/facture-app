import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip,
  TextField, InputAdornment
} from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';

import { commandeService } from '../../services/commandeService';
import Pagination from '../../components/Pagination';

const STATUTS = ['', 'EN_ATTENTE', 'VALIDEE', 'LIVREE', 'ANNULEE'];

const CommandeList = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatut, setSelectedStatut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [commandeToDelete, setCommandeToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

  const handleStatutChange = (s) => {
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

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'LIVREE': return 'success';
      case 'VALIDEE': return 'info';
      case 'ANNULEE': return 'error';
      case 'EN_ATTENTE': default: return 'warning';
    }
  };

  const filteredCommandes = commandes.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.reference?.toLowerCase().includes(term) ||
      c.client?.nom?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredCommandes.length / itemsPerPage);
  const paginatedCommandes = filteredCommandes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestion des Commandes</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/commandes/nouvelle')}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
        >
          Nouvelle commande
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher par référence ou client..."
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
                  <TableCell><b>Référence</b></TableCell>
                  <TableCell><b>Client</b></TableCell>
                  <TableCell><b>Date</b></TableCell>
                  <TableCell><b>Total TTC</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCommandes.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#6366f1' }}>{c.reference}</Typography></TableCell>
                    <TableCell>{c.client?.nom}</TableCell>
                    <TableCell>{c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : '-'}</TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{Number(c.totalTTC || 0).toFixed(2)} TND</Typography></TableCell>
                    <TableCell>
                      <Chip 
                        label={c.statut} 
                        size="small" 
                        color={getStatutColor(c.statut)}
                        sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: '24px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Voir la commande">
                          <IconButton color="primary" onClick={() => navigate(`/commandes/${c.id}`)} size="small">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {c.statut !== 'VALIDEE' && c.statut !== 'LIVREE' && c.statut !== 'ANNULEE' && (
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={() => confirmDelete(c)} size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCommandes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Aucune commande trouvée</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredCommandes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={commandes.length}
                pageSize={itemsPerPage}
              />
            </Box>
          )}
        </>
      )}

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer la commande "{commandeToDelete?.reference}" ?</Typography>
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

export default CommandeList;
