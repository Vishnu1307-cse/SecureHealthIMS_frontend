import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';
import { Moon, Sun, LogOut, LayoutDashboard, Stethoscope, Menu, X as CloseIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useThemeContext();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <nav className="glass-panel" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 32px',
      height: '72px',
      position: 'sticky',
      top: '20px',
      zIndex: 1000,
      margin: '0 24px',
      border: '1px solid var(--glass-border)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(24px)',
      boxShadow: 'var(--shadow-premium)',
      borderRadius: 'var(--radius-full)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          background: 'var(--primary-glow)',
          padding: '8px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Stethoscope size={24} color="var(--primary)" />
        </div>
        <Link to="/" className="title-font" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Cura<span style={{ color: 'var(--primary)' }}>Link</span>
        </Link>
      </div>

      {/* Desktop Menu */}
      <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button
          onClick={toggleTheme}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--glass-stroke)',
            color: 'var(--text-primary)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          className="hover-scale"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {user.role === 'admin' && (
              <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 500 }}>
                <LayoutDashboard size={18} color="var(--primary)" />
                <span>Dashboard</span>
              </Link>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--text-primary)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--glass-stroke)'
            }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', color: 'white', fontSize: '12px', fontWeight: 700, justifyContent: 'center' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 500 }}>{user.name}</span>
            </div>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 77, 77, 0.1)',
                border: '1px solid rgba(255, 77, 77, 0.2)',
                color: 'var(--danger)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              className="hover-scale"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link to="/login" style={{
            padding: '10px 24px',
            background: 'var(--primary)',
            color: 'white',
            borderRadius: 'var(--radius-full)',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 8px 16px var(--primary-glow)',
            transition: 'all 0.3s ease'
          }} className="hover-scale">
            Get Started
          </Link>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <div className="mobile-only" style={{ display: 'none', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={toggleTheme}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--glass-stroke)',
            color: 'var(--text-primary)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={toggleMobileMenu}
          style={{
            background: 'var(--primary)',
            border: 'none',
            color: 'white',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isMobileMenuOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '90px',
          left: '24px',
          right: '24px',
          background: 'var(--bg-current)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '24px',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-premium)',
          backdropFilter: 'blur(20px)',
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-stroke)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.role}</div>
                </div>
              </div>
              
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-primary)' }}>
                  <LayoutDashboard size={20} color="var(--primary)" />
                  <span>Admin Dashboard</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 77, 77, 0.1)',
                  color: 'var(--danger)',
                  border: 'none',
                  textAlign: 'left',
                  width: '100%',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: '14px',
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '16px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '16px'
              }}
            >
              Get Started
            </Link>
          )}
        </div>
      )}

      {/* Media Query styles injected via style tag for simplicity in this component */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          nav {
            margin: 0 16px !important;
            padding: 0 20px !important;
            top: 10px !important;
          }
        }
      `}</style>
    </nav >
  );
};

export default Navbar;
