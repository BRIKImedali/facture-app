import React, { useState, useContext, useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ChatAssistant from './ChatAssistant';
import './Layout.css';

// ─── Menu item definitions ───────────────────────────────────────────────────
// permission: null  → always visible to everyone
// permission: 'X'   → visible only when user.permissions includes 'X'
//                     (SUPER_ADMIN bypasses all permission checks)
const ALL_NAV_ITEMS = [
  { key: 'dashboard', to: '/dashboard',  icon: '📊', label: 'Tableau de bord', permission: null,        end: true  },
  { key: 'clients',   to: '/clients',    icon: '👥', label: 'Clients',          permission: 'CLIENTS',   end: false },
  { key: 'produits',  to: '/produits',   icon: '📦', label: 'Produits',         permission: 'PRODUITS',  end: false },
  { key: 'factures',  to: '/factures',   icon: '🧾', label: 'Factures',         permission: 'FACTURES',  end: false },
];

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  // ─── RBAC filtering ────────────────────────────────────────────────────────
  const visibleNavItems = useMemo(() => {
    if (!user) return [];
    const isPrivileged = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const userPerms = Array.isArray(user.permissions) ? user.permissions : [];

    return ALL_NAV_ITEMS.filter(item => {
      if (item.permission === null) return true;          // always show
      if (isPrivileged) return true;                      // ADMIN & SUPER_ADMIN see all
      return userPerms.includes(item.permission);         // match permission
    });
  }, [user]);

  // ─── Role label helper ─────────────────────────────────────────────────────
  const roleLabel = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':  return '👑 Super Admin';
      case 'ADMIN':        return '🔑 Administrateur';
      default:             return '👤 Utilisateur';
    }
  };

  // User initials for avatar
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : `${user?.nom?.[0] ?? ''}${user?.prenom?.[0] ?? ''}`;

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
          {/* ── Filtered menu items ── */}
          {visibleNavItems.map(item => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* ── Admin panel (ADMIN / SUPER_ADMIN only) ── */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
              style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}
            >
              <span className="nav-icon">⚙️</span>
              <span style={{ color: '#667eea', fontWeight: 'bold' }}>Administration</span>
            </NavLink>
          )}
        </nav>

        {/* Infos utilisateur + déconnexion */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div>
              <p className="user-name">{user?.nom ?? user?.username}</p>
              <p className="user-role">{roleLabel()}</p>
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

