import React from 'react';
import { Menu } from 'lucide-react';

const Navbar = ({ onToggleSidebar, title = 'Overview' }) => {
  return (
    <header className="app-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <button
          onClick={onToggleSidebar}
          title="Toggle Navigation Menu"
          className="navbar-hamburger-btn"
        >
          <Menu size={20} />
        </button>
      </div>

      <div />
    </header>
  );
};

export default Navbar;
