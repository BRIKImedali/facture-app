import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { siteService } from '../../services/siteService';

const EMPTY = { nom: '', adresse: '', ville: '', codePostal: '', pays: 'France', responsable: '', telephone: '' };

export default function SiteForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    siteService.getById(id)
      .then(res => setForm(res.data))
      .catch(() => { toast.error('Site introuvable'); navigate('/site'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const hc = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nom?.trim())   { toast.error('Le nom est obligatoire'); return; }
    if (!form.ville?.trim()) { toast.error('La ville est obligatoire'); return; }
    setSaving(true);
    try {
      isEdit
        ? await siteService.update(id, form)
        : await siteService.create(form);
      toast.success(isEdit ? 'Site mis à jour' : 'Site créé');
      navigate('/site');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Chargement…</div>;

  const fields = [
    { label: 'Nom *',       name: 'nom',         required: true },
    { label: 'Adresse',     name: 'adresse'                      },
    { label: 'Ville *',     name: 'ville',       required: true },
    { label: 'Code postal', name: 'codePostal'                   },
    { label: 'Pays',        name: 'pays'                         },
    { label: 'Responsable', name: 'responsable'                  },
    { label: 'Téléphone',   name: 'telephone'                    },
  ];

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '✏️ Modifier le site' : '🏭 Nouveau site'}</h1>
        <Link to="/site" className="btn btn-secondary">← Retour à la liste</Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {fields.map(f => (
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
              {saving ? 'Enregistrement…' : isEdit ? '💾 Mettre à jour' : '✚ Créer le site'}
            </button>
            <Link to="/site" className="btn btn-secondary">Annuler</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
