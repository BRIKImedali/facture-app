import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, TextField, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

import { emplacementService } from '../../services/emplacementService';
import { siteService } from '../../services/siteService';
import Pagination from '../../components/Pagination';

export default function EmplacementPage() {
  const [emplacements, setEmplacements] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eR, sR] = await Promise.all([emplacementService.getAll(), siteService.getAll()]);
      setEmplacements(eR.data);
      setSites(sR.data);
    } catch {
      showSnackbar('Impossible de charger les données', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = emplacements.filter(e => {
    const text = [e.zone, e.description].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()));
    const siteMatch = !filterSite || String(e.siteId) === filterSite;
    return text && siteMatch;
  });

  const confirmDelete = async () => {
    try {
      await emplacementService.delete(deleteId);
      showSnackbar('Emplacement supprimé', 'success');
      setOpenConfirmDialog(false);
      setDeleteId(null);
      load();
    } catch {
      showSnackbar('Impossible de supprimer', 'error');
      setOpenConfirmDialog(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedEmplacements = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>📍 Emplacements</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/emplacement/create')}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
        >
          Nouvel emplacement
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          sx={{ flex: 2, minWidth: '200px' }}
          variant="outlined"
          placeholder="Rechercher…"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          size="small"
        />
        <FormControl size="small" sx={{ flex: 1, minWidth: '200px' }}>
          <InputLabel>Filtrer par site</InputLabel>
          <Select
            value={filterSite}
            label="Filtrer par site"
            onChange={(e) => {
              setFilterSite(e.target.value);
              setCurrentPage(1);
            }}
          >
            <MenuItem value=""><em>Tous les sites</em></MenuItem>
            {sites.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.nom}</MenuItem>)}
          </Select>
        </FormControl>
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
                  <TableCell><b>Zone</b></TableCell>
                  <TableCell><b>Description</b></TableCell>
                  <TableCell><b>Site</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedEmplacements.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b' }}>{e.zone}</Typography></TableCell>
                    <TableCell>{e.description || '-'}</TableCell>
                    <TableCell>
                      <Chip label={e.siteNom} size="small" color="info" variant="outlined" sx={{ fontWeight: 500 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Voir">
                          <IconButton color="info" onClick={() => navigate(`/emplacement/${e.id}`)} size="small">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton color="primary" onClick={() => navigate(`/emplacement/edit/${e.id}`)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton color="error" onClick={() => { setDeleteId(e.id); setOpenConfirmDialog(true); }} size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">Aucun emplacement trouvé</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filtered.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filtered.length}
                pageSize={itemsPerPage}
              />
            </Box>
          )}
        </>
      )}

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer cet emplacement ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="inherit">Annuler</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
