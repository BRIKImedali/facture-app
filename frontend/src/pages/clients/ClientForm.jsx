import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clientService } from '../../services/clientService';
import { categorieClientService } from '../../services/categorieClientService';

const ClientForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { pays: 'Maroc', categorieIds: [] }
  });

  const selectedCategories = watch('categorieIds') || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await categorieClientService.getAll();
        setCategories(catRes.data || []);
        
        if (isEdit) {
          const clientRes = await clientService.getById(id);
          const clientData = clientRes.data;
          // Extract category IDs if they exist
          if (clientData.categories) {
            clientData.categorieIds = clientData.categories.map(c => c.id);
          }
          reset(clientData);
        }
      } catch (err) {
        toast.error('Erreur lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit, reset]);

  const toggleCategory = (catId) => {
    const current = selectedCategories;
    if (current.includes(catId)) {
      setValue('categorieIds', current.filter(id => id !== catId), { shouldDirty: true });
    } else {
      setValue('categorieIds', [...current, catId], { shouldDirty: true });
    }
  };

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await clientService.update(id, data);
        toast.success('Client mis à jour avec succès !');
      } else {
        await clientService.create(data);
        toast.success('Client ajouté avec succès !');
      }
      navigate('/clients');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.nom || 'Une erreur est survenue.');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? '✏️ Modifier le client' : '➕ Nouveau client'}</h1>
        </div>
        <Link to="/clients" className="btn btn-secondary">← Retour</Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nom du client *</label>
              <input {...register('nom', { required: 'Le nom est obligatoire' })}
                className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                placeholder="Ex: ACME Sarl" />
              {errors.nom && <span className="error-text">{errors.nom.message}</span>}
            </div>

            <div className="form-group">
              <label>Email</label>
              <input {...register('email', { pattern: { value: /\S+@\S+\.\S+/, message: 'Email invalide' } })}
                type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="contact@client.ma" />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label>Téléphone</label>
              <input {...register('telephone')} className="form-control" placeholder="+212 6xx xxx xxx" />
            </div>

            <div className="form-group">
              <label>ICE (Numéro fiscal)</label>
              <input {...register('ice')} className="form-control" placeholder="000000000000000" />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Adresse</label>
              <input {...register('adresse')} className="form-control" placeholder="123 Rue Mohammed V" />
            </div>

            <div className="form-group">
              <label>Ville</label>
              <input {...register('ville')} className="form-control" placeholder="Casablanca" />
            </div>

            <div className="form-group">
              <label>Code postal</label>
              <input {...register('codePostal')} className="form-control" placeholder="20000" />
            </div>

            <div className="form-group">
              <label>Pays</label>
              <input {...register('pays')} className="form-control" />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Catégorie</label>
              {categories.length === 0 ? (
                <div className="form-control" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  Aucune catégorie disponible
                </div>
              ) : (
                <select
                  className="form-control"
                  multiple
                  size={Math.min(categories.length, 5)}
                  value={selectedCategories.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
                    setValue('categorieIds', selected, { shouldDirty: true });
                  }}
                  style={{ height: 'auto', padding: '4px' }}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
              )}
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                Maintenez <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '0 4px', fontSize: '0.75rem' }}>Ctrl</kbd> pour sélectionner plusieurs catégories
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : (isEdit ? '💾 Mettre à jour' : '✚ Créer le client')}
            </button>
            <Link to="/clients" className="btn btn-secondary">Annuler</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
