// components/admin/AdminLayout.jsx — Layout principal du module admin
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/admin.css';

// Icônes (emoji ou vous pouvez remplacer par react-icons)
const NAV_ITEMS = [
  { path: '/admin',          label: 'nav.dashboard', icon: '📊', exact: true },
  { path: '/admin/users',    label: 'nav.users',     icon: '👥' },
  { path: '/admin/roles',    label: 'nav.roles',     icon: '🔐' },
  { path: '/admin/unites',   label: 'Unités',        icon: '📏' },
  { path: '/admin/categories-clients', label: 'Catégories', icon: '🏷️' },
  { path: '/admin/database', label: 'nav.database',  icon: '🗄️' },
  { path: '/admin/erp',      label: 'nav.erp',       icon: '🔗' },
  { path: '/admin/audit',    label: 'nav.audit',     icon: '📋' },
];

/**
 * Layout principal du module d'administration.
 * Structure : Sidebar fixe + Header + Contenu dynamique via <Outlet />.
 */
const AdminLayout = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Récupérer l'utilisateur connecté
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() || 'AD';

  // Fermer le menu mobile lors de la navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  // Titre de la page active
  const activeNav = NAV_ITEMS.find(item =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  return (
    <div className={`admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* ===== SIDEBAR ===== */}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚙️</div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span>Admin</span> Panel
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {!collapsed && <div className="sidebar-section-title">Menu</div>}
          {NAV_ITEMS.map(item => {
            // Filtrer l'affichage selon les permissions pour les nouveaux menus
            const userPerms = user.permissions || [];
            if (item.path === '/admin/unites' && !userPerms.includes('UNITE:READ') && user.role !== 'ADMIN') return null;
            if (item.path === '/admin/categories-clients' && !userPerms.includes('CATEGORIE:READ') && user.role !== 'ADMIN') return null;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
                title={collapsed ? (item.label.startsWith('nav.') ? t(item.label) : item.label) : ''}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-nav-label">{item.label.startsWith('nav.') ? t(item.label) : item.label}</span>}
              </NavLink>
            );
          })}

          {/* Séparateur */}
          <div style={{ height: 1, background: 'var(--admin-border)', margin: '12px 16px' }} />

          {/* Retour à l'app */}
          <button
            className="sidebar-nav-item"
            onClick={() => navigate('/dashboard')}
            title={collapsed ? t('nav.back') : ''}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <span className="sidebar-nav-icon">↩️</span>
            {!collapsed && <span className="sidebar-nav-label">{t('nav.back')}</span>}
          </button>
        </nav>

        {/* Footer sidebar — toggle collapse */}
        <div className="sidebar-footer">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Étendre' : 'Réduire'}
          >
            {collapsed ? '→' : '← '}
            {!collapsed && <span>Réduire</span>}
          </button>
        </div>
      </aside>

      {/* ===== HEADER ===== */}
      <header className="admin-header">
        <div className="header-left">
          {/* Bouton hamburger mobile */}
          <button
            className="btn-icon"
            style={{ display: 'none' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >☰</button>

          <div>
            <div className="header-title">
              {activeNav ? (activeNav.label.startsWith('nav.') ? t(activeNav.label) : activeNav.label) : t('nav.admin')}
            </div>
          </div>
        </div>

        <div className="header-right">
          {/* Sélecteur de langue */}
          <div className="language-selector">
            <button
              className={`lang-btn ${i18n.language === 'fr' ? 'active' : ''}`}
              onClick={() => changeLanguage('fr')}
            >FR</button>
            <button
              className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
            >EN</button>
          </div>

          {/* Menu utilisateur */}
          <div className="user-menu" onClick={handleLogout} title="Se déconnecter">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-info-name">{user.prenom} {user.nom}</div>
              <div className="user-info-role">{user.role}</div>
            </div>
            <span style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>⏻</span>
          </div>
        </div>
      </header>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <main className="admin-main">
        <div className="admin-content">
          <Outlet />
        </div>
      </main>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'none'
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
