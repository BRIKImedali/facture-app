import React, { useState, useEffect } from 'react';
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
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Snackbar, 
  Alert, 
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { uniteService } from '../../services/uniteService';

const UnitesPage = () => {
  const [unites, setUnites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [currentUnite, setCurrentUnite] = useState({ nom: '', description: '' });
  const [uniteToDelete, setUniteToDelete] = useState(null);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUnites();
  }, []);

  const fetchUnites = async () => {
    setLoading(true);
    try {
      const response = await uniteService.getAll();
      setUnites(response.data);
    } catch (error) {
      showSnackbar('Erreur lors du chargement des unités', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (unite = { nom: '', description: '' }) => {
    setCurrentUnite(unite);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUnite({ nom: '', description: '' });
  };

  const handleSave = async () => {
    if (!currentUnite.nom.trim()) {
      showSnackbar('Le nom est obligatoire', 'error');
      return;
    }

    try {
      if (currentUnite.id) {
        await uniteService.update(currentUnite.id, currentUnite);
        showSnackbar('Unité modifiée avec succès', 'success');
      } else {
        await uniteService.create(currentUnite);
        showSnackbar('Unité créée avec succès', 'success');
      }
      handleCloseDialog();
      fetchUnites();
    } catch (error) {
      showSnackbar('Erreur lors de la sauvegarde', 'error');
    }
  };

  const confirmDelete = (unite) => {
    setUniteToDelete(unite);
    setOpenConfirmDialog(true);
  };

  const handleDelete = async () => {
    try {
      await uniteService.remove(uniteToDelete.id);
      showSnackbar('Unité supprimée avec succès', 'success');
      setOpenConfirmDialog(false);
      fetchUnites();
    } catch (error) {
      showSnackbar('Erreur lors de la suppression', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredUnites = unites.filter(u => 
    u.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.description && u.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestion des Unités</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
        >
          Ajouter une unité
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher par nom..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
        />
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Nom</b></TableCell>
                <TableCell><b>Description</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUnites.map((unite) => (
                <TableRow key={unite.id} hover>
                  <TableCell>{unite.id}</TableCell>
                  <TableCell>{unite.nom}</TableCell>
                  <TableCell>{unite.description || '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Modifier">
                      <IconButton color="primary" onClick={() => handleOpenDialog(unite)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton color="error" onClick={() => confirmDelete(unite)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUnites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">Aucune unité trouvée</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Ajout/Modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentUnite.id ? 'Modifier l\'unité' : 'Ajouter une unité'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nom de l'unité"
              required
              fullWidth
              value={currentUnite.nom}
              onChange={(e) => setCurrentUnite({ ...currentUnite, nom: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={currentUnite.description}
              onChange={(e) => setCurrentUnite({ ...currentUnite, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">Annuler</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmation Suppression */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer l'unité "{uniteToDelete?.nom}" ?</Typography>
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

export default UnitesPage;
