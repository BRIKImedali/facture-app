import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { stockService }       from '../../services/stockService';
import { siteService }        from '../../services/siteService';
import { emplacementService } from '../../services/emplacementService';
import { produitService }     from '../../services/produitService';

const EMPTY = { produitId: '', siteId: '', emplacementId: '', quantite: 0, seuilMinimum: 0 };

export default function StockForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form,         setForm]         = useState(EMPTY);
  const [produits,     setProduits]     = useState([]);
  const [sites,        setSites]        = useState([]);
  const [emplacements, setEmplacements] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [prR, siR, emR] = await Promise.all([
          produitService.getActifs(),
          siteService.getAll(),
          emplacementService.getAll(),
        ]);
        setProduits(prR.data);
        setSites(siR.data);
        setEmplacements(emR.data);

        if (isEdit) {
          const sRes = await stockService.getById(id);
          const s = sRes.data;
          setForm({
            produitId: String(s.produitId),
            siteId: String(s.siteId),
            emplacementId: s.emplacementId ? String(s.emplacementId) : '',
            quantite: s.quantite,
            seuilMinimum: s.seuilMinimum
          });
        }
      } catch {
        toast.error('Erreur lors du chargement');
        navigate('/stock');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit, navigate]);

  const filteredEmplacements = form.siteId
    ? emplacements.filter(e => String(e.siteId) === form.siteId)
    : emplacements;

  const hc = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.produitId) { toast.error('Produit obligatoire'); return; }
    if (!form.siteId)    { toast.error('Site obligatoire'); return; }
    setSaving(true);
    try {
      const payload = {
        produitId: Number(form.produitId),
        siteId: Number(form.siteId),
        emplacementId: form.emplacementId ? Number(form.emplacementId) : null,
        quantite: Number(form.quantite),
        seuilMinimum: Number(form.seuilMinimum)
      };
      isEdit
        ? await stockService.update(id, payload)
        : await stockService.create(payload);
      toast.success(isEdit ? 'Stock mis à jour' : 'Stock créé');
      navigate('/stock');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Chargement…</div>;

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '✏️ Modifier le stock' : '🗄️ Nouveau stock'}</h1>
        <Link to="/stock" className="btn btn-secondary">← Retour</Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Produit *</label>
            <select className="form-control" name="produitId" value={form.produitId} onChange={hc} required disabled={isEdit}>
              <option value="">— Sélectionner —</option>
              {produits.map(p => <option key={p.id} value={String(p.id)}>{p.nom}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Site *</label>
            <select className="form-control" name="siteId" value={form.siteId} onChange={hc} required>
              <option value="">— Sélectionner —</option>
              {sites.map(s => <option key={s.id} value={String(s.id)}>{s.nom}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Emplacement</label>
            <select className="form-control" name="emplacementId" value={form.emplacementId} onChange={hc}>
              <option value="">— Aucun —</option>
              {filteredEmplacements.map(e => (
                <option key={e.id} value={String(e.id)}>
                  {e.zone}{e.rayon ? ` / ${e.rayon}` : ''}{e.etagere ? ` / ${e.etagere}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Quantité {isEdit && '(Utiliser Entrée/Sortie pour modifier le stock existant)'}</label>
              <input className="form-control" type="number" min="0" name="quantite" value={form.quantite} onChange={hc} disabled={isEdit} />
            </div>
            <div className="form-group">
              <label>Seuil minimum d'alerte</label>
              <input className="form-control" type="number" min="0" name="seuilMinimum" value={form.seuilMinimum} onChange={hc} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : isEdit ? '💾 Mettre à jour' : '✚ Créer'}
            </button>
            <Link to="/stock" className="btn btn-secondary">Annuler</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
