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
  Switch,
  FormControlLabel,
  Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { deviseService } from '../../services/deviseService';
import Pagination from '../../components/Pagination';
import usePermission from '../../hooks/usePermission';

const emptyDevise = { code: '', symbole: '', nom: '', actif: true };

const DevisesPage = () => {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('DEVISE:CREATE');
  const canUpdate = hasPermission('DEVISE:UPDATE');
  const canDelete = hasPermission('DEVISE:DELETE');

  const [devises, setDevises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [currentDevise, setCurrentDevise] = useState(emptyDevise);
  const [deviseToDelete, setDeviseToDelete] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchDevises();
  }, []);

  const fetchDevises = async () => {
    setLoading(true);
    try {
      const response = await deviseService.getAll();
      setDevises(response.data);
    } catch {
      showSnackbar('Erreur lors du chargement des devises', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (devise = emptyDevise) => {
    setCurrentDevise({ ...devise });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentDevise(emptyDevise);
  };

  const handleSave = async () => {
    if (!currentDevise.code?.trim()) {
      showSnackbar('Le code est obligatoire', 'error');
      return;
    }
    if (!currentDevise.symbole?.trim()) {
      showSnackbar('Le symbole est obligatoire', 'error');
      return;
    }
    if (!currentDevise.nom?.trim()) {
      showSnackbar('Le nom est obligatoire', 'error');
      return;
    }

    try {
      if (currentDevise.id) {
        await deviseService.update(currentDevise.id, currentDevise);
        showSnackbar('Devise modifiée avec succès', 'success');
      } else {
        await deviseService.create(currentDevise);
        showSnackbar('Devise créée avec succès', 'success');
      }
      handleCloseDialog();
      fetchDevises();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        'Erreur lors de la sauvegarde';
      showSnackbar(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    }
  };

  const confirmDelete = (devise) => {
    setDeviseToDelete(devise);
    setOpenConfirmDialog(true);
  };

  const handleDelete = async () => {
    try {
      await deviseService.remove(deviseToDelete.id);
      showSnackbar('Devise supprimée avec succès', 'success');
      setOpenConfirmDialog(false);
      fetchDevises();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        'Impossible de supprimer cette devise (elle est peut-être utilisée par un client).';
      showSnackbar(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
      setOpenConfirmDialog(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredDevises = devises.filter(d =>
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.symbole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDevises.length / itemsPerPage);
  const paginatedDevises = filteredDevises.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          💱 Gestion des Devises
        </Typography>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Ajouter une devise
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher par code, nom ou symbole…"
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
                  <TableCell><b>Code</b></TableCell>
                  <TableCell><b>Symbole</b></TableCell>
                  <TableCell><b>Nom</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDevises.map((devise) => (
                  <TableRow key={devise.id} hover>
                    <TableCell>
                      <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {devise.code}
                      </strong>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '1.2rem' }}>{devise.symbole}</span>
                    </TableCell>
                    <TableCell>{devise.nom}</TableCell>
                    <TableCell>
                      <Chip
                        label={devise.actif ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          bgcolor: devise.actif ? '#dcfce7' : '#fee2e2',
                          color: devise.actif ? '#166534' : '#991b1b',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {canUpdate && (
                        <Tooltip title="Modifier">
                          <IconButton color="primary" onClick={() => handleOpenDialog(devise)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Supprimer">
                          <IconButton color="error" onClick={() => confirmDelete(devise)}>
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
                {filteredDevises.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Aucune devise trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredDevises.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredDevises.length}
                pageSize={itemsPerPage}
              />
            </Box>
          )}
        </>
      )}

      {/* Dialog Ajout/Modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentDevise.id ? '✏️ Modifier la devise' : '➕ Ajouter une devise'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Code ISO (ex: USD, EUR, MAD)"
              required
              fullWidth
              inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }}
              value={currentDevise.code}
              onChange={(e) =>
                setCurrentDevise({ ...currentDevise, code: e.target.value.toUpperCase() })
              }
              helperText="Code ISO 4217 — max 10 caractères"
            />
            <TextField
              label="Symbole (ex: $, €, د.م.)"
              required
              fullWidth
              inputProps={{ maxLength: 10 }}
              value={currentDevise.symbole}
              onChange={(e) =>
                setCurrentDevise({ ...currentDevise, symbole: e.target.value })
              }
            />
            <TextField
              label="Nom complet (ex: Dollar américain)"
              required
              fullWidth
              value={currentDevise.nom}
              onChange={(e) =>
                setCurrentDevise({ ...currentDevise, nom: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={currentDevise.actif ?? true}
                  onChange={(e) =>
                    setCurrentDevise({ ...currentDevise, actif: e.target.checked })
                  }
                  color="primary"
                />
              }
              label="Devise active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">Annuler</Button>
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
            Êtes-vous sûr de vouloir supprimer la devise{' '}
            <strong>
              {deviseToDelete?.symbole} — {deviseToDelete?.code} — {deviseToDelete?.nom}
            </strong>{' '}
            ?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            La suppression est impossible si cette devise est utilisée par un client.
          </Alert>
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

export default DevisesPage;
