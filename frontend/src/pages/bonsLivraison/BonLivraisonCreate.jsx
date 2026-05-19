import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { commandeService } from '../../services/commandeService';
import { bonLivraisonService } from '../../services/bonLivraisonService';
import SearchableSelect from '../../components/SearchableSelect';

const fmt = (n) => Number(n || 0).toFixed(3);

const BonLivraisonCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const commandeIdParam = searchParams.get('commandeId');

  const [commandes, setCommandes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [commandeId, setCommandeId] = useState(commandeIdParam || '');
  const [dateLivraison, setDateLivraison] = useState('');
  const [notes, setNotes] = useState('');
  const [lignes, setLignes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    commandeService.getAll().then(res => setCommandes(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (commandeId) {
      commandeService.getById(commandeId).then(res => {
        const c = res.data;
        setSelectedCommande(c);
        setLignes((c.lignes || []).map(l => ({
          produitId: l.produitId || null,
          designation: l.designation,
          quantite: l.quantite,
          prixUnitaireHT: l.prixUnitaireHT,
          tauxTva: l.tauxTva,
          montantHT: Number(l.montantHT || 0),
          montantTva: Number(l.montantTva || 0),
          montantTTC: Number(l.montantTTC || 0),
        })));
      }).catch(() => {});
    } else {
      setSelectedCommande(null);
      setLignes([]);
    }
  }, [commandeId]);

  const updateLigne = (idx, field, val) => {
    setLignes(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      const l = updated[idx];
      if (field === 'quantite' || field === 'prixUnitaireHT' || field === 'tauxTva') {
        const qty = parseFloat(l.quantite) || 0;
        const prix = parseFloat(l.prixUnitaireHT) || 0;
        const tva = parseFloat(l.tauxTva) || 0;
        const ht = qty * prix;
        const tvaAmt = ht * tva / 100;
        updated[idx].montantHT = ht;
        updated[idx].montantTva = tvaAmt;
        updated[idx].montantTTC = ht + tvaAmt;
      }
      return updated;
    });
  };

  const addLigne = () => {
    setLignes(prev => [...prev, {
      produitId: null, designation: '', quantite: 1, prixUnitaireHT: '',
      tauxTva: 19, montantHT: 0, montantTva: 0, montantTTC: 0,
    }]);
  };

  const removeLigne = (idx) => {
    setLignes(prev => prev.filter((_, i) => i !== idx));
  };

  const totalHT  = lignes.reduce((s, l) => s + (l.montantHT  || 0), 0);
  const totalTva = lignes.reduce((s, l) => s + (l.montantTva || 0), 0);
  const totalTTC = lignes.reduce((s, l) => s + (l.montantTTC || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!commandeId) { setError('Veuillez sélectionner une commande.'); return; }
    if (lignes.length === 0) { setError('Ajoutez au moins une ligne.'); return; }
    for (const l of lignes) {
      if (!l.designation?.trim()) { setError('Chaque ligne doit avoir une désignation.'); return; }
      if (!l.quantite || Number(l.quantite) <= 0) { setError('Les quantités doivent être positives.'); return; }
      if (!l.prixUnitaireHT || Number(l.prixUnitaireHT) < 0) { setError('Vérifiez les prix unitaires.'); return; }
    }
    setSubmitting(true);
    try {
      const payload = {
        commandeId: Number(commandeId),
        dateLivraison: dateLivraison || null,
        notes: notes || null,
        lignes: lignes.map(l => ({
          produitId: l.produitId || null,
          designation: l.designation,
          quantite: Number(l.quantite),
          prixUnitaireHT: Number(l.prixUnitaireHT),
          tauxTva: Number(l.tauxTva),
        })),
      };
      const res = await bonLivraisonService.create(payload);
      toast.success(`Bon de livraison ${res.data.numero} créé avec succès !`);
      navigate(`/bons-livraison/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Erreur lors de la création.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">🚚 Nouveau Bon de Livraison</h1>
          {selectedCommande && (
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Commande : <strong>{selectedCommande.reference}</strong> — Client : <strong>{selectedCommande.client?.nom}</strong>
            </span>
          )}
        </div>
        <Link to="/bons-livraison" className="btn btn-secondary">← Retour</Link>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Informations générales</h3>
          <div className="form-grid">
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>
                Commande source <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <SearchableSelect
                value={commandeId}
                onChange={setCommandeId}
                options={commandes}
                valueKey="id"
                renderLabel={c => `${c.reference} — ${c.client?.nom || ''}`}
                placeholder="— Sélectionner une commande —"
                required
                disabled={!!commandeIdParam}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>
                Date de livraison
              </label>
              <input
                type="date"
                className="form-control"
                value={dateLivraison}
                onChange={e => setDateLivraison(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8 }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Notes</label>
              <textarea
                className="form-control"
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observations, instructions de livraison..."
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Lignes de livraison</h3>
            <button type="button" className="btn btn-secondary" onClick={addLigne} style={{ fontSize: '0.85rem' }}>
              + Ajouter une ligne
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th style={{ width: 80 }}>Qté</th>
                  <th style={{ width: 120 }}>PU HT</th>
                  <th style={{ width: 80 }}>TVA %</th>
                  <th style={{ width: 110 }}>Mont. HT</th>
                  <th style={{ width: 110 }}>Mont. TTC</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="text"
                        value={l.designation}
                        onChange={e => updateLigne(i, 'designation', e.target.value)}
                        placeholder="Désignation"
                        required
                        style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '0.9rem' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={l.quantite}
                        onChange={e => updateLigne(i, 'quantite', e.target.value)}
                        style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.001"
                        min={0}
                        value={l.prixUnitaireHT}
                        onChange={e => updateLigne(i, 'prixUnitaireHT', e.target.value)}
                        style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        value={l.tauxTva}
                        onChange={e => updateLigne(i, 'tauxTva', e.target.value)}
                        style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>{fmt(l.montantHT)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(l.montantTTC)}</td>
                    <td>
                      <button type="button" onClick={() => removeLigne(i)} title="Supprimer"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.1rem' }}>
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
                {lignes.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                      Aucune ligne — sélectionnez une commande ou ajoutez manuellement
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right', minWidth: 240 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
                <span>Total HT :</span><span>{fmt(totalHT)} TND</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
                <span>Total TVA :</span><span>{fmt(totalTva)} TND</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '1.1rem', fontWeight: 700, borderTop: '2px solid #e2e8f0', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                <span>Total TTC :</span><span style={{ color: '#4f46e5' }}>{fmt(totalTTC)} TND</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Link to="/bons-livraison" className="btn btn-secondary">Annuler</Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Création...' : '✅ Créer le bon de livraison'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BonLivraisonCreate;
