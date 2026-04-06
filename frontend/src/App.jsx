import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Pages publiques
import Login from './pages/Login';
import Register from './pages/Register';

// Pages privées
import Dashboard from './pages/Dashboard';
import ClientList from './pages/clients/ClientList';
import ClientForm from './pages/clients/ClientForm';
import ProduitList from './pages/produits/ProduitList';
import ProduitForm from './pages/produits/ProduitForm';
import FactureList from './pages/factures/FactureList';
import FactureCreate from './pages/factures/FactureCreate';
import FactureDetail from './pages/factures/FactureDetail';

function App() {
  return (
    <Router>
      <Toaster position="top-right" 
               toastOptions={{ 
                   style: { background: '#334155', color: '#fff', fontSize: '0.9rem', borderRadius: '8px' },
                   success: { style: { background: '#10b981' } },
                   error: { style: { background: '#ef4444' } }
               }} 
      />
      <AuthProvider>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Redirection racine → dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Routes privées — enveloppées dans le Layout avec la sidebar */}
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Clients */}
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/nouveau" element={<ClientForm />} />
            <Route path="/clients/:id/modifier" element={<ClientForm />} />

            {/* Produits */}
            <Route path="/produits" element={<ProduitList />} />
            <Route path="/produits/nouveau" element={<ProduitForm />} />
            <Route path="/produits/:id/modifier" element={<ProduitForm />} />

            {/* Factures */}
            <Route path="/factures" element={<FactureList />} />
            <Route path="/factures/nouvelle" element={<FactureCreate />} />
            <Route path="/factures/:id" element={<FactureDetail />} />
          </Route>

          {/* Fallback — toute URL inconnue → dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
