import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    try {
      await login(data.username, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects ou erreur serveur.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Connexion</h2>
        <p className="auth-subtitle">Accédez à votre espace facturation</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label>Identifiant (Username)</label>
            <input
              type="text"
              {...register('username', { required: "L'identifiant est requis" })}
              className={errors.username ? 'is-invalid' : ''}
              placeholder="votre identifiant"
            />
            {errors.username && <span className="error-text">{errors.username.message}</span>}
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: 'Le mot de passe est requis' })}
                className={errors.password ? 'is-invalid' : ''}
                placeholder="Votre mot de passe"
                style={{ paddingRight: '2.8rem', width: '100%', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: '#64748b',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>


      </div>
    </div>
  );
};

export default Login;
