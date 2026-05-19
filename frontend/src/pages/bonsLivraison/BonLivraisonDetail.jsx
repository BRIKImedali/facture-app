import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bonLivraisonService } from '../../services/bonLivraisonService';
import usePermission from '../../hooks/usePermission';
import api from '../../services/api';

const STATUT_CONFIG = {
  BROUILLON: { label: 'Brouillon', color: '#64748b', bg: '#f1f5f9' },
  EN_COURS:  { label: 'En cours',  color: '#1d4ed8', bg: '#dbeafe' },
  LIVRE:     { label: 'Livré',     color: '#15803d', bg: '#dcfce7' },
  ANNULE:    { label: 'Annulé',    color: '#b91c1c', bg: '#fee2e2' },
};

const TRANSITIONS = {
  BROUILLON: ['EN_COURS', 'ANNULE'],
  EN_COURS:  ['LIVRE', 'ANNULE'],
  LIVRE:     [],
  ANNULE:    [],
};

const fmt = (n) => Number(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 });

const BonLivraisonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission('BON_LIVRAISON:UPDATE');

  const [bl, setBl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    bonLivraisonService.getById(id)
      .then(res => setBl(res.data))
      .catch(() => toast.error('Impossible de charger le bon de livraison.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatutChange = async (nouveauStatut) => {
    if (!window.confirm(`Passer le BL au statut "${STATUT_CONFIG[nouveauStatut]?.label}" ?`)) return;
    setUpdating(true);
    try {
      const res = await bonLivraisonService.updateStatut(id, nouveauStatut);
      setBl(res.data);
      toast.success('Statut mis à jour.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de statut.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/bons-livraison/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BL_${bl.numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur lors du téléchargement du PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  if (!bl) return <div style={{ padding: '2rem' }}>Bon de livraison introuvable.</div>;

  const statut = STATUT_CONFIG[bl.statut] || { label: bl.statut, color: '#64748b', bg: '#f1f5f9' };
  const nextStatuts = TRANSITIONS[bl.statut] || [];

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">🚚 {bl.numero}</h1>
          <span style={{
            display: 'inline-block', marginTop: 4, padding: '3px 10px',
            borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
            color: statut.color, background: statut.bg,
          }}>{statut.label}</span>
          {bl.factureNumero && (
            <Link to={`/factures/${bl.factureId}`} style={{ marginLeft: 10, fontSize: '0.8rem', color: '#7c3aed' }}>
              🧾 Facture : {bl.factureNumero}
            </Link>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canUpdate && nextStatuts.map(s => (
            <button
              key={s}
              className="btn btn-secondary"
              onClick={() => handleStatutChange(s)}
              disabled={updating}
              style={{
                color: STATUT_CONFIG[s]?.color,
                borderColor: STATUT_CONFIG[s]?.color,
              }}
            >
              {STATUT_CONFIG[s]?.label}
            </button>
          ))}
          <button
            className="btn btn-secondary"
            onClick={handleDownloadPdf}
            disabled={downloading}
            style={{ color: '#4f46e5', borderColor: '#4f46e5' }}
          >
            {downloading ? 'Génération...' : '📄 Télécharger PDF'}
          </button>
          <Link to="/bons-livraison" className="btn btn-secondary">← Retour</Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Informations</h3>
        <div className="form-grid">
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>CLIENT</label>
            <p style={{ margin: '4px 0', fontWeight: 600 }}>{bl.client?.nom}</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{bl.client?.email}</p>
          </div>
          {bl.commandeReference && (
            <div>
              <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>COMMANDE SOURCE</label>
              <p style={{ margin: '4px 0' }}>
                <Link to={`/commandes/${bl.commandeId}`} style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>
                  {bl.commandeReference}
                </Link>
              </p>
            </div>
          )}
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>DATE DE CRÉATION</label>
            <p style={{ margin: '4px 0' }}>{bl.dateCreation ? bl.dateCreation.substring(0, 10) : '—'}</p>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>DATE DE LIVRAISON</label>
            <p style={{ margin: '4px 0' }}>{bl.dateLivraison || '—'}</p>
          </div>
          {bl.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>NOTES</label>
              <p style={{ margin: '4px 0', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, fontSize: '0.9rem' }}>
                {bl.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0 }}>Articles livrés</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th style={{ width: 70 }}>Qté</th>
              <th style={{ width: 120 }}>PU HT</th>
              <th style={{ width: 80 }}>TVA %</th>
              <th style={{ width: 110 }}>Mont. HT</th>
              <th style={{ width: 110 }}>Mont. TTC</th>
            </tr>
          </thead>
          <tbody>
            {bl.lignes?.map((l, i) => (
              <tr key={l.id || i}>
                <td><strong>{l.designation}</strong></td>
                <td>{l.quantite}</td>
                <td>{fmt(l.prixUnitaireHT)} TND</td>
                <td>{l.tauxTva}%</td>
                <td>{fmt(l.montantHT)} TND</td>
                <td><strong>{fmt(l.montantTTC)} TND</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right', minWidth: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
              <span>Total HT :</span><span>{fmt(bl.totalHT)} TND</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
              <span>Total TVA :</span><span>{fmt(bl.totalTva)} TND</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', borderTop: '2px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Total TTC :</span><span style={{ color: '#4f46e5' }}>{fmt(bl.totalTTC)} TND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonLivraisonDetail;
