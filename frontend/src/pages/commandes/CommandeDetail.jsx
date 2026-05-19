import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { commandeService } from '../../services/commandeService';
import usePermission from '../../hooks/usePermission';

const STATUT_CONFIG = {
  EN_ATTENTE: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  VALIDEE:    { label: 'Validée',    color: '#10b981', bg: '#d1fae5' },
  LIVREE:     { label: 'Livrée',    color: '#6366f1', bg: '#ede9fe' },
  ANNULEE:    { label: 'Annulée',   color: '#ef4444', bg: '#fee2e2' },
};

const CommandeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canCreateBL = hasPermission('BON_LIVRAISON:CREATE');
  const [commande, setCommande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    commandeService.getById(id)
      .then(res => setCommande(res.data))
      .catch(() => toast.error('Impossible de charger la commande.'))
      .finally(() => setLoading(false));
  }, [id]);

  const validerCommande = async () => {
    if (!window.confirm('Valider cette commande ? Une facture sera automatiquement créée.')) return;
    setValidating(true);
    try {
      await commandeService.updateStatut(id, 'VALIDEE');
      toast.success('Commande validée ! Une facture a été créée automatiquement.');
      const res = await commandeService.getById(id);
      setCommande(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation.');
    } finally {
      setValidating(false);
    }
  };

  const annulerCommande = async () => {
    if (!window.confirm('Annuler cette commande ?')) return;
    try {
      await commandeService.updateStatut(id, 'ANNULEE');
      toast.success('Commande annulée.');
      const res = await commandeService.getById(id);
      setCommande(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  if (!commande) return <div style={{ padding: '2rem' }}>Commande introuvable.</div>;

  const statut = STATUT_CONFIG[commande.statut] || { label: commande.statut, color: '#64748b', bg: '#f1f5f9' };
  const remise = parseFloat(commande.remise) || 0;
  const canEdit = commande.statut === 'EN_ATTENTE';

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 {commande.reference}</h1>
          <span style={{
            display: 'inline-block', marginTop: 4, padding: '3px 10px',
            borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
            color: statut.color, background: statut.bg
          }}>{statut.label}</span>
          {commande.devisId && (
            <Link to={`/devis/${commande.devisId}`} style={{ marginLeft: 10, fontSize: '0.8rem', color: '#6366f1' }}>
              📄 Voir le devis source
            </Link>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canEdit && (
            <Link to={`/commandes/${id}/modifier`} className="btn btn-secondary">✏️ Modifier</Link>
          )}
          {canEdit && (
            <button className="btn btn-primary" onClick={validerCommande} disabled={validating}>
              {validating ? 'Traitement...' : '✅ Valider → Créer Facture'}
            </button>
          )}
          {canEdit && (
            <button className="btn btn-secondary" onClick={annulerCommande}
              style={{ color: '#ef4444', borderColor: '#ef4444' }}>
              ❌ Annuler
            </button>
          )}
          {canCreateBL && (
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/bons-livraison/nouveau?commandeId=${id}`)}
              style={{ color: '#0ea5e9', borderColor: '#0ea5e9' }}
            >
              🚚 Créer un BL
            </button>
          )}
          <Link to="/commandes" className="btn btn-secondary">← Retour</Link>
        </div>
      </div>

      {/* Infos générales */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Informations générales</h3>
        <div className="form-grid">
          <div><label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>CLIENT</label>
            <p style={{ margin: '4px 0', fontWeight: 600 }}>{commande.client?.nom}</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{commande.client?.email}</p>
          </div>
          <div><label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>VENDEUR</label>
            <p style={{ margin: '4px 0' }}>{commande.vendeur?.nom} {commande.vendeur?.prenom}</p>
          </div>
          <div><label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>SITE</label>
            <p style={{ margin: '4px 0' }}>{commande.site?.nom} ({commande.site?.ville})</p>
          </div>
          <div><label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>DATE COMMANDE</label>
            <p style={{ margin: '4px 0' }}>{commande.dateCommande ? new Date(commande.dateCommande).toLocaleDateString('fr-FR') : '-'}</p>
          </div>
          <div><label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>MÉTHODE PAIEMENT</label>
            <p style={{ margin: '4px 0' }}>
              {commande.paymentMethod === 'ESPECES' ? 'Espèces' : 
               commande.paymentMethod === 'VIREMENT' ? 'Virement bancaire' : 
               commande.paymentMethod === 'CHEQUE' ? 'Chèque' : 
               commande.paymentMethod || '-'}
            </p>
          </div>
          {commande.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>NOTES</label>
              <p style={{ margin: '4px 0', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, fontSize: '0.9rem' }}>{commande.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Lignes */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0 }}>Lignes de commande</h3>
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
            {commande.lignes?.map((l, i) => (
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
              <span>Total HT :</span><span>{Number(commande.totalHT || 0).toFixed(2)} TND</span>
            </div>
            {remise > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#f59e0b', fontWeight: 600 }}>
                  <span>🏷️ Remise ({remise}%) :</span>
                  <span>-{(Number(commande.totalHT || 0) * remise / 100).toFixed(2)} TND</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <span>HT après remise :</span><span>{Number(commande.totalHT_apres_remise || 0).toFixed(2)} TND</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
              <span>Total TVA :</span><span>{Number(commande.totalTva || 0).toFixed(2)} TND</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', borderTop: '2px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Total TTC :</span><span style={{ color: '#4f46e5' }}>{Number(commande.totalTTC || 0).toFixed(2)} TND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandeDetail;
