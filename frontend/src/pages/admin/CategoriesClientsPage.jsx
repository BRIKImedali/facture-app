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
import { categorieClientService } from '../../services/categorieClientService';
import Pagination from '../../components/Pagination';
import usePermission from '../../hooks/usePermission';

const CategoriesClientsPage = () => {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('CATEGORIE:CREATE');
  const canUpdate = hasPermission('CATEGORIE:UPDATE');
  const canDelete = hasPermission('CATEGORIE:DELETE');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ nom: '', description: '' });
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categorieClientService.getAll();
      setCategories(response.data);
    } catch (error) {
      showSnackbar('Erreur lors du chargement des catégories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = { nom: '', description: '' }) => {
    setCurrentCategory(category);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCategory({ nom: '', description: '' });
  };

  const handleSave = async () => {
    if (!currentCategory.nom.trim()) {
      showSnackbar('Le nom est obligatoire', 'error');
      return;
    }

    try {
      if (currentCategory.id) {
        await categorieClientService.update(currentCategory.id, currentCategory);
        showSnackbar('Catégorie modifiée avec succès', 'success');
      } else {
        await categorieClientService.create(currentCategory);
        showSnackbar('Catégorie créée avec succès', 'success');
      }
      handleCloseDialog();
      fetchCategories();
    } catch (error) {
      const msg = error.response?.data?.message
        || error.response?.data
        || 'Erreur lors de la sauvegarde';
      showSnackbar(msg, 'error');
    }
  };

  const confirmDelete = (category) => {
    setCategoryToDelete(category);
    setOpenConfirmDialog(true);
  };

  const handleDelete = async () => {
    try {
      await categorieClientService.remove(categoryToDelete.id);
      showSnackbar('Catégorie supprimée avec succès', 'success');
      setOpenConfirmDialog(false);
      fetchCategories();
    } catch (error) {
      showSnackbar('Erreur lors de la suppression', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredCategories = categories.filter(c =>
    c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestion des Catégories Clients</Typography>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Ajouter une catégorie
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher par nom..."
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
                  <TableCell><b>Description</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCategories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>{category.nom}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell align="right">
                      {canUpdate && (
                        <Tooltip title="Modifier">
                          <IconButton color="primary" onClick={() => handleOpenDialog(category)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Supprimer">
                          <IconButton color="error" onClick={() => confirmDelete(category)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">Aucune catégorie trouvée</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredCategories.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredCategories.length}
                pageSize={itemsPerPage}
              />
            </Box>
          )}
        </>
      )}

      {/* Dialog Ajout/Modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentCategory.id ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nom de la catégorie"
              required
              fullWidth
              value={currentCategory.nom}
              onChange={(e) => setCurrentCategory({ ...currentCategory, nom: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={currentCategory.description}
              onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
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
          <Typography>Êtes-vous sûr de vouloir supprimer la catégorie "{categoryToDelete?.nom}" ?</Typography>
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

export default CategoriesClientsPage;
