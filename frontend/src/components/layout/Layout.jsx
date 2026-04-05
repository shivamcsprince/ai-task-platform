import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: <GridIcon /> },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`layout ${collapsed ? 'layout--collapsed' : ''}`}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <span className="logo-icon">⚡</span>
            {!collapsed && <span className="logo-text">TaskFlow</span>}
          </div>
          <button
            className="sidebar__toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            {!collapsed && (
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-email">{user?.email}</span>
              </div>
            )}
          </div>
          <button className="sidebar__logout" onClick={handleLogout} title="Sign out">
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
