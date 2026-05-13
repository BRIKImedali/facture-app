import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, TextField, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon
} from '@mui/icons-material';

import { produitService } from '../../services/produitService';
import { AuthContext } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';

const ProduitList = () => {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [produitToDelete, setProduitToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => { fetchProduits(); }, []);

  const fetchProduits = async () => {
    setLoading(true);
    try {
      const res = await produitService.getAll();
      setProduits(res.data);
    } catch {
      showSnackbar('Erreur lors du chargement des produits.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActif = async (p) => {
    try {
      if (p.actif) {
        await produitService.desactiver(p.id);
        showSnackbar('Produit désactivé', 'success');
      } else {
        await produitService.update(p.id, { ...p, actif: true });
        showSnackbar('Produit activé', 'success');
      }
      fetchProduits();
    } catch { 
      showSnackbar('Erreur lors de la mise à jour du statut.', 'error'); 
    }
  };

  const confirmDelete = (produit) => {
    setProduitToDelete(produit);
    setOpenConfirmDialog(true);
  };

  const handleDelete = async () => {
    try {
      await produitService.delete(produitToDelete.id);
      showSnackbar('Produit supprimé avec succès', 'success');
      setProduits(produits.filter(p => p.id !== produitToDelete.id));
      setOpenConfirmDialog(false);
    } catch {
      showSnackbar('Impossible de supprimer ce produit.', 'error');
      setOpenConfirmDialog(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredProduits = produits.filter(p => 
    p.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.reference && p.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredProduits.length / itemsPerPage);
  const paginatedProduits = filteredProduits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestion des Produits</Typography>
        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/produits/nouveau')}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Nouveau produit
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher par nom, référence..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          size="small"
        />
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
                  <TableCell><b>Nom</b></TableCell>
                  <TableCell><b>Prix HT</b></TableCell>
                  <TableCell><b>TVA</b></TableCell>
                  <TableCell><b>Unité</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProduits.map((p) => (
                  <TableRow key={p.id} hover sx={{ opacity: p.actif ? 1 : 0.6 }}>
                    <TableCell>
                      <Chip label={p.reference || '-'} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b' }}>{p.nom}</Typography>
                      {p.description && (
                        <Typography variant="caption" color="text.secondary">
                          {p.description.substring(0, 50)}{p.description.length > 50 ? '...' : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{Number(p.prixHT).toFixed(2)} TND</Typography></TableCell>
                    <TableCell>{p.tauxTva}%</TableCell>
                    <TableCell>{p.unite?.nom || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={p.actif ? 'Actif' : 'Inactif'} 
                        size="small" 
                        color={p.actif ? 'success' : 'default'}
                        variant={p.actif ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 'bold', height: '24px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="Modifier">
                            <IconButton color="primary" onClick={() => navigate(`/produits/${p.id}/modifier`)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={p.actif ? "Désactiver" : "Activer"}>
                            <IconButton color={p.actif ? "warning" : "success"} onClick={() => handleToggleActif(p)} size="small">
                              {p.actif ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={() => confirmDelete(p)} size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProduits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Aucun produit trouvé</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredProduits.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredProduits.length}
                pageSize={itemsPerPage}
              />
            </Box>
          )}
        </>
      )}

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer le produit "{produitToDelete?.nom}" ?</Typography>
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

export default ProduitList;
