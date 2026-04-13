import React, { useState, useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ChatAssistant from './ChatAssistant';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout">
      {/* ===== OVERLAY MOBILE ===== */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      {/* ===== BARRE LATÉRALE ===== */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">FacturaPro</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end onClick={closeSidebar}>
            <span className="nav-icon">📊</span>
            <span>Tableau de bord</span>
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <span className="nav-icon">👥</span>
            <span>Clients</span>
          </NavLink>
          <NavLink to="/produits" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <span className="nav-icon">📦</span>
            <span>Produits</span>
          </NavLink>
          <NavLink to="/factures" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <span className="nav-icon">🧾</span>
            <span>Factures</span>
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar} style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
              <span className="nav-icon">⚙️</span>
              <span style={{color: '#667eea', fontWeight: 'bold'}}>Administration</span>
            </NavLink>
          )}
        </nav>

        {/* Infos utilisateur + déconnexion */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.nom?.[0]}{user?.prenom?.[0]}</div>
            <div>
              <p className="user-name">{user?.nom} {user?.prenom}</p>
              <p className="user-role">{user?.role === 'ADMIN' ? '🔑 Administrateur' : '👤 Utilisateur'}</p>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <main className="main-content">
        {/* Barre de navigation mobile (visible uniquement sur small screens) */}
        <div className="mobile-topbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu">
            <span />
            <span />
            <span />
          </button>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>⚡ FacturaPro</span>
        </div>
        <Outlet />
      </main>

      {/* ===== ASSISTANT IA FLOTTANT ===== */}
      <ChatAssistant />
    </div>
  );
};

export default Layout;

