import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    // Si pas connecté, on redirige vers le login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
