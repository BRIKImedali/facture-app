import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clientService } from '../../services/clientService';
import { categorieClientService } from '../../services/categorieClientService';
import { vendeurService } from '../../services/vendeurService';
import { deviseService } from '../../services/deviseService';
import SearchableSelect from '../../components/SearchableSelect';

const ClientForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [vendeurs, setVendeurs] = useState([]);
  const [devises, setDevises] = useState([]);

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { pays: 'Maroc', categorieId: '', vendeurId: '', deviseId: '' }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, vendRes, devRes] = await Promise.all([
          categorieClientService.getAll(),
          vendeurService.getActifs(),
          deviseService.getAll(),
        ]);
        setCategories(catRes.data || []);
        setVendeurs(vendRes.data || []);
        setDevises(devRes.data || []);

        if (isEdit) {
          const clientRes = await clientService.getById(id);
          const clientData = clientRes.data;
          // Extract category ID if it exists
          if (clientData.categorieId) {
            clientData.categorieId = clientData.categorieId;
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

  const onSubmit = async (data) => {
    try {
      // Convert empty strings to null for optional FK fields
      const payload = {
        ...data,
        categorieId: data.categorieId ? Number(data.categorieId) : null,
        vendeurId: data.vendeurId ? Number(data.vendeurId) : null,
        deviseId: data.deviseId ? Number(data.deviseId) : null,
      };
      if (isEdit) {
        await clientService.update(id, payload);
        toast.success('Client mis à jour avec succès !');
      } else {
        await clientService.create(payload);
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
            {/* ── Nom ── */}
            <div className="form-group">
              <label>Nom du client *</label>
              <input {...register('nom', { required: 'Le nom est obligatoire' })}
                className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                placeholder="Ex: ACME Sarl" />
              {errors.nom && <span className="error-text">{errors.nom.message}</span>}
            </div>

            {/* ── Email ── */}
            <div className="form-group">
              <label>Email</label>
              <input {...register('email', { pattern: { value: /\S+@\S+\.\S+/, message: 'Email invalide' } })}
                type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="contact@client.ma" />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </div>

            {/* ── Téléphone ── */}
            <div className="form-group">
              <label>Téléphone</label>
              <input {...register('telephone')} className="form-control" placeholder="+212 6xx xxx xxx" />
            </div>

            {/* ── ICE ── */}
            <div className="form-group">
              <label>ICE (Numéro fiscal)</label>
              <input {...register('ice')} className="form-control" placeholder="000000000000000" />
            </div>

            {/* ── Adresse ── */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Adresse</label>
              <input {...register('adresse')} className="form-control" placeholder="123 Rue Mohammed V" />
            </div>

            {/* ── Ville ── */}
            <div className="form-group">
              <label>Ville</label>
              <input {...register('ville')} className="form-control" placeholder="Casablanca" />
            </div>

            {/* ── Code postal ── */}
            <div className="form-group">
              <label>Code postal</label>
              <input {...register('codePostal')} className="form-control" placeholder="20000" />
            </div>

            {/* ── Pays ── */}
            <div className="form-group">
              <label>Pays</label>
              <input {...register('pays')} className="form-control" />
            </div>

            {/* ── Catégorie ── */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Catégorie</label>
              {categories.length === 0 ? (
                <div className="form-control" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  Aucune catégorie disponible
                </div>
              ) : (
                <Controller
                  name="categorieId"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value || ''}
                      onChange={field.onChange}
                      options={categories}
                      valueKey="id"
                      labelKey="nom"
                      placeholder="— Sélectionner une catégorie —"
                    />
                  )}
                />
              )}
            </div>

            {/* ── Vendeur (optionnel) ── */}
            <div className="form-group">
              <label>Vendeur <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optionnel)</span></label>
              <Controller
                name="vendeurId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    options={vendeurs}
                    valueKey="id"
                    renderLabel={v => `${v.prenom} ${v.nom}${v.matriculeInterne ? ` (${v.matriculeInterne})` : ''}`}
                    placeholder="— Aucun vendeur —"
                  />
                )}
              />
            </div>

            {/* ── Devise (optionnel) ── */}
            <div className="form-group">
              <label>Devise <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optionnel)</span></label>
              <Controller
                name="deviseId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    options={devises}
                    valueKey="id"
                    renderLabel={d => `${d.symbole} — ${d.code} — ${d.nom}`}
                    placeholder="— Aucune devise —"
                  />
                )}
              />
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
