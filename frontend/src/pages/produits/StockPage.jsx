import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip,
  Select, MenuItem, FormControl, InputLabel, FormControlLabel, Checkbox, TextField
} from '@mui/material';
import { Edit as EditIcon, Visibility as VisibilityIcon, Add as AddIcon, FileDownload as SortieIcon, FileUpload as EntreeIcon } from '@mui/icons-material';

import { stockService } from '../../services/stockService';
import { siteService } from '../../services/siteService';
import Pagination from '../../components/Pagination';

export default function StockPage() {
  const [stocks, setStocks] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSite, setFilterSite] = useState('');
  const [alerteOnly, setAlerteOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [mouvement, setMouvement] = useState(null); // {id, type:'entree'|'sortie'}
  const [mvQty, setMvQty] = useState(1);
  const [openMvDialog, setOpenMvDialog] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stR, siR] = await Promise.all([
        stockService.getAll(),
        siteService.getAll()
      ]);
      setStocks(stR.data);
      setSites(siR.data);
    } catch {
      showSnackbar('Impossible de charger les données', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = stocks.filter(s => {
    const siteMatch  = !filterSite || String(s.siteId) === filterSite;
    const alerteMatch = !alerteOnly || s.enAlerte;
    return siteMatch && alerteMatch;
  });

  const handleMouvement = async () => {
    if (mvQty < 1) { showSnackbar('Quantité invalide', 'error'); return; }
    try {
      mouvement.type === 'entree'
        ? await stockService.entree(mouvement.id, mvQty)
        : await stockService.sortie(mouvement.id, mvQty);
      showSnackbar(mouvement.type === 'entree' ? `+${mvQty} entrée enregistrée` : `-${mvQty} sortie enregistrée`, 'success');
      setOpenMvDialog(false);
      setMouvement(null);
      setMvQty(1);
      load();
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Erreur', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedStocks = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>🗄️ Stocks</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/stock/create')}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
        >
          Nouveau stock
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: '220px' }}>
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
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={alerteOnly} 
              onChange={e => {
                setAlerteOnly(e.target.checked);
                setCurrentPage(1);
              }}
              color="error"
            />
          }
          label={<Typography sx={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ Alertes uniquement</Typography>}
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
                  <TableCell><b>Produit</b></TableCell>
                  <TableCell><b>Site</b></TableCell>
                  <TableCell><b>Emplacement</b></TableCell>
                  <TableCell><b>Quantité</b></TableCell>
                  <TableCell><b>Seuil min.</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStocks.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b' }}>{s.produitNom}</Typography></TableCell>
                    <TableCell>{s.siteNom}</TableCell>
                    <TableCell>{s.emplacementLabel || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: s.enAlerte ? '#ef4444' : '#16a34a' }}>
                        {s.quantite}
                      </Typography>
                    </TableCell>
                    <TableCell>{s.seuilMinimum}</TableCell>
                    <TableCell>
                      {s.enAlerte ? (
                        <Chip label="⚠️ Alerte" size="small" color="error" sx={{ fontWeight: 'bold' }} />
                      ) : (
                        <Chip label="✓ OK" size="small" color="success" sx={{ fontWeight: 'bold' }} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Entrée">
                          <IconButton color="success" onClick={() => { setMouvement({id: s.id, type: 'entree'}); setMvQty(1); setOpenMvDialog(true); }} size="small">
                            <EntreeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sortie">
                          <IconButton color="warning" onClick={() => { setMouvement({id: s.id, type: 'sortie'}); setMvQty(1); setOpenMvDialog(true); }} size="small">
                            <SortieIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Voir">
                          <IconButton color="info" onClick={() => navigate(`/stock/${s.id}`)} size="small">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton color="primary" onClick={() => navigate(`/stock/edit/${s.id}`)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Aucun stock trouvé</TableCell>
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

      {/* Dialog Mouvement */}
      <Dialog open={openMvDialog} onClose={() => setOpenMvDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ mb: 1 }}>{mouvement?.type === 'entree' ? '📥' : '📤'}</Typography>
          <Typography variant="h6" fontWeight="bold">
            {mouvement?.type === 'entree' ? 'Entrée de stock' : 'Sortie de stock'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Quantité"
            type="number"
            fullWidth
            InputProps={{ inputProps: { min: 1, style: { textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' } } }}
            value={mvQty}
            onChange={e => setMvQty(Number(e.target.value))}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setOpenMvDialog(false)} color="inherit">Annuler</Button>
          <Button onClick={handleMouvement} color={mouvement?.type === 'entree' ? 'success' : 'warning'} variant="contained">
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
