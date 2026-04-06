import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const { registerUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    try {
      await registerUser({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        password: data.password
      });
      navigate('/dashboard'); // Redirection après succès
    } catch (err) {
      let errorMsg = "Erreur lors de l'inscription. Cet email est peut-être déjà utilisé.";
      if (err.response?.data) {
        if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (typeof err.response.data === 'object') {
          // Extraire les erreurs de validation envoyées par le backend (Map<String, String>)
          errorMsg = Object.values(err.response.data).join(' | ');
        }
      }
      setError(errorMsg);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Créer un compte</h2>
        <p className="auth-subtitle">Rejoignez-nous et simplifiez votre facturation</p>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-row">
            <div className="form-group half-width">
              <label>Nom</label>
              <input 
                type="text" 
                {...register('nom', { required: 'Le nom est requis' })} 
                className={errors.nom ? 'is-invalid' : ''}
              />
              {errors.nom && <span className="error-text">{errors.nom.message}</span>}
            </div>
            
            <div className="form-group half-width">
              <label>Prénom</label>
              <input 
                type="text" 
                {...register('prenom', { required: 'Le prénom est requis' })} 
                className={errors.prenom ? 'is-invalid' : ''}
              />
              {errors.prenom && <span className="error-text">{errors.prenom.message}</span>}
            </div>
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              {...register('email', { required: "L'email est requis" })} 
              className={errors.email ? 'is-invalid' : ''}
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>
          
          <div className="form-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              {...register('password', { required: 'Le mot de passe est requis', minLength: { value: 8, message: 'Minimum 8 caractères' } })} 
              className={errors.password ? 'is-invalid' : ''}
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>
          
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Inscription..." : "S'inscrire"}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
