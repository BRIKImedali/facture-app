import React, { useState, useContext, useMemo, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ChatAssistant from './ChatAssistant';
import './Layout.css';
import {
  Activity,
  BookUser,
  Store,
  Layers,
  SlidersHorizontal,
  Zap,
  Crown,
  KeyRound,
  CircleUser,
  LogOut,
} from 'lucide-react';

// ─── Menu item definitions ───────────────────────────────────────────────────
const ALL_NAV_ITEMS = [
  { key: 'dashboard', to: '/dashboard', icon: <Activity size={18} />, label: 'Tableau de bord', permission: null, end: true },
];

// ─── Accordion definition for "Contacts" ─────────────────────────────────────
const CONTACTS_ACCORDION = {
  key: 'contacts',
  icon: <BookUser size={18} />,
  label: 'Contacts',
  permission: 'CLIENTS',
  children: [
    { key: 'clients',     to: '/clients',            label: 'Clients',     end: true },
    { key: 'vendeurs',    to: '/vendeurs',            label: 'Vendeurs',    end: true },
    { key: 'categories',  to: '/categories-clients',  label: 'Catégories',  end: true },
    { key: 'devises',     to: '/devises',             label: 'Devises',     end: true },
  ],
};

// ─── Accordion definition for "Commerce" ─────────────────────────────────────
const COMMERCE_ACCORDION = {
  key: 'commerce',
  icon: <Store size={18} />,
  label: 'Commerce',
  permission: 'FACTURES',
  children: [
    { key: 'devis',           to: '/devis',          label: 'Devis',               end: true },
    { key: 'commandes',       to: '/commandes',      label: 'Commandes',           end: true },
    { key: 'bons-livraison',  to: '/bons-livraison', label: 'Bons de livraison',   end: true },
    { key: 'factures',        to: '/factures',       label: 'Factures',            end: true },
    { key: 'taux-tva',        to: '/taux-tva',       label: 'TVA',                 end: true },
  ],
};

// ─── Accordion definition for "Produits" ─────────────────────────────────────
const PRODUITS_ACCORDION = {
  key: 'produits',
  icon: <Layers size={18} />,
  label: 'Produits',
  permission: 'PRODUITS',
  children: [
    { key: 'produits-cat', to: '/produits',     label: 'Catalogue produits', end: true },
    { key: 'stock',        to: '/stock',        label: 'Stock',              end: true },
    { key: 'emplacement',  to: '/emplacement',  label: 'Emplacement',        end: true },
    { key: 'site',         to: '/site',         label: 'Site',               end: true },
    { key: 'unite',        to: '/unites',       label: 'Unités',             end: true },
  ],
};

// ─── Helper to check if a group contains the active path ─────────────────────
const groupContainsPath = (group, pathname) => {
  if (group.to && (group.end ? pathname === group.to : pathname.startsWith(group.to))) {
    return true;
  }
  if (group.children) {
    return group.children.some(child => groupContainsPath(child, pathname));
  }
  return false;
};

// ─── Recursive accordion item component ──────────────────────────────────────
const AccordionGroup = ({ group, depth = 1, closeSidebar }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (groupContainsPath(group, location.pathname)) {
      setOpen(true);
    }
  }, [location.pathname, group]);

  return (
    <div className={`accordion-group depth-${depth}`}>
      <button
        className={`accordion-trigger depth-${depth}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {group.icon && <span className="nav-icon">{group.icon}</span>}
        <span className="accordion-label">{group.label}</span>
      </button>

      <div className={`accordion-body ${open ? 'accordion-body--open' : ''}`}>
        <div className="accordion-inner">
          {group.children.map(child =>
            child.children ? (
              <AccordionGroup
                key={child.key}
                group={child}
                depth={depth + 1}
                closeSidebar={closeSidebar}
              />
            ) : (
              <NavLink
                key={child.key}
                to={child.to}
                end={child.end === true}
                className={({ isActive }) =>
                  `accordion-leaf ${isActive ? 'active' : ''}`
                }
                onClick={closeSidebar}
              >
                <span className="leaf-dot" />
                <span>{child.label}</span>
              </NavLink>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const isPrivileged = useMemo(() => {
    if (!user) return false;
    return user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  }, [user]);

  const showProduits = useMemo(() => {
    if (!user) return false;
    if (isPrivileged) return true;
    const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
    return userPerms.includes('PRODUITS');
  }, [user, isPrivileged]);

  const showContacts = useMemo(() => {
    if (!user) return false;
    if (isPrivileged) return true;
    const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
    return userPerms.includes('CLIENTS');
  }, [user, isPrivileged]);

  const showCommerce = useMemo(() => {
    if (!user) return false;
    if (isPrivileged) return true;
    const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
    return userPerms.includes('FACTURES');
  }, [user, isPrivileged]);

  const visibleNavItems = useMemo(() => {
    if (!user) return [];
    const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
    return ALL_NAV_ITEMS.filter(item => {
      if (item.permission === null) return true;
      if (isPrivileged) return true;
      return userPerms.includes(item.permission);
    });
  }, [user, isPrivileged]);

  const roleLabel = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN': return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Crown size={12} /> Super Admin</span>;
      case 'ADMIN':       return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><KeyRound size={12} /> Administrateur</span>;
      default:            return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CircleUser size={12} /> Utilisateur</span>;
    }
  };

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
          <span className="brand-icon"><Zap size={20} /></span>
          <span className="brand-name">FacturaPro</span>
        </div>

        <nav className="sidebar-nav">
          {/* ── Tableau de bord ── */}
          {visibleNavItems
            .filter(item => item.key === 'dashboard')
            .map(item => (
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

          {/* ── Contacts ── */}
          {showContacts && (
            <AccordionGroup group={CONTACTS_ACCORDION} depth={1} closeSidebar={closeSidebar} />
          )}

          {/* ── Produits ── */}
          {showProduits && (
            <AccordionGroup group={PRODUITS_ACCORDION} depth={1} closeSidebar={closeSidebar} />
          )}

          {/* ── Commerce ── */}
          {showCommerce && (
            <AccordionGroup group={COMMERCE_ACCORDION} depth={1} closeSidebar={closeSidebar} />
          )}

          {/* ── Administration (ADMIN / SUPER_ADMIN uniquement) ── */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
              style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}
            >
              <span className="nav-icon"><SlidersHorizontal size={18} /></span>
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
            <LogOut size={14} style={{ marginRight: 6 }} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <main className="main-content">
        <div className="mobile-topbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu">
            <span />
            <span />
            <span />
          </button>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Zap size={18} color="#4f46e5" /> FacturaPro
          </span>
        </div>
        <Outlet />
      </main>

      {/* ===== ASSISTANT IA FLOTTANT ===== */}
      <ChatAssistant />
    </div>
  );
};

export default Layout;
