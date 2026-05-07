import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { vendeurService } from '../../services/vendeurService';

const VendeurForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { pays: 'Maroc', tauxCommission: 0, actif: true }
  });

  useEffect(() => {
    if (!isEdit) return;
    vendeurService.getById(id)
      .then(res => reset(res.data))
      .catch(() => toast.error('Erreur lors du chargement du vendeur.'))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    // Cast numeric fields
    data.tauxCommission = parseFloat(data.tauxCommission) || 0;
    try {
      if (isEdit) {
        await vendeurService.update(id, data);
        toast.success('Vendeur mis à jour avec succès !');
      } else {
        await vendeurService.create(data);
        toast.success('Vendeur créé avec succès !');
      }
      navigate('/vendeurs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isEdit ? '✏️ Modifier le vendeur' : '➕ Nouveau vendeur'}
          </h1>
        </div>
        <Link to="/vendeurs" className="btn btn-secondary">← Retour</Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid">

            {/* Nom */}
            <div className="form-group">
              <label>Nom *</label>
              <input
                {...register('nom', { required: 'Le nom est obligatoire' })}
                className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                placeholder="Ex: Bennani"
              />
              {errors.nom && <span className="error-text">{errors.nom.message}</span>}
            </div>

            {/* Prénom */}
            <div className="form-group">
              <label>Prénom *</label>
              <input
                {...register('prenom', { required: 'Le prénom est obligatoire' })}
                className={`form-control ${errors.prenom ? 'is-invalid' : ''}`}
                placeholder="Ex: Ahmed"
              />
              {errors.prenom && <span className="error-text">{errors.prenom.message}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email</label>
              <input
                {...register('email', {
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Email invalide' }
                })}
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="vendeur@entreprise.ma"
              />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </div>

            {/* Téléphone */}
            <div className="form-group">
              <label>Téléphone</label>
              <input
                {...register('telephone')}
                className="form-control"
                placeholder="+212 6xx xxx xxx"
              />
            </div>

            {/* Matricule */}
            <div className="form-group">
              <label>Matricule</label>
              <input
                {...register('matricule')}
                className="form-control"
                placeholder="Ex: VND-001"
              />
            </div>

            {/* Taux de commission */}
            <div className="form-group">
              <label>Taux de commission (%)</label>
              <input
                {...register('tauxCommission', {
                  min: { value: 0, message: 'Minimum 0%' },
                  max: { value: 100, message: 'Maximum 100%' }
                })}
                type="number"
                step="0.1"
                min="0"
                max="100"
                className={`form-control ${errors.tauxCommission ? 'is-invalid' : ''}`}
                placeholder="Ex: 5"
              />
              {errors.tauxCommission && (
                <span className="error-text">{errors.tauxCommission.message}</span>
              )}
            </div>

            {/* Adresse */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Adresse</label>
              <input
                {...register('adresse')}
                className="form-control"
                placeholder="123 Rue Mohammed V"
              />
            </div>

            {/* Ville */}
            <div className="form-group">
              <label>Ville</label>
              <input
                {...register('ville')}
                className="form-control"
                placeholder="Casablanca"
              />
            </div>

            {/* Pays */}
            <div className="form-group">
              <label>Pays</label>
              <input {...register('pays')} className="form-control" />
            </div>

            {/* Statut actif */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  {...register('actif')}
                  type="checkbox"
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span>Vendeur actif</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : (isEdit ? '💾 Mettre à jour' : '✚ Créer le vendeur')}
            </button>
            <Link to="/vendeurs" className="btn btn-secondary">Annuler</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendeurForm;
