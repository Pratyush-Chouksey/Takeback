import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={st.nav}>
      <Link to="/" style={st.logo}>Takeback 🍃</Link>
      {user && (
        <div style={st.right}>
          <span style={st.greeting}>Hi, {user.name}</span>
          <span style={st.wallet}>₹{user.wallet}</span>
          <button style={st.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
}

const st = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', height: 60, background: '#fff',
    borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100,
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    boxSizing: 'border-box',
  },
  logo: {
    fontSize: '1.3rem', fontWeight: 800, color: '#2D6A4F',
    textDecoration: 'none', letterSpacing: '-0.5px',
  },
  right: {
    display: 'flex', alignItems: 'center', gap: 14,
    fontSize: '0.9rem', color: '#333',
  },
  greeting: { fontWeight: 600, fontSize: 14 },
  wallet: {
    background: '#E8F5E9', color: '#1B4332',
    padding: '4px 14px', borderRadius: 20,
    fontWeight: 700, fontSize: '0.82rem',
  },
  logoutBtn: {
    padding: '5px 14px', borderRadius: 8,
    border: '1.5px solid #2D6A4F', background: '#fff',
    color: '#2D6A4F', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
  },
};
