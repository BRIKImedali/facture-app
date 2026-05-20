import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, TextField, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { Building2 } from 'lucide-react';

import { siteService } from '../../services/siteService';
import Pagination from '../../components/Pagination';

export default function SitePage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await siteService.getAll();
      setSites(res.data);
    } catch {
      showSnackbar('Impossible de charger les sites', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = sites.filter(s =>
    [s.nom, s.ville, s.responsable].some(v =>
      v?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const confirmDelete = async () => {
    try {
      await siteService.delete(deleteId);
      showSnackbar('Site supprimé avec succès', 'success');
      setOpenConfirmDialog(false);
      setDeleteId(null);
      load();
    } catch {
      showSnackbar('Impossible de supprimer ce site', 'error');
      setOpenConfirmDialog(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedSites = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Building2 size={32} color="#4f46e5" />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>Sites</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>Gérez vos sites et entrepôts</Typography>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/site/create')}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
        >
          Nouveau site
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher par nom, ville ou responsable…"
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
                  <TableCell><b>Ville</b></TableCell>
                  <TableCell><b>Code Postal</b></TableCell>
                  <TableCell><b>Pays</b></TableCell>
                  <TableCell><b>Responsable</b></TableCell>
                  <TableCell><b>Téléphone</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSites.map(s => (
                  <TableRow key={s.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b' }}>{s.nom}</Typography></TableCell>
                    <TableCell>{s.ville}</TableCell>
                    <TableCell>{s.codePostal}</TableCell>
                    <TableCell>{s.pays}</TableCell>
                    <TableCell>{s.responsable || '-'}</TableCell>
                    <TableCell>{s.telephone || '-'}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Voir">
                          <IconButton color="info" onClick={() => navigate(`/site/${s.id}`)} size="small">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton color="primary" onClick={() => navigate(`/site/edit/${s.id}`)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton color="error" onClick={() => { setDeleteId(s.id); setOpenConfirmDialog(true); }} size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Aucun site trouvé</TableCell>
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
          <Typography>Confirmer la suppression de ce site ?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Les emplacements et stocks liés seront également supprimés.</Typography>
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
