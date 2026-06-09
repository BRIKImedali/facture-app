import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clientService } from '../../services/clientService';
import { produitService } from '../../services/produitService';
import { factureService } from '../../services/factureService';
import { tauxTvaService } from '../../services/tauxTvaService';
import { bonLivraisonService } from '../../services/bonLivraisonService';
import SearchableSelect from '../../components/SearchableSelect';

const fmt3 = (n) => Number(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 });

const FactureCreate = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('CLASSIQUE'); // 'CLASSIQUE' | 'GROUPEE_BL'

  // ── mode CLASSIQUE ──
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [tauxTvaList, setTauxTvaList] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [clientId, setClientId] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [remise, setRemise] = useState(0);
  const [lignes, setLignes] = useState([
    { produitId: '', designation: '', quantite: 1, prixUnitaireHT: '', tauxTva: 19 }
  ]);

  // ── mode GROUPEE_BL ──
  const [blStep, setBlStep] = useState(1); // 1=client, 2=select BLs, 3=preview
  const [blClientId, setBlClientId] = useState('');
  const [facturablesBls, setFacturablesBls] = useState([]);
  const [selectedBlIds, setSelectedBlIds] = useState([]);
  const [blDateEcheance, setBlDateEcheance] = useState('');
  const [blNotes, setBlNotes] = useState('');
  const [blPaymentMethod, setBlPaymentMethod] = useState('');
  const [blLoading, setBlLoading] = useState(false);

  useEffect(() => {
    Promise.all([clientService.getAll(), produitService.getActifs(), tauxTvaService.getAllActifs()])
      .then(([cRes, pRes, tRes]) => {
        setClients(cRes.data);
        setProduits(pRes.data);
        setTauxTvaList(tRes.data);
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          toast.error('Permissions insuffisantes pour charger les données (clients, produits, TVA)');
        } else {
          toast.error('Erreur lors du chargement des données');
        }
      });
  }, []);

  // ── Helpers mode GROUPEE_BL ──
  const loadFacturables = async (cId) => {
    if (!cId) return;
    setBlLoading(true);
    try {
      const res = await bonLivraisonService.getFacturables(cId);
      setFacturablesBls(res.data);
      setSelectedBlIds([]);
    } catch {
      toast.error('Erreur lors du chargement des BL facturables.');
    } finally {
      setBlLoading(false);
    }
  };

  const toggleBl = (blId) => {
    setSelectedBlIds(prev =>
      prev.includes(blId) ? prev.filter(x => x !== blId) : [...prev, blId]
    );
  };

  const selectedBls = facturablesBls.filter(bl => selectedBlIds.includes(bl.id));
  const blTotalHT  = selectedBls.reduce((s, bl) => s + Number(bl.totalHT  || 0), 0);
  const blTotalTva = selectedBls.reduce((s, bl) => s + Number(bl.totalTva || 0), 0);
  const blTotalTTC = selectedBls.reduce((s, bl) => s + Number(bl.totalTTC || 0), 0);

  const handleSubmitBL = async () => {
    if (selectedBlIds.length === 0) { toast.error('Sélectionnez au moins un BL.'); return; }
    setSubmitting(true);
    try {
      const res = await factureService.createFromBL({
        clientId: Number(blClientId),
        bonLivraisonIds: selectedBlIds,
        dateEcheance: blDateEcheance || null,
        notes: blNotes || null,
        paymentMethod: blPaymentMethod || null,
      });
      toast.success(`Facture groupée ${res.data.numero} créée !`);
      navigate(`/factures/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Erreur lors de la création.';
      toast.error(msg);
      setSubmitting(false);
    }
  };

  // Quand un produit est sélectionné dans une ligne, pré-remplit les champs
  const handleProduitChange = (index, produitId) => {
    const produit = produits.find(p => p.id === parseInt(produitId));
    const updated = [...lignes];
    if (produit) {
      updated[index] = {
        ...updated[index],
        produitId: produit.id,
        designation: produit.nom,
        prixUnitaireHT: produit.prixHT,
        tauxTva: produit.tauxTva,
      };
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

  // Calculs des totaux en temps réel
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
    if (!clientId) { setError('Veuillez sélectionner un client.'); return; }
    if (lignes.some(l => !l.designation || !l.prixUnitaireHT)) {
      setError('Toutes les lignes doivent avoir une désignation et un prix.'); return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        clientId: parseInt(clientId),
        dateEcheance: dateEcheance || null,
        notes,
        paymentMethod: paymentMethod || null,
        remise: remisePct > 0 ? remisePct : null,
        lignes: lignes.map(l => ({
          produitId: l.produitId ? parseInt(l.produitId) : null,
          designation: l.designation,
          quantite: parseInt(l.quantite),
          prixUnitaireHT: parseFloat(l.prixUnitaireHT),
          tauxTva: parseFloat(l.tauxTva),
        })),
      };
      const res = await factureService.create(payload);
      toast.success('Facture créée avec succès !');
      navigate(`/factures/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
      setSubmitting(false);
    }
  };

  const thStyle = {
    padding: '0.75rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  };

  const inputBase = {
    width: '100%',
    border: '1.5px solid #e2e8f0',
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '0.9rem',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <h1 className="page-title">✚ Nouvelle facture</h1>
        <Link to="/factures" className="btn btn-secondary">← Retour</Link>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => { setMode('CLASSIQUE'); setError(''); }}
          style={{
            padding: '0.5rem 1.25rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            background: mode === 'CLASSIQUE' ? '#4f46e5' : 'white',
            color: mode === 'CLASSIQUE' ? 'white' : '#4f46e5',
            border: '2px solid #4f46e5',
          }}
        >
          🧾 Facture classique
        </button>
        <button
          type="button"
          onClick={() => { setMode('GROUPEE_BL'); setError(''); setBlStep(1); }}
          style={{
            padding: '0.5rem 1.25rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            background: mode === 'GROUPEE_BL' ? '#4f46e5' : 'white',
            color: mode === 'GROUPEE_BL' ? 'white' : '#4f46e5',
            border: '2px solid #4f46e5',
          }}
        >
          🚚 Facturer des bons de livraison
        </button>
      </div>

      {/* ── MODE GROUPEE_BL ── */}
      {mode === 'GROUPEE_BL' && (
        <div>
          {/* Stepper */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {['1. Client', '2. Sélection BL', '3. Confirmation'].map((s, i) => (
              <span key={i} style={{
                padding: '4px 12px', borderRadius: 20,
                background: blStep === i + 1 ? '#4f46e5' : blStep > i + 1 ? '#dcfce7' : '#f1f5f9',
                color: blStep === i + 1 ? 'white' : blStep > i + 1 ? '#15803d' : '#64748b',
                fontWeight: blStep === i + 1 ? 700 : 400,
              }}>{s}</span>
            ))}
          </div>

          {/* Étape 1 : Client */}
          {blStep === 1 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginTop: 0 }}>Étape 1 — Sélectionner le client</h3>
              <div style={{ maxWidth: 400 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Client *</label>
                <SearchableSelect
                  value={blClientId}
                  onChange={setBlClientId}
                  options={clients}
                  valueKey="id"
                  renderLabel={c => `${c.nom}${c.email ? ` (${c.email})` : ''}`}
                  required
                />
              </div>
              <div style={{ marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!blClientId}
                  onClick={() => { setBlStep(2); loadFacturables(blClientId); }}
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* Étape 2 : Sélection des BL */}
          {blStep === 2 && (
            <div>
              <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: 0 }}>Étape 2 — Bons de livraison facturables</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Client : <strong>{clients.find(c => String(c.id) === String(blClientId))?.nom}</strong>
                    {' — '}Sélectionnez les BL à consolider dans la facture.
                  </p>
                </div>
                {blLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
                ) : facturablesBls.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    Aucun bon de livraison livré et non facturé pour ce client.
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>
                          <input type="checkbox"
                            checked={selectedBlIds.length === facturablesBls.length}
                            onChange={e => setSelectedBlIds(e.target.checked ? facturablesBls.map(b => b.id) : [])}
                          />
                        </th>
                        <th>Numéro BL</th>
                        <th>Date création</th>
                        <th>Date livraison</th>
                        <th>Commande</th>
                        <th style={{ textAlign: 'right' }}>Total TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturablesBls.map(bl => (
                        <tr key={bl.id} style={{ cursor: 'pointer' }} onClick={() => toggleBl(bl.id)}>
                          <td><input type="checkbox" checked={selectedBlIds.includes(bl.id)} onChange={() => toggleBl(bl.id)} onClick={e => e.stopPropagation()} /></td>
                          <td style={{ fontWeight: 600, color: '#4f46e5' }}>{bl.numero}</td>
                          <td>{bl.dateCreation?.substring(0, 10) || '—'}</td>
                          <td>{bl.dateLivraison || '—'}</td>
                          <td>{bl.commandeReference || '—'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt3(bl.totalTTC)} TND</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {selectedBlIds.length > 0 && (
                  <div style={{ padding: '0.75rem 1.5rem', background: '#ede9fe', color: '#5b21b6', fontSize: '0.875rem', fontWeight: 600 }}>
                    {selectedBlIds.length} BL sélectionné(s) — Total TTC consolidé : {fmt3(blTotalTTC)} TND
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBlStep(1)}>← Retour</button>
                <button type="button" className="btn btn-primary" disabled={selectedBlIds.length === 0} onClick={() => setBlStep(3)}>
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 : Confirmation */}
          {blStep === 3 && (
            <div>
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Étape 3 — Prévisualisation et confirmation</h3>
                <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Date d'échéance</label>
                    <input type="date" value={blDateEcheance} onChange={e => setBlDateEcheance(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Mode de paiement</label>
                    <select value={blPaymentMethod} onChange={e => setBlPaymentMethod(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <option value="">— Non défini —</option>
                      <option value="ESPECES">Espèces</option>
                      <option value="VIREMENT">Virement</option>
                      <option value="CHEQUE">Chèque</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Notes</label>
                    <textarea rows={2} value={blNotes} onChange={e => setBlNotes(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, resize: 'vertical' }} />
                  </div>
                </div>

                <table className="data-table" style={{ marginBottom: '1rem' }}>
                  <thead>
                    <tr>
                      <th>BL</th>
                      <th>Date livraison</th>
                      <th>Commande</th>
                      <th style={{ textAlign: 'right' }}>HT</th>
                      <th style={{ textAlign: 'right' }}>TVA</th>
                      <th style={{ textAlign: 'right' }}>TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBls.map(bl => (
                      <tr key={bl.id}>
                        <td style={{ fontWeight: 600, color: '#4f46e5' }}>{bl.numero}</td>
                        <td>{bl.dateLivraison || '—'}</td>
                        <td>{bl.commandeReference || '—'}</td>
                        <td style={{ textAlign: 'right' }}>{fmt3(bl.totalHT)}</td>
                        <td style={{ textAlign: 'right' }}>{fmt3(bl.totalTva)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt3(bl.totalTTC)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right', minWidth: 280, borderTop: '2px solid #e2e8f0', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
                      <span>Total HT consolidé :</span><span>{fmt3(blTotalHT)} TND</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#64748b' }}>
                      <span>Total TVA :</span><span>{fmt3(blTotalTva)} TND</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '1.15rem', fontWeight: 700, color: '#4f46e5', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      <span>Total TTC :</span><span>{fmt3(blTotalTTC)} TND</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBlStep(2)}>← Retour</button>
                <button type="button" className="btn btn-primary" onClick={handleSubmitBL} disabled={submitting}>
                  {submitting ? 'Génération...' : '🧾 Générer la facture groupée'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE CLASSIQUE ── */}
      {mode === 'CLASSIQUE' && (
      <>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Informations générales */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: '#1e293b' }}>Informations générales</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Client *</label>
              <SearchableSelect
                value={clientId}
                onChange={setClientId}
                options={clients}
                valueKey="id"
                renderLabel={c => `${c.nom}${c.email ? ` (${c.email})` : ''}`}
                required
              />
            </div>
            <div className="form-group">
              <label>Date d'échéance</label>
              <input type="date" value={dateEcheance} onChange={e => setDateEcheance(e.target.value)} className="form-control" />
            </div>
            <div className="form-group">
              <label>Mode de paiement par défaut</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="form-control">
                <option value="">— Non défini —</option>
                <option value="ESPECES">Espèces</option>
                <option value="VIREMENT">Virement</option>
                <option value="CHEQUE">Chèque</option>
              </select>
            </div>
            <div className="form-group">
              <label>Remise globale (%)</label>
              <input type="number" min="0" max="100" step="0.5" value={remise}
                onChange={e => setRemise(e.target.value)} className="form-control"
                />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Notes / Conditions de paiement</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-control" rows={2}
                />
            </div>
          </div>
        </div>

        {/* Lignes de la facture */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Lignes de facturation</h3>
            <button type="button" className="btn btn-secondary" onClick={addLigne}>✚ Ajouter une ligne</button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '22%' }}>Produit (optionnel)</th>
                <th style={thStyle}>Désignation *</th>
                <th style={{ ...thStyle, width: '80px' }}>Qté</th>
                <th style={{ ...thStyle, width: '110px' }}>Prix HT</th>
                <th style={{ ...thStyle, width: '90px' }}>TVA %</th>
                <th style={{ ...thStyle, width: '110px' }}>Total TTC</th>
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
                      />
                    </td>
                    <td>
                      <input
                        value={l.designation}
                        onChange={e => handleLigneChange(i, 'designation', e.target.value)}
                        style={inputBase}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number" min="1"
                        value={l.quantite}
                        onChange={e => handleLigneChange(i, 'quantite', e.target.value)}
                        style={{ ...inputBase, textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number" step="0.01" min="0"
                        value={l.prixUnitaireHT}
                        onChange={e => handleLigneChange(i, 'prixUnitaireHT', e.target.value)}
                        style={{ ...inputBase, textAlign: 'right' }}
                        required
                      />
                    </td>
                    <td>
                      <select
                        value={l.tauxTva}
                        onChange={e => handleLigneChange(i, 'tauxTva', e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '6px', padding: '6px 4px', fontSize: '0.88rem', background: '#fff', cursor: 'pointer' }}
                      >
                        {tauxTvaList.length > 0
                          ? tauxTvaList.map(t => (
                              <option key={t.id} value={t.valeur}>
                                {t.valeur}% — {t.description}
                              </option>
                            ))
                          : (
                              <option value={l.tauxTva}>{l.tauxTva}%</option>
                            )
                        }
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

          {/* Totaux */}
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
            {submitting ? 'Création...' : '🧾 Créer la facture'}
          </button>
          <Link to="/factures" className="btn btn-secondary">Annuler</Link>
        </div>
      </form>
      </>
      )}
    </div>
  );
};

export default FactureCreate;
