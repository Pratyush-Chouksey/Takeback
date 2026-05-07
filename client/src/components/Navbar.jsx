import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BRAND = '#2D6A4F';
const ACCENT = '#52B788';
const LOGOUT = '#dc2626';
const TEXT_MUTED = '#6b7280';
const BG = '#fff';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const show =
    location.pathname === '/borrow' ||
    location.pathname === '/return' ||
    location.pathname === '/enter-cup' ||
    location.pathname === '/scan';

  if (!show) return null;

  const shortName = user?.name ? String(user.name).slice(0, 14) : '';

  if (typeof document !== 'undefined' && !document.getElementById('tb-navbar')) {
    const el = document.createElement('style');
    el.id = 'tb-navbar';
    el.textContent = `
      .tb-navbar-logout:hover{border-color:${LOGOUT}!important;color:${LOGOUT}!important}
    `;
    document.head.appendChild(el);
  }

  return (
    <nav style={st.nav}>
      <Link to="/" style={st.logo}>🍃 Takeback</Link>

      {user ? (
        <div style={st.right}>
          {user.picture ? (
            <img src={user.picture} alt="" style={st.avatar} referrerPolicy="no-referrer" />
          ) : null}
          <span style={st.name}>{shortName}</span>
          <span style={st.walletBadge}>Rs. {user.wallet}</span>
          <button className="tb-navbar-logout" style={st.logoutBtn} onClick={logout}>Logout</button>
        </div>
      ) : (
        <div style={st.right} />
      )}
    </nav>
  );
}

const st = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', height: 60, background: BG,
    borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 100,
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    boxSizing: 'border-box',
  },
  logo: {
    fontSize: '1.3rem', fontWeight: 900, color: BRAND,
    textDecoration: 'none', letterSpacing: '-0.5px',
  },
  right: {
    display: 'flex', alignItems: 'center', gap: 12,
    fontSize: '0.9rem', color: '#333',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    border: `2px solid ${ACCENT}`, objectFit: 'cover',
  },
  name: { fontWeight: 700, fontSize: 14, color: '#111827', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  walletBadge: {
    background: '#f0fdf4',
    color: BRAND,
    padding: '4px 14px',
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 0.1,
  },
  logoutBtn: {
    padding: '6px 12px',
    borderRadius: 10,
    border: `1.5px solid ${TEXT_MUTED}`,
    background: '#fff',
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
};
