import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { emplacementService } from '../../services/emplacementService';
import { siteService }        from '../../services/siteService';
import SearchableSelect from '../../components/SearchableSelect';

const EMPTY = { zone: '', description: '', siteId: '' };

export default function EmplacementForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form,    setForm]    = useState(EMPTY);
  const [sites,   setSites]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const sRes = await siteService.getAll();
        setSites(sRes.data);
        if (isEdit) {
          const eRes = await emplacementService.getById(id);
          const e = eRes.data;
          setForm({ zone: e.zone, description: e.description || '', siteId: String(e.siteId) });
        }
      } catch {
        toast.error('Erreur lors du chargement');
        navigate('/emplacement');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit, navigate]);

  const hc = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.zone?.trim()) { toast.error('La zone est obligatoire'); return; }
    if (!form.siteId)       { toast.error('Le site est obligatoire'); return; }
    setSaving(true);
    try {
      const payload = { ...form, siteId: Number(form.siteId) };
      isEdit
        ? await emplacementService.update(id, payload)
        : await emplacementService.create(payload);
      toast.success(isEdit ? 'Emplacement mis à jour' : 'Emplacement créé');
      navigate('/emplacement');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Chargement…</div>;

  return (
    <div style={{ maxWidth: 580 }}>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '✏️ Modifier l\'emplacement' : '📍 Nouvel emplacement'}</h1>
        <Link to="/emplacement" className="btn btn-secondary">← Retour</Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Site *</label>
            <SearchableSelect
              value={form.siteId}
              onChange={val => setForm(f => ({ ...f, siteId: val !== '' ? String(val) : '' }))}
              options={sites}
              valueKey="id"
              renderLabel={s => `${s.nom} — ${s.ville}`}
              placeholder="— Sélectionner un site —"
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Zone *</label>
              <input
                className="form-control"
                name="zone"
                value={form.zone || ''}
                onChange={hc}
                required
                placeholder="Zone"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea
                className="form-control"
                name="description"
                value={form.description || ''}
                onChange={hc}
                placeholder="Ajouter une description..."
                rows="3"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : isEdit ? '💾 Mettre à jour' : '✚ Créer'}
            </button>
            <Link to="/emplacement" className="btn btn-secondary">Annuler</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
