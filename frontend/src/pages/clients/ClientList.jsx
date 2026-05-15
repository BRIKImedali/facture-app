import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

import { clientService } from '../../services/clientService';
import { AuthContext } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await clientService.getAll();
      setClients(res.data);
    } catch (err) {
      showSnackbar('Erreur lors du chargement des clients.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (client) => {
    setClientToDelete(client);
    setOpenConfirmDialog(true);
  };

  const handleDelete = async () => {
    try {
      await clientService.delete(clientToDelete.id);
      showSnackbar('Client supprimé avec succès', 'success');
      setClients(clients.filter(c => c.id !== clientToDelete.id));
      setOpenConfirmDialog(false);
    } catch {
      showSnackbar('Impossible de supprimer ce client (il a peut-être des factures liées).', 'error');
      setOpenConfirmDialog(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredClients = clients.filter(c => 
    c.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.ville && c.ville.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestion des Clients</Typography>
        {user?.role === 'ADMIN' && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/clients/nouveau')}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Nouveau client
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher par nom, email, ville..."
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
                  <TableCell><b>Nom</b></TableCell>
                  <TableCell><b>Email</b></TableCell>
                  <TableCell><b>Téléphone</b></TableCell>
                  <TableCell><b>Ville</b></TableCell>
                  <TableCell><b>Vendeur</b></TableCell>
                  <TableCell><b>Devise</b></TableCell>
                  <TableCell><b>Catégories</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedClients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell><strong style={{ color: '#1e293b' }}>{client.nom}</strong></TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.telephone || '-'}</TableCell>
                    <TableCell>{client.ville || '-'}</TableCell>
                    <TableCell>
                      {client.vendeurNom ? (
                        <Chip
                          label={client.vendeurNom}
                          size="small"
                          sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 500, height: '22px', fontSize: '0.75rem' }}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {client.deviseSymbole ? (
                        <Chip
                          label={`${client.deviseSymbole} ${client.deviseCode}`}
                          size="small"
                          sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 600, height: '22px', fontSize: '0.75rem' }}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {client.categorieIds && client.categorieIds.length > 0 ? (
                        <Chip
                          label={`${client.categorieIds.length} catégorie${client.categorieIds.length > 1 ? 's' : ''}`}
                          size="small"
                          sx={{ bgcolor: '#e0e7ff', color: '#3730a3', fontWeight: 500, height: '22px', fontSize: '0.75rem' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {user?.role === 'ADMIN' ? (
                        <>
                          <Tooltip title="Modifier">
                            <IconButton color="primary" onClick={() => navigate(`/clients/${client.id}/modifier`)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={() => confirmDelete(client)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredClients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">Aucun client trouvé</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredClients.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredClients.length}
                pageSize={itemsPerPage}
              />
            </Box>
          )}
        </>
      )}

      {/* Dialog Confirmation Suppression */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer le client "{clientToDelete?.nom}" ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="inherit">Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientList;
