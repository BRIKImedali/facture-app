import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { factureService } from '../../services/factureService';
import toast from 'react-hot-toast';

const TRANSITIONS = {
  BROUILLON: [{ value: 'ENVOYEE', label: '📤 Marquer Envoyée', cls: 'btn-primary' }, { value: 'ANNULEE', label: '❌ Annuler', cls: 'btn-danger' }],
  ENVOYEE:   [{ value: 'PAYEE', label: '✅ Marquer Payée', cls: 'btn-success' }, { value: 'ANNULEE', label: '❌ Annuler', cls: 'btn-danger' }],
  PAYEE:     [],
  ANNULEE:   [],
};

const FactureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facture, setFacture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatut, setUpdatingStatut] = useState(false);
  const [validationErrors, setValidationErrors] = useState(null);
  const [validating, setValidating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    factureService.getById(id)
      .then(res => { setFacture(res.data); setLoading(false); })
      .catch(() => { setError('Facture introuvable.'); setLoading(false); });
  }, [id]);

  const handleStatut = async (statut) => {
    let pm = null;
    if (statut === 'PAYEE') {
      const p = window.prompt("Quel est le mode de paiement ? (ESPECES, VIREMENT, CHEQUE)", "VIREMENT");
      if (!p) return;
      pm = p.toUpperCase();
    } else {
      if (!window.confirm(`Changer le statut en "${statut}" ?`)) return;
    }
    setUpdatingStatut(true);
    try {
      const res = await factureService.updateStatut(id, { statut, paymentMethod: pm });
      setFacture(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally { setUpdatingStatut(false); }
  };

  const handleValiderIA = async () => {
    setValidating(true);
    setValidationErrors(null);
    try {
      const res = await factureService.validerIA(id);
      setValidationErrors(res.data); // tableau (vide = OK)
    } catch {
      setError('Erreur lors de la validation IA.');
    } finally {
      setValidating(false);
    }
  };

  const handleDownload = async (type) => {
    try {
      const response = type === 'pdf' 
        ? await factureService.downloadPdf(id)
        : await factureService.exportXml(id);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture_${facture.numero}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(`Erreur lors du téléchargement du ${type.toUpperCase()}.`);
    }
  };

  const handleSendEmail = async () => {
    if (!window.confirm(`Envoyer la facture ${facture.numero} par email à ${facture.client?.email || 'le client'} ?`)) return;
    setIsSendingEmail(true);
    const toastId = toast.loading('⏳ Envoi de l\'email en cours...');
    try {
      const res = await factureService.envoyerParEmail(id);
      toast.success(res.data?.message || 'Email envoyé avec succès !', { id: toastId, duration: 5000 });
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'envoi de l\'email.';
      toast.error(msg, { id: toastId, duration: 6000 });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const statutBadge = (s) => {
    const map = { BROUILLON: 'brouillon', ENVOYEE: 'envoyee', PAYEE: 'payee', ANNULEE: 'annulee' };
    return <span className={`badge badge-${map[s] || ''}`} style={{ fontSize: '0.875rem', padding: '0.3rem 0.8rem' }}>{s}</span>;
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error && !facture) return <div className="alert alert-danger">{error}</div>;

  const transitions = TRANSITIONS[facture.statut] || [];

  return (
    <div style={{ maxWidth: 860 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Facture {facture.numero}</h1>
            {statutBadge(facture.statut)}
          </div>
          <p className="page-subtitle">Créée le {facture.dateEmission ? new Date(facture.dateEmission).toLocaleDateString('fr-FR') : '—'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/factures" className="btn btn-secondary">← Retour</Link>
          <button onClick={() => handleDownload('pdf')} className="btn btn-secondary" style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1' }}>
            📄 Télécharger PDF
          </button>
          <button onClick={() => handleDownload('xml')} className="btn btn-secondary" style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1' }}>
            📥 Exporter XML
          </button>
          <button
            onClick={handleSendEmail}
            disabled={isSendingEmail || !facture.client?.email}
            title={!facture.client?.email ? 'Ce client n\'a pas d\'adresse email' : ''}
            className="btn btn-secondary"
            style={{
              background: isSendingEmail ? '#f8fafc' : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              color: isSendingEmail ? '#94a3b8' : '#fff',
              border: 'none',
              opacity: !facture.client?.email ? 0.5 : 1,
              cursor: !facture.client?.email ? 'not-allowed' : 'pointer',
            }}
          >
            {isSendingEmail ? '⏳ Envoi...' : '✉️ Envoyer par email'}
          </button>
          <button onClick={handleValiderIA} disabled={validating}
            className="btn btn-secondary"
            style={{ background: validating ? '#f8fafc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: validating ? '#94a3b8' : '#fff', border: 'none' }}>
            {validating ? '⏳ Validation...' : '🤖 Valider (IA)'}
          </button>
          {transitions.map(t => (
            <button key={t.value} onClick={() => handleStatut(t.value)}
              className={`btn ${t.cls}`} disabled={updatingStatut}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Résultats de la validation IA */}
      {validationErrors !== null && (
        <div style={{
          marginBottom: '1.25rem', padding: '1rem 1.25rem',
          borderRadius: 12, border: '1px solid',
          borderColor: validationErrors.length === 0 ? '#34d399' : '#f87171',
          background: validationErrors.length === 0 ? '#f0fdf4' : '#fef2f2',
        }}>
          {validationErrors.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: 600 }}>
              <span>✅</span>
              <span>Facture valide — aucune erreur détectée par l'assistant IA.</span>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
                ⚠️ {validationErrors.length} erreur(s) détectée(s) :
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#7f1d1d', fontSize: '0.875rem' }}>
                {validationErrors.map((err, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>
                    <strong style={{ color: '#991b1b' }}>[{err.champ}]</strong> {err.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Client + Infos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>Client</h3>
          <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{facture.client?.nom}</p>
          {facture.client?.email && <p style={{ margin: '0 0 0.25rem', color: '#64748b', fontSize: '0.875rem' }}>✉️ {facture.client.email}</p>}
          {facture.client?.telephone && <p style={{ margin: '0 0 0.25rem', color: '#64748b', fontSize: '0.875rem' }}>📞 {facture.client.telephone}</p>}
          {facture.client?.adresse && <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>📍 {facture.client.adresse}, {facture.client.ville}</p>}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>Détails</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem', color: '#64748b' }}>
            <div><strong style={{ color: '#374151' }}>Date d'échéance :</strong> {facture.dateEcheance || '—'}</div>
            <div><strong style={{ color: '#374151' }}>Mode de paiement :</strong> {facture.paymentMethod || '—'}</div>
            <div><strong style={{ color: '#374151' }}>Créée par :</strong> {facture.createdByEmail || '—'}</div>
            {facture.notes && <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: 6, color: '#475569' }}>💬 {facture.notes}</div>}
          </div>
        </div>
      </div>

      {/* Lignes de la facture */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Détail des prestations</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th style={{ width: 60, textAlign: 'center' }}>Qté</th>
              <th style={{ width: 120, textAlign: 'right' }}>Prix HT</th>
              <th style={{ width: 70, textAlign: 'center' }}>TVA</th>
              <th style={{ width: 120, textAlign: 'right' }}>Montant HT</th>
              <th style={{ width: 120, textAlign: 'right' }}>Montant TTC</th>
            </tr>
          </thead>
          <tbody>
            {facture.lignes?.map(l => (
              <tr key={l.id}>
                <td><strong>{l.designation}</strong></td>
                <td style={{ textAlign: 'center' }}>{l.quantite}</td>
                <td style={{ textAlign: 'right' }}>{Number(l.prixUnitaireHT).toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}>{l.tauxTva}%</td>
                <td style={{ textAlign: 'right' }}>{Number(l.montantHT).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}><strong>{Number(l.montantTTC).toFixed(2)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: 240 }}>
            {[
              { label: 'Total HT', value: facture.totalHT },
              { label: 'Total TVA', value: facture.totalTva },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
                <span>{label} :</span><span>{Number(value || 0).toFixed(2)} TND</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', borderTop: '2px solid #e2e8f0', paddingTop: '0.6rem', marginTop: '0.6rem' }}>
              <span>Total TTC :</span><span style={{ color: '#6366f1' }}>{Number(facture.totalTTC || 0).toFixed(2)} TND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactureDetail;
