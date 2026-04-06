import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { produitService } from '../../services/produitService';

const ProduitForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { tauxTva: 19, unite: 'unité', actif: true }
  });

  useEffect(() => {
    if (isEdit) {
      produitService.getById(id)
        .then(res => { reset(res.data); setLoading(false); })
        .catch(() => { toast.error('Produit introuvable.'); setLoading(false); });
    }
  }, [id]);

  const onSubmit = async (data) => {
    const payload = { ...data, prixHT: parseFloat(data.prixHT), tauxTva: parseFloat(data.tauxTva) };
    try {
      if (isEdit) {
        await produitService.update(id, payload);
        toast.success('Produit mis à jour avec succès !');
      } else {
        await produitService.create(payload);
        toast.success('Produit ajouté avec succès !');
      }
      navigate('/produits');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '✏️ Modifier le produit' : '➕ Nouveau produit'}</h1>
        <Link to="/produits" className="btn btn-secondary">← Retour</Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nom du produit / service *</label>
              <input {...register('nom', { required: 'Le nom est obligatoire' })}
                className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                placeholder="Ex: Développement web" />
              {errors.nom && <span className="error-text">{errors.nom.message}</span>}
            </div>

            <div className="form-group">
              <label>Référence</label>
              <input {...register('reference')} className="form-control" placeholder="PROD-001" />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea {...register('description')} className="form-control" rows={3}
                placeholder="Description du produit ou service..." />
            </div>

            <div className="form-group">
              <label>Prix HT (TND) *</label>
              <input {...register('prixHT', { required: 'Le prix est obligatoire', min: { value: 0, message: 'Prix invalide' } })}
                type="number" step="0.01" className={`form-control ${errors.prixHT ? 'is-invalid' : ''}`}
                placeholder="0.00" />
              {errors.prixHT && <span className="error-text">{errors.prixHT.message}</span>}
            </div>

            <div className="form-group">
              <label>Taux TVA (%)</label>
              <select {...register('tauxTva')} className="form-control">
                <option value="0">0% — Exonéré</option>
                <option value="7">7% — Taux réduit</option>
                <option value="13">13% — Taux intermédiaire</option>
                <option value="19">19% — Taux normal</option>
              </select>
            </div>

            <div className="form-group">
              <label>Unité</label>
              <select {...register('unite')} className="form-control">
                <option value="unité">Unité</option>
                <option value="heure">Heure</option>
                <option value="jour">Jour</option>
                <option value="mois">Mois</option>
                <option value="kg">Kg</option>
                <option value="forfait">Forfait</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <input type="checkbox" {...register('actif')} id="actif" />
              <label htmlFor="actif" style={{ marginBottom: 0 }}>Produit actif (disponible à la facturation)</label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : (isEdit ? '💾 Mettre à jour' : '✚ Créer le produit')}
            </button>
            <Link to="/produits" className="btn btn-secondary">Annuler</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProduitForm;
