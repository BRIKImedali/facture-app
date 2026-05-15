import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import PermissionGuard from './components/PermissionGuard';
import Layout from './components/Layout';

// Initialiser i18n avant le reste de l'application
import './i18n/index.js';

// Pages publiques
import Login from './pages/Login';

// Pages privées existantes
import Dashboard from './pages/Dashboard';
import ClientList from './pages/clients/ClientList';
import ClientForm from './pages/clients/ClientForm';
import VendeurList from './pages/vendeurs/VendeurList';
import VendeurForm from './pages/vendeurs/VendeurForm';
import ProduitList from './pages/produits/ProduitList';
import ProduitForm from './pages/produits/ProduitForm';
import SitePage        from './pages/produits/SitePage';
import SiteForm        from './pages/produits/SiteForm';
import SiteDetail      from './pages/produits/SiteDetail';
import EmplacementPage from './pages/produits/EmplacementPage';
import EmplacementForm from './pages/produits/EmplacementForm';
import EmplacementDetail from './pages/produits/EmplacementDetail';
import StockPage       from './pages/produits/StockPage';
import StockForm       from './pages/produits/StockForm';
import StockDetail     from './pages/produits/StockDetail';
import FactureList from './pages/factures/FactureList';
import FactureCreate from './pages/factures/FactureCreate';
import FactureDetail from './pages/factures/FactureDetail';

// Module Administration — Layout et pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/users/UserManagement';
import RoleManagement from './components/admin/roles/RoleManagement';
import DatabaseConfig from './components/admin/database/DatabaseConfig';
import ErpConfig from './components/admin/erp/ErpConfig';
import AuditLog from './components/admin/audit/AuditLog';
import UnitesPage from './pages/admin/UnitesPage';
import CategoriesClientsPage from './pages/admin/CategoriesClientsPage';
import DevisesPage from './pages/admin/DevisesPage';
import TauxTvaPage from './pages/admin/TauxTvaPage';
import CommandeList from './pages/commandes/CommandeList';
import CommandeCreate from './pages/commandes/CommandeCreate';
import CommandeDetail from './pages/commandes/CommandeDetail';
import CommandeEdit from './pages/commandes/CommandeEdit';
import DevisList from './pages/devis/DevisList';
import DevisCreate from './pages/devis/DevisCreate';
import DevisDetail from './pages/devis/DevisDetail';
import DevisEdit from './pages/devis/DevisEdit';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1f2e', color: '#e2e8f0', fontSize: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' },
          success: { style: { background: '#10b981', color: 'white' } },
          error:   { style: { background: '#ef4444', color: 'white' } },
        }}
      />
      <AuthProvider>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login"    element={<Login />} />

          {/* Redirection racine → dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Routes privées — Layout principal de l'application */}
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard"                      element={<Dashboard />} />
            
            <Route path="/clients"                        element={<PermissionGuard permissions="CLIENT:READ" redirect><ClientList /></PermissionGuard>} />
            <Route path="/clients/nouveau"                element={<PermissionGuard permissions="CLIENT:CREATE" redirect><ClientForm /></PermissionGuard>} />
            <Route path="/clients/:id/modifier"           element={<PermissionGuard permissions="CLIENT:UPDATE" redirect><ClientForm /></PermissionGuard>} />

            {/* ── Sous-module Vendeurs ── */}
            <Route path="/vendeurs"                       element={<PermissionGuard permissions="CLIENT:READ" redirect><VendeurList /></PermissionGuard>} />
            <Route path="/vendeurs/nouveau"               element={<PermissionGuard permissions="CLIENT:CREATE" redirect><VendeurForm /></PermissionGuard>} />
            <Route path="/vendeurs/:id/modifier"          element={<PermissionGuard permissions="CLIENT:UPDATE" redirect><VendeurForm /></PermissionGuard>} />
            
            <Route path="/produits"                            element={<PermissionGuard permissions="PRODUIT:READ" redirect><ProduitList /></PermissionGuard>} />
            <Route path="/produits/nouveau"                    element={<PermissionGuard permissions="PRODUIT:CREATE" redirect><ProduitForm /></PermissionGuard>} />
            <Route path="/produits/:id/modifier"               element={<PermissionGuard permissions="PRODUIT:UPDATE" redirect><ProduitForm /></PermissionGuard>} />

            {/* ── Sous-modules Produits : Stock / Emplacement / Site ── */}
            {/* STOCK */}
            <Route path="/stock"               element={<PermissionGuard permissions="PRODUIT:READ"   redirect><StockPage /></PermissionGuard>} />
            <Route path="/stock/create"         element={<PermissionGuard permissions="PRODUIT:CREATE" redirect><StockForm /></PermissionGuard>} />
            <Route path="/stock/edit/:id"       element={<PermissionGuard permissions="PRODUIT:UPDATE" redirect><StockForm /></PermissionGuard>} />
            <Route path="/stock/:id"            element={<PermissionGuard permissions="PRODUIT:READ"   redirect><StockDetail /></PermissionGuard>} />

            {/* EMPLACEMENT */}
            <Route path="/emplacement"          element={<PermissionGuard permissions="PRODUIT:READ"   redirect><EmplacementPage /></PermissionGuard>} />
            <Route path="/emplacement/create"   element={<PermissionGuard permissions="PRODUIT:CREATE" redirect><EmplacementForm /></PermissionGuard>} />
            <Route path="/emplacement/edit/:id" element={<PermissionGuard permissions="PRODUIT:UPDATE" redirect><EmplacementForm /></PermissionGuard>} />
            <Route path="/emplacement/:id"      element={<PermissionGuard permissions="PRODUIT:READ"   redirect><EmplacementDetail /></PermissionGuard>} />

            {/* SITE */}
            <Route path="/site"                 element={<PermissionGuard permissions="PRODUIT:READ"   redirect><SitePage /></PermissionGuard>} />
            <Route path="/site/create"          element={<PermissionGuard permissions="PRODUIT:CREATE" redirect><SiteForm /></PermissionGuard>} />
            <Route path="/site/edit/:id"        element={<PermissionGuard permissions="PRODUIT:UPDATE" redirect><SiteForm /></PermissionGuard>} />
            <Route path="/site/:id"             element={<PermissionGuard permissions="PRODUIT:READ"   redirect><SiteDetail /></PermissionGuard>} />


            <Route path="/commandes"                      element={<PermissionGuard permissions="COMMANDE:READ" redirect><CommandeList /></PermissionGuard>} />
            <Route path="/commandes/nouvelle"             element={<PermissionGuard permissions="COMMANDE:CREATE" redirect><CommandeCreate /></PermissionGuard>} />
            <Route path="/commandes/:id"                  element={<PermissionGuard permissions="COMMANDE:READ" redirect><CommandeDetail /></PermissionGuard>} />
            <Route path="/commandes/:id/modifier"         element={<PermissionGuard permissions="COMMANDE:UPDATE" redirect><CommandeEdit /></PermissionGuard>} />

            <Route path="/devis"                          element={<PermissionGuard permissions="DEVIS:READ" redirect><DevisList /></PermissionGuard>} />
            <Route path="/devis/nouveau"                  element={<PermissionGuard permissions="DEVIS:CREATE" redirect><DevisCreate /></PermissionGuard>} />
            <Route path="/devis/:id"                      element={<PermissionGuard permissions="DEVIS:READ" redirect><DevisDetail /></PermissionGuard>} />
            <Route path="/devis/:id/modifier"             element={<PermissionGuard permissions="DEVIS:UPDATE" redirect><DevisEdit /></PermissionGuard>} />

            <Route path="/factures"                       element={<PermissionGuard permissions="FACTURE:READ" redirect><FactureList /></PermissionGuard>} />
            <Route path="/factures/nouvelle"              element={<PermissionGuard permissions="FACTURE:CREATE" redirect><FactureCreate /></PermissionGuard>} />
            <Route path="/factures/:id"                   element={<PermissionGuard permissions="FACTURE:READ" redirect><FactureDetail /></PermissionGuard>} />

            {/* ── Unités, Catégories, Devises & TVA (sous Layout principal) ── */}
            <Route path="/unites"              element={<PermissionGuard permissions="UNITE:READ" redirect><UnitesPage /></PermissionGuard>} />
            <Route path="/categories-clients" element={<PermissionGuard permissions="CATEGORIE:READ" redirect><CategoriesClientsPage /></PermissionGuard>} />
            <Route path="/devises"            element={<PermissionGuard permissions="DEVISE:READ" redirect><DevisesPage /></PermissionGuard>} />
            <Route path="/taux-tva"           element={<PermissionGuard permissions="TVA:READ" redirect><TauxTvaPage /></PermissionGuard>} />
          </Route>

          {/* ====================================================
              MODULE ADMINISTRATION — Routes admin séparées
              Layout propre avec sidebar admin + header admin
              Accessible uniquement aux utilisateurs authentifiés
              avec le rôle ADMIN ou permissions SYSTEM:CONFIG
             ==================================================== */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <PermissionGuard permissions="SYSTEM:CONFIG" redirect>
                  <AdminLayout />
                </PermissionGuard>
              </PrivateRoute>
            }
          >
            {/* Dashboard admin (route par défaut /admin) */}
            <Route index element={<AdminDashboard />} />

            {/* Gestion des utilisateurs */}
            <Route path="users"    element={<UserManagement />} />

            {/* Gestion des rôles et permissions */}
            <Route path="roles"    element={<RoleManagement />} />

            {/* Configuration base de données */}
            <Route path="database" element={<DatabaseConfig />} />



            {/* Intégration ERP */}
            <Route path="erp"      element={<ErpConfig />} />

            {/* Historique / Audit */}
            <Route path="audit"    element={<AuditLog />} />
          </Route>

          {/* Fallback — toute URL inconnue → dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
