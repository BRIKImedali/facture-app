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
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';
import { tauxTvaService } from '../../services/tauxTvaService';
import Pagination from '../../components/Pagination';
import usePermission from '../../hooks/usePermission';

const EMPTY_FORM = { valeur: '', description: '', actif: true };

const TauxTvaPage = () => {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('TVA:CREATE');
  const canUpdate = hasPermission('TVA:UPDATE');
  const canDelete = hasPermission('TVA:DELETE');

  const [tauxList, setTauxList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [currentTaux, setCurrentTaux] = useState(EMPTY_FORM);
  const [tauxToDelete, setTauxToDelete] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchTaux();
  }, []);

  const fetchTaux = async () => {
    setLoading(true);
    try {
      const response = await tauxTvaService.getAll();
      setTauxList(response.data);
    } catch {
      showSnackbar('Erreur lors du chargement des taux TVA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (taux = EMPTY_FORM) => {
    setCurrentTaux({ ...taux });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTaux(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (currentTaux.valeur === '' || currentTaux.valeur === null) {
      showSnackbar('La valeur du taux (%) est obligatoire', 'error');
      return;
    }
    if (!currentTaux.description?.trim()) {
      showSnackbar('La description est obligatoire', 'error');
      return;
    }

    try {
      const payload = {
        ...currentTaux,
        valeur: parseFloat(currentTaux.valeur),
      };

      if (currentTaux.id) {
        await tauxTvaService.update(currentTaux.id, payload);
        showSnackbar('Taux TVA modifié avec succès', 'success');
      } else {
        await tauxTvaService.create(payload);
        showSnackbar('Taux TVA créé avec succès', 'success');
      }
      handleCloseDialog();
      fetchTaux();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        'Erreur lors de la sauvegarde';
      showSnackbar(msg, 'error');
    }
  };

  const confirmDelete = (taux) => {
    setTauxToDelete(taux);
    setOpenConfirmDialog(true);
  };

  const handleDelete = async () => {
    try {
      await tauxTvaService.remove(tauxToDelete.id);
      showSnackbar('Taux TVA supprimé avec succès', 'success');
      setOpenConfirmDialog(false);
      fetchTaux();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        'Erreur lors de la suppression';
      showSnackbar(msg, 'error');
      setOpenConfirmDialog(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredList = tauxList.filter(
    (t) =>
      String(t.valeur).includes(searchQuery) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PercentIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              Taux de TVA
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
              Gérez les taux de TVA applicables sur les documents commerciaux
            </Typography>
          </Box>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Ajouter un taux
          </Button>
        )}
      </Box>

      {/* Barre de recherche */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher par valeur ou description..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          size="small"
        />
      </Paper>

      {/* Tableau */}
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
                  <TableCell><b>ID</b></TableCell>
                  <TableCell><b>Taux (%)</b></TableCell>
                  <TableCell><b>Description</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedList.map((taux) => (
                  <TableRow key={taux.id} hover>
                    <TableCell>{taux.id}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#4f46e5' }}>
                        {taux.valeur}%
                      </Typography>
                    </TableCell>
                    <TableCell>{taux.description || '—'}</TableCell>
                    <TableCell>
                      {taux.actif ? (
                        <Chip label="Actif" color="success" size="small" />
                      ) : (
                        <Chip label="Inactif" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {canUpdate && (
                        <Tooltip title="Modifier">
                          <IconButton color="primary" onClick={() => handleOpenDialog(taux)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Supprimer">
                          <IconButton color="error" onClick={() => confirmDelete(taux)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!canUpdate && !canDelete && (
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          Lecture seule
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                      Aucun taux TVA trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredList.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredList.length}
                pageSize={itemsPerPage}
              />
            </Box>
          )}
        </>
      )}

      {/* Dialog Ajout / Modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {currentTaux.id ? 'Modifier le taux TVA' : 'Ajouter un taux TVA'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField
              label="Valeur du taux (%)"
              type="number"
              required
              fullWidth
              inputProps={{ min: 0, max: 100, step: 0.5 }}
              value={currentTaux.valeur}
              onChange={(e) => setCurrentTaux({ ...currentTaux, valeur: e.target.value })}
              helperText="Ex : 0, 7, 13, 19"
            />
            <TextField
              label="Description"
              required
              fullWidth
              value={currentTaux.description || ''}
              onChange={(e) => setCurrentTaux({ ...currentTaux, description: e.target.value })}
              helperText='Ex : "Exonéré", "Taux réduit", "Normal"'
            />
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(currentTaux.actif)}
                  onChange={(e) => setCurrentTaux({ ...currentTaux, actif: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Typography>
                  {currentTaux.actif
                    ? 'Actif — disponible dans les formulaires'
                    : 'Inactif — masqué dans les nouveaux documents'}
                </Typography>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Annuler
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmation Suppression */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le taux TVA{' '}
            <strong>{tauxToDelete?.valeur}% — {tauxToDelete?.description}</strong> ?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            La suppression est impossible si ce taux est déjà utilisé dans des factures, devis
            ou commandes existants.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="inherit">
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default TauxTvaPage;
