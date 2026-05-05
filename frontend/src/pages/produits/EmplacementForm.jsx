import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { emplacementService } from '../../services/emplacementService';
import { siteService }        from '../../services/siteService';

const EMPTY = { zone: '', rayon: '', etagere: '', siteId: '' };

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
          setForm({ zone: e.zone, rayon: e.rayon || '', etagere: e.etagere || '', siteId: String(e.siteId) });
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
            <select className="form-control" name="siteId" value={form.siteId} onChange={hc} required>
              <option value="">— Sélectionner un site —</option>
              {sites.map(s => (
                <option key={s.id} value={String(s.id)}>{s.nom} — {s.ville}</option>
              ))}
            </select>
          </div>

          <div className="form-grid">
            {[
              { label: 'Zone *',  name: 'zone',    required: true },
              { label: 'Rayon',   name: 'rayon'                   },
              { label: 'Étagère', name: 'etagere'                 },
            ].map(f => (
              <div className="form-group" key={f.name}>
                <label>{f.label}</label>
                <input
                  className="form-control"
                  name={f.name}
                  value={form[f.name] || ''}
                  onChange={hc}
                  required={f.required}
                  placeholder={f.label.replace(' *', '')}
                />
              </div>
            ))}
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
