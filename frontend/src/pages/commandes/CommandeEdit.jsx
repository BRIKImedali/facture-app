import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { produitService } from '../../services/produitService';
import { commandeService } from '../../services/commandeService';
import SearchableSelect from '../../components/SearchableSelect';

const CommandeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [dateCommande, setDateCommande] = useState('');
  const [notes, setNotes] = useState('');
  const [remise, setRemise] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [lignes, setLignes] = useState([]);

  useEffect(() => {
    Promise.all([
      commandeService.getById(id),
      produitService.getActifs(),
    ]).then(([cRes, pRes]) => {
      const c = cRes.data;
      if (c.statut !== 'EN_ATTENTE') {
        toast.error(`Cette commande (${c.statut}) n'est plus modifiable.`);
        navigate(`/commandes/${id}`);
        return;
      }
      setDateCommande(c.dateCommande ? new Date(c.dateCommande).toISOString().split('T')[0] : '');
      setNotes(c.notes || '');
      setRemise(c.remise || 0);
      setPaymentMethod(c.paymentMethod || '');
      setLignes(c.lignes.map(l => ({
        produitId: l.produitId || '',
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaireHT: l.prixUnitaireHT,
        tauxTva: l.tauxTva,
      })));
      setProduits(pRes.data);
    }).catch(() => toast.error('Erreur de chargement.')).finally(() => setLoading(false));
  }, [id]);

  const handleProduitChange = (index, produitId) => {
    const produit = produits.find(p => p.id === parseInt(produitId));
    const updated = [...lignes];
    if (produit) {
      updated[index] = { ...updated[index], produitId: produit.id, designation: produit.nom, prixUnitaireHT: produit.prixHT, tauxTva: produit.tauxTva };
    } else {
      updated[index] = { ...updated[index], produitId: '' };
    }
    setLignes(updated);
  };

  const handleLigneChange = (index, field, value) => {
    const updated = [...lignes];
    updated[index] = { ...updated[index], [field]: value };
    setLignes(updated);
  };

  const addLigne = () => setLignes([...lignes, { produitId: '', designation: '', quantite: 1, prixUnitaireHT: '', tauxTva: 19 }]);
  const removeLigne = (index) => setLignes(lignes.filter((_, i) => i !== index));

  const calcLigne = (l) => {
    const ht = (parseFloat(l.quantite) || 0) * (parseFloat(l.prixUnitaireHT) || 0);
    const tva = ht * (parseFloat(l.tauxTva) || 0) / 100;
    return { ht, tva, ttc: ht + tva };
  };
  const totaux = lignes.reduce((acc, l) => {
    const t = calcLigne(l);
    return { ht: acc.ht + t.ht, tva: acc.tva + t.tva, ttc: acc.ttc + t.ttc };
  }, { ht: 0, tva: 0, ttc: 0 });
  const remisePct = parseFloat(remise) || 0;
  const htApresRemise = totaux.ht * (1 - remisePct / 100);
  const tvaApresRemise = totaux.tva * (1 - remisePct / 100);
  const ttcFinal = htApresRemise + tvaApresRemise;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lignes.some(l => !l.designation || !l.prixUnitaireHT)) {
      setError('Toutes les lignes doivent avoir une désignation et un prix.'); return;
    }
    setSubmitting(true); setError('');
    try {
      await commandeService.update(id, {
        dateCommande: dateCommande || null,
        notes,
        remise: remisePct > 0 ? remisePct : null,
        paymentMethod: paymentMethod || null,
        lignes: lignes.map(l => ({
          produitId: l.produitId ? parseInt(l.produitId) : null,
          designation: l.designation,
          quantite: parseInt(l.quantite),
          prixUnitaireHT: parseFloat(l.prixUnitaireHT),
          tauxTva: parseFloat(l.tauxTva),
        })),
      });
      toast.success('Commande mise à jour !');
      navigate(`/commandes/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour.');
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <h1 className="page-title">✏️ Modifier la commande</h1>
        <Link to={`/commandes/${id}`} className="btn btn-secondary">← Retour</Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: '#1e293b' }}>Informations générales</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Date de commande</label>
              <input type="date" value={dateCommande} onChange={e => setDateCommande(e.target.value)} className="form-control" />
            </div>
            <div className="form-group">
              <label>Remise globale (%)</label>
              <input type="number" min="0" max="100" step="0.5" value={remise}
                onChange={e => setRemise(e.target.value)} className="form-control" />
            </div>
            <div className="form-group">
              <label>Mode de paiement</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="form-control">
                <option value="">— Aucun / À définir —</option>
                <option value="ESPECES">Espèces</option>
                <option value="VIREMENT">Virement bancaire</option>
                <option value="CHEQUE">Chèque</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Notes / Remarques</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-control" rows={2}
                placeholder="Ex: Livraison urgente..." />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Lignes de commande</h3>
            <button type="button" className="btn btn-secondary" onClick={addLigne}>✚ Ajouter une ligne</button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Produit (optionnel)</th>
                <th>Désignation *</th>
                <th style={{ width: '70px' }}>Qté</th>
                <th style={{ width: '120px' }}>Prix HT</th>
                <th style={{ width: '80px' }}>TVA %</th>
                <th style={{ width: '100px' }}>Total TTC</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => {
                const { ttc } = calcLigne(l);
                return (
                  <tr key={i}>
                    <td>
                      <SearchableSelect
                        value={l.produitId}
                        onChange={val => handleProduitChange(i, val)}
                        options={produits}
                        valueKey="id"
                        labelKey="nom"
                        placeholder="— Manuel —"
                      />
                    </td>
                    <td><input value={l.designation} onChange={e => handleLigneChange(i, 'designation', e.target.value)} className="form-control" placeholder="Description..." required /></td>
                    <td><input type="number" min="1" value={l.quantite} onChange={e => handleLigneChange(i, 'quantite', e.target.value)} className="form-control" /></td>
                    <td><input type="number" step="0.01" min="0" value={l.prixUnitaireHT} onChange={e => handleLigneChange(i, 'prixUnitaireHT', e.target.value)} className="form-control" placeholder="0.00" required /></td>
                    <td>
                      <select value={l.tauxTva} onChange={e => handleLigneChange(i, 'tauxTva', e.target.value)} className="form-control">
                        <option value={0}>0% — Exonéré</option>
                        <option value={7}>7% — Taux réduit</option>
                        <option value={13}>13% — Taux intermédiaire</option>
                        <option value={19}>19% — Taux normal</option>
                      </select>
                    </td>
                    <td><strong>{ttc.toFixed(2)}</strong></td>
                    <td>
                      {lignes.length > 1 && (
                        <button type="button" onClick={() => removeLigne(i)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: '4px' }}>✕</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right', minWidth: 240 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
                <span>Total HT :</span><span>{totaux.ht.toFixed(2)} TND</span>
              </div>
              {remisePct > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#f59e0b' }}>
                    <span>Remise ({remisePct}%) :</span><span>-{(totaux.ht * remisePct / 100).toFixed(2)} TND</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
                    <span>HT après remise :</span><span>{htApresRemise.toFixed(2)} TND</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
                <span>Total TVA :</span><span>{tvaApresRemise.toFixed(2)} TND</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span>Total TTC :</span><span>{ttcFinal.toFixed(2)} TND</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
          </button>
          <Link to={`/commandes/${id}`} className="btn btn-secondary">Annuler</Link>
        </div>
      </form>
    </div>
  );
};

export default CommandeEdit;
