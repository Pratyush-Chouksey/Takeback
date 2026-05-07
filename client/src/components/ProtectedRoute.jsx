import { useEffect, useMemo, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useLocation, useNavigate } from 'react-router-dom';
import { googleAuth } from '../api';
import { useAuth } from '../context/AuthContext';

const BRAND = '#2D6A4F';
const BRAND_LIGHT = '#E8F5E9';

function getRedirectTarget(location) {
  return `${location.pathname}${location.search}${location.hash || ''}`;
}

function getCupIdFromSearch(search) {
  const sp = new URLSearchParams(search || '');
  return sp.get('cupId');
}

export default function ProtectedRoute({ children }) {
  const { user, login, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const intendedUrl = useMemo(() => getRedirectTarget(location), [location]);
  const cupId = useMemo(() => getCupIdFromSearch(location.search), [location.search]);

  useEffect(() => {
    // Visiting /borrow without a cupId should send users to enter-cup,
    // regardless of auth state (no login gate needed).
    if (location.pathname === '/borrow' && !cupId) {
      navigate('/enter-cup', { replace: true });
    }
  }, [location.pathname, cupId, navigate]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      sessionStorage.setItem('takeback_redirect', intendedUrl);
    }
  }, [loading, user, intendedUrl]);

  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById('tb-protected')) return;
    const el = document.createElement('style');
    el.id = 'tb-protected';
    el.textContent = `
      @keyframes tb-spin{to{transform:rotate(360deg)}}
      @keyframes tb-toast-in{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      button:hover:not(:disabled){opacity:.92}
    `;
    document.head.appendChild(el);
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    const credential = credentialResponse?.credential;
    if (!credential) return;

    try {
      const a = await googleAuth(credential);
      login(a.data.user, a.data.token);

      const redirect = sessionStorage.getItem('takeback_redirect');
      if (redirect) {
        if (redirect.startsWith('/borrow')) {
          // Lets BorrowPage auto-continue right after auth.
          sessionStorage.setItem('takeback_auto_proceed', '1');
        }
        sessionStorage.removeItem('takeback_redirect');
        navigate(redirect);
      } else if (location.pathname === '/borrow') {
        sessionStorage.setItem('takeback_auto_proceed', '1');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Sign in failed');
    }
  };

  if (loading) {
    return (
      <div style={st.page}>
        <div style={st.spinnerWrap}>
          <div style={st.spinner} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={st.page}>
        <div style={st.card}>
          <div style={st.logo}>Takeback 🍃</div>
          {cupId ? <div style={st.cupPill}>{cupId}</div> : null}
          <h2 style={st.h}>Sign in to continue</h2>

          {error ? <div style={st.err}>{error}</div> : null}

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed. Please try again.')}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
            />
          </div>

          <div style={st.sub}>We only access your name and email</div>
        </div>
      </div>
    );
  }

  return children;
}

const st = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', background: '#F8FAF9' },
  spinnerWrap: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 36, height: 36, border: `3px solid ${BRAND_LIGHT}`, borderTopColor: BRAND, borderRadius: '50%', animation: 'tb-spin 0.8s linear infinite' },
  card: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderRadius: 20,
    padding: '36px 32px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: { fontSize: 24, fontWeight: 900, color: BRAND, letterSpacing: -0.5, marginBottom: 8 },
  cupPill: { fontFamily: 'monospace', fontWeight: 700, background: '#E8F5E9', color: BRAND, padding: '6px 20px', borderRadius: 20, marginBottom: 10 },
  h: { margin: '8px 0 14px', fontSize: 20, fontWeight: 800, color: '#1a1a1a', textAlign: 'center' },
  sub: { marginTop: 12, fontSize: 12, color: '#bbb', textAlign: 'center' },
  err: { width: '100%', padding: '10px 16px', background: '#FEF2F2', color: '#DC2626', borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 12, border: '1px solid #FECACA', textAlign: 'center' },
};

