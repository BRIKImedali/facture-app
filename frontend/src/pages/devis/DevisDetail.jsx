import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { devisService } from '../../services/devisService';

const STATUT_CONFIG = {
  BROUILLON: { label: 'Brouillon', color: '#64748b', bg: '#f1f5f9' },
  ENVOYE:    { label: 'Envoyé',    color: '#0ea5e9', bg: '#e0f2fe' },
  ACCEPTE:   { label: 'Accepté',   color: '#10b981', bg: '#d1fae5' },
  REFUSE:    { label: 'Refusé',    color: '#ef4444', bg: '#fee2e2' },
  EXPIRE:    { label: 'Expiré',    color: '#f59e0b', bg: '#fef3c7' },
};

const DevisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    devisService.getById(id)
      .then(res => setDevis(res.data))
      .catch(() => toast.error('Impossible de charger le devis.'))
      .finally(() => setLoading(false));
  }, [id]);

  const confirmerAccepte = async () => {
    if (!window.confirm('Confirmer ce devis ? Une commande sera automatiquement créée.')) return;
    setConfirming(true);
    try {
      await devisService.updateStatut(id, 'ACCEPTE');
      toast.success('Devis accepté ! Une commande a été créée automatiquement.');
      const res = await devisService.getById(id);
      setDevis(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de statut.');
    } finally {
      setConfirming(false);
    }
  };

  const envoyerDevis = async () => {
    try {
      await devisService.updateStatut(id, 'ENVOYE');
      toast.success('Devis marqué comme envoyé.');
      const res = await devisService.getById(id);
      setDevis(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  if (!devis) return <div style={{ padding: '2rem' }}>Devis introuvable.</div>;

  const statut = STATUT_CONFIG[devis.statut] || { label: devis.statut, color: '#64748b', bg: '#f1f5f9' };
  const remise = parseFloat(devis.remise) || 0;
  const canEdit = devis.statut === 'BROUILLON' || devis.statut === 'ENVOYE';

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📄 {devis.reference}</h1>
          <span style={{
            display: 'inline-block', marginTop: 4, padding: '3px 10px',
            borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
            color: statut.color, background: statut.bg
          }}>{statut.label}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canEdit && (
            <Link to={`/devis/${id}/modifier`} className="btn btn-secondary">✏️ Modifier</Link>
          )}
          {devis.statut === 'BROUILLON' && (
            <button className="btn btn-secondary" onClick={envoyerDevis}>📤 Marquer Envoyé</button>
          )}
          {(devis.statut === 'BROUILLON' || devis.statut === 'ENVOYE') && (
            <button className="btn btn-primary" onClick={confirmerAccepte} disabled={confirming}>
              {confirming ? 'Traitement...' : '✅ Confirmer → Créer Commande'}
            </button>
          )}
          <Link to="/devis" className="btn btn-secondary">← Retour</Link>
        </div>
      </div>

      {/* Infos générales */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Informations générales</h3>
        <div className="form-grid">
          <div><label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>CLIENT</label>
            <p style={{ margin: '4px 0', fontWeight: 600 }}>{devis.client?.nom}</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{devis.client?.email}</p>
          </div>
          <div><label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>DATE DU DEVIS</label>
            <p style={{ margin: '4px 0' }}>{devis.dateDevis ? new Date(devis.dateDevis).toLocaleDateString('fr-FR') : '-'}</p>
          </div>
          <div><label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>DATE D'EXPIRATION</label>
            <p style={{ margin: '4px 0' }}>{devis.dateExpiration || '-'}</p>
          </div>
          <div><label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>CRÉÉ PAR</label>
            <p style={{ margin: '4px 0' }}>{devis.createdBy || '-'}</p>
          </div>
          {devis.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>NOTES</label>
              <p style={{ margin: '4px 0', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, fontSize: '0.9rem' }}>{devis.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Lignes */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0 }}>Lignes du devis</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th style={{ width: 70 }}>Qté</th>
              <th style={{ width: 120 }}>PU HT</th>
              <th style={{ width: 80 }}>TVA %</th>
              <th style={{ width: 100 }}>Mont. HT</th>
              <th style={{ width: 100 }}>Mont. TTC</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes?.map((l, i) => (
              <tr key={l.id || i}>
                <td><strong>{l.designation}</strong></td>
                <td>{l.quantite}</td>
                <td>{Number(l.prixUnitaireHT).toFixed(2)} TND</td>
                <td>{l.tauxTva}%</td>
                <td>{Number(l.montantHT).toFixed(2)} TND</td>
                <td><strong>{Number(l.montantTTC).toFixed(2)} TND</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right', minWidth: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
              <span>Total HT :</span><span>{Number(devis.totalHT || 0).toFixed(2)} TND</span>
            </div>
            {remise > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#f59e0b', fontWeight: 600 }}>
                  <span>🏷️ Remise ({remise}%) :</span>
                  <span>-{(Number(devis.totalHT || 0) * remise / 100).toFixed(2)} TND</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <span>HT après remise :</span><span>{Number(devis.totalHT_apres_remise || 0).toFixed(2)} TND</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
              <span>Total TVA :</span><span>{Number(devis.totalTva || 0).toFixed(2)} TND</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', borderTop: '2px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Total TTC :</span><span style={{ color: '#4f46e5' }}>{Number(devis.totalTTC || 0).toFixed(2)} TND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevisDetail;
