import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  LogOut,
  ShieldCheck,
  UserCheck,
  Briefcase,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

const Sidebar = ({ isOpen, isCollapsed, onClose }) => {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ name: 'Employees', path: '/employees', icon: Users }] : []),
    { name: 'Projects', path: '/projects', icon: FolderKanban },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="sidebar-backdrop"
        />
      )}

      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div
          style={{
            padding: isCollapsed ? '1.25rem 0.5rem' : '1.35rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            minHeight: '70px',
          }}
        >
          {!isCollapsed ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '5px',
                    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.35)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={logoImg}
                    alt="Reliable Solution Logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '1.025rem',
                      letterSpacing: '-0.02em',
                      color: '#ffffff',
                      lineHeight: 1.2,
                    }}
                  >
                    Reliable
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: '#f97316',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Solution
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="mobile-close-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'none',
                  padding: '0.4rem',
                }}
                title="Close Menu"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 12px rgba(0, 0, 0, 0.35)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
              }}
              title="Reliable Solution"
            >
              <img
                src={logoImg}
                alt="RS"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav
          style={{
            padding: isCollapsed ? '1.25rem 0.5rem' : '1.25rem 0.75rem',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          {!isCollapsed && (
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#64748b',
                padding: '0.35rem 0.75rem',
                letterSpacing: '0.08em',
              }}
            >
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth <= 768) onClose();
                }}
                title={item.name}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: '0.85rem',
                  padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s ease',
                  background: isActive
                    ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  boxShadow: isActive ? '0 4px 14px rgba(79, 70, 229, 0.4)' : 'none',
                })}
              >
                <Icon size={20} />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Card & Role Indicator */}
        <div
          style={{
            padding: isCollapsed ? '0.75rem 0.5rem' : '1.15rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          {!isCollapsed ? (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '12px',
                padding: '0.9rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: isAdmin
                      ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                      : 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#ffffff',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.name || 'User'}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.72rem',
                      marginTop: '0.15rem',
                      color: isAdmin ? '#c7d2fe' : '#bae6fd',
                      fontWeight: 600,
                      maxWidth: '135px',
                    }}
                    title={user?.designation || (isAdmin ? 'Administrator' : 'Employee')}
                  >
                    {isAdmin ? (
                      <ShieldCheck size={12} style={{ flexShrink: 0 }} />
                    ) : (
                      <Briefcase size={12} style={{ flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user?.designation || (isAdmin ? 'Administrator' : 'Employee')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.22)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)')}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: isAdmin
                    ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                    : 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#ffffff',
                }}
                title={user?.name || 'User'}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <button
                onClick={logout}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
