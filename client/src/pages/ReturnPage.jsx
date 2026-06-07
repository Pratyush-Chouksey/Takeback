import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { googleAuth, returnCup } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ReturnPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCupId = searchParams.get('cupId') || '';

  const [cupId, setCupId] = useState(urlCupId);
  const [processing, setProcessing] = useState(false);
  const [verified, setVerified] = useState(false);
  const [returnResult, setReturnResult] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async (credentialResponse) => {
    setError(''); setProcessing(true);
    try {
      const res = await googleAuth(credentialResponse.credential);
      login(res.data.user, res.data.token);
      const redirect = sessionStorage.getItem('takeback_redirect');
      if (redirect) { sessionStorage.removeItem('takeback_redirect'); navigate(redirect); return; }
      setVerified(true);
      setIsNewUser(res.data.isNewUser);
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
    } finally { setProcessing(false); }
  };

  const handleReturn = async () => {
    if (!cupId.trim()) { setError('Please enter the Cup ID'); return; }
    setError(''); setProcessing(true);
    try {
      await returnCup(cupId.trim().toUpperCase());
      setReturnResult({ wallet: user?.wallet });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to return cup');
    } finally { setProcessing(false); }
  };

  // ── Success ──
  if (returnResult) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.iconCircle}>⏳</div>

          {isNewUser ? (
            <>
              <h2 style={{ ...styles.heading, color: '#F59E0B' }}>Welcome to Takeback! 🎉</h2>
              <p style={{ ...styles.subtext, marginBottom: 12 }}>
                You've been registered! Your return request has been submitted.
              </p>
            </>
          ) : (
            <h2 style={{ ...styles.heading, color: '#F59E0B' }}>Return Request Submitted!</h2>
          )}

          <div style={{ ...styles.thankYouBox, background: '#FFFBEB', borderColor: '#FDE68A' }}>
            <span style={{ fontSize: '1.6rem' }}>📋</span>
            <p style={{ ...styles.thankYouText, color: '#92400E' }}>
              Our team will verify your cup shortly. <strong>₹50 will be credited</strong> to your wallet once verified.
            </p>
          </div>

          <div style={styles.thankYouBox}>
            <span style={{ fontSize: '1.6rem' }}>🌱</span>
            <p style={styles.thankYouText}>
              Thank you for helping the planet! Every reuse counts towards a greener future.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.returnIcon}>♻</div>
        <h2 style={styles.heading}>Return a cup, earn ₹50!</h2>
        <p style={styles.subtext}>
          Drop off any Takeback cup and get ₹50 added to your wallet — even if it's not yours.
        </p>

        {error && <div style={styles.errorBox}>{error}</div>}

        {!verified && !user ? (
          <>
            <div style={styles.stepBadge}>Step 1 — Verify your identity</div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Sign in to continue</p>
              {processing ? (
                <div style={{ padding: 16 }}>
                  <div style={styles.spinner} />
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => setError('Google login failed. Please try again.')}
                  theme="outline" size="large" text="continue_with" shape="rectangular"
                />
              )}
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>We only access your name and email</p>
            </div>
          </>
        ) : (
          <>
            <div style={styles.verifiedBanner}>
              {user?.picture && <img src={user.picture} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
              <span>✓</span> Signed in as <strong>{user?.name}</strong>
              {user?.wallet != null && (
                <span style={styles.walletInline}>₹{user.wallet}</span>
              )}
            </div>

            <div style={styles.stepBadge}>Step 2 — Identify the cup</div>

            <div style={styles.field}>
              <label style={styles.label}>Cup ID</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. CUP_001"
                value={cupId}
                onChange={e => setCupId(e.target.value)}
              />
              {urlCupId && <p style={styles.autoFillHint}>Auto-filled from QR code</p>}
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', borderRadius: 12, opacity: processing ? 0.7 : 1, marginTop: 8 }}
              onClick={handleReturn}
              disabled={processing}
            >
              {processing ? 'Processing…' : 'Confirm Return'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────
const styles = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '32px 16px',
    background: 'var(--cream)',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    width: '100%', maxWidth: '420px',
    background: 'var(--white)',
    borderRadius: '20px',
    padding: '32px 28px',
    boxShadow: '0 8px 40px rgba(28,58,39,0.08), 0 1px 3px rgba(28,58,39,0.04)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  returnIcon: { fontSize: '2.4rem', marginBottom: '8px' },
  heading: {
    margin: '0 0 8px',
    fontSize: '1.4rem',
    color: 'var(--text-dark)',
    textAlign: 'center',
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
  },
  subtext: {
    margin: '0 0 24px',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--green-bright)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '14px',
    background: 'var(--green-pale)',
    padding: '4px 14px',
    borderRadius: '100px',
  },
  field: { width: '100%', marginBottom: '16px' },
  label: {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    color: 'var(--text-muted)', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  input: {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: '10px', fontSize: '1rem',
    outline: 'none', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    background: 'var(--white)', color: 'var(--text-dark)',
    fontFamily: "'Inter', sans-serif",
  },
  errorBox: {
    width: '100%', padding: '10px 14px',
    background: '#FEF2F2', color: '#DC2626',
    borderRadius: '10px', fontSize: '0.85rem',
    marginBottom: '16px', textAlign: 'center',
    boxSizing: 'border-box', border: '1px solid #FECACA',
  },
  verifiedBanner: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px',
    background: 'var(--green-pale)', color: 'var(--green-dark)',
    borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500,
    marginBottom: '20px', boxSizing: 'border-box', flexWrap: 'wrap',
  },
  walletInline: {
    marginLeft: 'auto', background: 'var(--white)',
    padding: '2px 10px', borderRadius: '100px',
    fontWeight: 700, fontSize: '0.8rem', color: 'var(--green-dark)',
  },
  autoFillHint: { margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' },
  iconCircle: {
    width: '68px', height: '68px', borderRadius: '50%',
    background: '#FEF3C7', color: '#F59E0B',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.8rem', fontWeight: 700, marginBottom: '16px',
  },
  thankYouBox: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: 'var(--green-pale)',
    borderRadius: '14px', padding: '16px',
    width: '100%', boxSizing: 'border-box', marginBottom: '12px',
    border: '1px solid rgba(28,58,39,0.12)',
  },
  thankYouText: { margin: 0, fontSize: '0.9rem', color: 'var(--green-dark)', lineHeight: 1.5 },
  spinner: {
    width: 32, height: 32,
    border: '3px solid var(--green-pale)',
    borderTopColor: 'var(--green-dark)',
    borderRadius: '50%',
    animation: 'tb-spin 0.8s linear infinite',
  },
};

if (typeof document !== 'undefined' && !document.getElementById('tb-rp')) {
  const el = document.createElement('style'); el.id = 'tb-rp';
  el.textContent = `input:focus{border-color:var(--green-dark)!important;box-shadow:0 0 0 4px rgba(28,58,39,0.08)!important}`;
  document.head.appendChild(el);
}
