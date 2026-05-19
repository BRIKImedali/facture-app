import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Chip, CircularProgress, TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Snackbar, Alert,
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon,
  PictureAsPdf as PdfIcon, Search as SearchIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bonLivraisonService } from '../../services/bonLivraisonService';
import Pagination from '../../components/Pagination';
import usePermission from '../../hooks/usePermission';
import api from '../../services/api';

const STATUT_CONFIG = {
  BROUILLON: { label: 'Brouillon', color: 'default' },
  EN_COURS:  { label: 'En cours',  color: 'info' },
  LIVRE:     { label: 'Livré',     color: 'success' },
  ANNULE:    { label: 'Annulé',    color: 'error' },
};

const BonLivraisonList = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('BON_LIVRAISON:CREATE');

  const [bls, setBls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchBls();
  }, []);

  const fetchBls = async () => {
    setLoading(true);
    try {
      const response = await bonLivraisonService.getAll();
      setBls(response.data);
    } catch {
      showSnackbar('Erreur lors du chargement des bons de livraison', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (bl) => {
    try {
      const response = await api.get(`/bons-livraison/${bl.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BL_${bl.numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showSnackbar('Erreur lors du téléchargement du PDF', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filtered = bls.filter(bl => {
    const matchSearch =
      (bl.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bl.client?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bl.commandeReference || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = statutFilter ? bl.statut === statutFilter : true;
    return matchSearch && matchStatut;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShippingIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              Bons de Livraison
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
              Gérez les bons de livraison liés aux commandes
            </Typography>
          </Box>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/bons-livraison/nouveau')}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Nouveau BL
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          sx={{ flex: 1 }}
          variant="outlined"
          placeholder="Rechercher par numéro, client, commande..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          size="small"
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={statutFilter}
            label="Statut"
            onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}
          >
            <MenuItem value="">Tous</MenuItem>
            {Object.entries(STATUT_CONFIG).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
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
                  <TableCell><b>Numéro</b></TableCell>
                  <TableCell><b>Client</b></TableCell>
                  <TableCell><b>Commande</b></TableCell>
                  <TableCell><b>Date création</b></TableCell>
                  <TableCell><b>Date livraison</b></TableCell>
                  <TableCell><b>Statut</b></TableCell>
                  <TableCell><b>Total TTC</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((bl) => {
                  const statutCfg = STATUT_CONFIG[bl.statut] || { label: bl.statut, color: 'default' };
                  return (
                    <TableRow key={bl.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: '#4f46e5' }}>{bl.numero}</Typography>
                      </TableCell>
                      <TableCell>{bl.client?.nom || '—'}</TableCell>
                      <TableCell>{bl.commandeReference || '—'}</TableCell>
                      <TableCell>{bl.dateCreation ? bl.dateCreation.substring(0, 10) : '—'}</TableCell>
                      <TableCell>{bl.dateLivraison || '—'}</TableCell>
                      <TableCell>
                        <Chip label={statutCfg.label} color={statutCfg.color} size="small" />
                        {bl.factureNumero && (
                          <Chip label="Facturé" size="small" sx={{ ml: 0.5, bgcolor: '#7c3aed', color: 'white' }} />
                        )}
                      </TableCell>
                      <TableCell>
                        {bl.totalTTC != null
                          ? Number(bl.totalTTC).toLocaleString('fr-TN', { minimumFractionDigits: 3 }) + ' TND'
                          : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Voir le détail">
                          <IconButton color="primary" onClick={() => navigate(`/bons-livraison/${bl.id}`)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Télécharger PDF">
                          <IconButton color="secondary" onClick={() => handleDownloadPdf(bl)}>
                            <PdfIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                      Aucun bon de livraison trouvé
                    </TableCell>
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default BonLivraisonList;
