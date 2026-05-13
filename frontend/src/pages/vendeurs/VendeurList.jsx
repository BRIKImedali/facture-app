import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, TextField, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

import { vendeurService } from '../../services/vendeurService';
import { AuthContext } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';

const VendeurList = () => {
  const [vendeurs, setVendeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [vendeurToDelete, setVendeurToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => { fetchVendeurs(); }, []);

  const fetchVendeurs = async () => {
    setLoading(true);
    try {
      const res = await vendeurService.getAll();
      setVendeurs(res.data);
    } catch {
      showSnackbar('Erreur lors du chargement des vendeurs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (vendeur) => {
    setVendeurToDelete(vendeur);
    setOpenConfirmDialog(true);
  };

  const handleDelete = async () => {
    try {
      await vendeurService.delete(vendeurToDelete.id);
      showSnackbar('Vendeur supprimé avec succès', 'success');
      setVendeurs(vendeurs.filter(v => v.id !== vendeurToDelete.id));
      setOpenConfirmDialog(false);
    } catch {
      showSnackbar('Impossible de supprimer ce vendeur.', 'error');
      setOpenConfirmDialog(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredVendeurs = vendeurs.filter(v => 
    v.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.matricule && v.matricule.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredVendeurs.length / itemsPerPage);
  const paginatedVendeurs = filteredVendeurs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestion des Vendeurs</Typography>
        {isAdmin && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/vendeurs/nouveau')}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Nouveau vendeur
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher par nom, prénom, email, matricule..."
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
                  <TableCell><b>Nom complet</b></TableCell>
                  <TableCell><b>Email</b></TableCell>
                  <TableCell><b>Téléphone</b></TableCell>
                  <TableCell><b>Matricule</b></TableCell>
                  <TableCell><b>Commission</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedVendeurs.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b' }}>{v.nom} {v.prenom}</Typography>
                      {v.ville && <Typography variant="caption" color="text.secondary">{v.ville}</Typography>}
                    </TableCell>
                    <TableCell>{v.email || '-'}</TableCell>
                    <TableCell>{v.telephone || '-'}</TableCell>
                    <TableCell>
                      {v.matricule ? <Chip label={v.matricule} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9' }} /> : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: v.tauxCommission > 0 ? '#16a34a' : 'text.secondary' }}>
                        {v.tauxCommission != null ? `${v.tauxCommission}%` : '0%'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={v.actif ? 'Actif' : 'Inactif'} 
                        size="small" 
                        color={v.actif ? 'success' : 'error'}
                        variant={v.actif ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 'bold', height: '24px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {isAdmin ? (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="Modifier">
                            <IconButton color="primary" onClick={() => navigate(`/vendeurs/${v.id}/modifier`)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={() => confirmDelete(v)} size="small">
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
                {filteredVendeurs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Aucun vendeur trouvé</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredVendeurs.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredVendeurs.length}
                pageSize={itemsPerPage}
              />
            </Box>
          )}
        </>
      )}

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer le vendeur "{vendeurToDelete?.nom} {vendeurToDelete?.prenom}" ?</Typography>
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

export default VendeurList;
