import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCup } from '../api';

const BRAND = '#2D6A4F';
const BRAND_FOCUS = 'rgba(45,106,79,0.1)';

const pageStyles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f1f16 0%, #1a3a24 50%, #0f1f16 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    boxSizing: 'border-box',
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    position: 'relative',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderRadius: 24,
    padding: 40,
    boxSizing: 'border-box',
    textAlign: 'left',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: 18,
    fontWeight: 700,
  },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  logoEmoji: { fontSize: 32 },
  logoText: { fontSize: 24, fontWeight: 800, color: BRAND, letterSpacing: -0.3 },
  tagline: { marginTop: 6, textAlign: 'center', fontSize: 13, color: '#6b7280' },
  divider: { height: 1, background: '#f3f4f6', margin: '20px 0' },
  heading: { margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' },
  sub: { marginTop: 8, color: '#6b7280', fontSize: 13, lineHeight: 1.6 },
  input: {
    width: '100%',
    height: 56,
    border: '2px solid #e5e7eb',
    borderRadius: 14,
    fontSize: 18,
    outline: 'none',
    padding: '0 20px',
    textTransform: 'uppercase',
    letterSpacing: 3,
    boxSizing: 'border-box',
    textAlign: 'center',
    fontWeight: 600,
    color: '#111827',
  },
  btn: {
    marginTop: 12,
    width: '100%',
    height: 52,
    background: BRAND,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
  },
  err: { marginTop: 10, color: '#DC2626', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  errIcon: { fontSize: 14 },
  helper: { marginTop: 6, fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  bottomDivider: { height: 1, background: '#f3f4f6', margin: '22px 0 10px' },
  bottomText: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
};

function isValidCupCode(v) {
  return /^CUP_\d+$/i.test(v);
}

export default function EnterCupPage() {
  const navigate = useNavigate();
  const [cupCode, setCupCode] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const normalized = useMemo(() => cupCode.trim().toUpperCase(), [cupCode]);

  const inputStyle = useMemo(() => {
    if (!focused) return pageStyles.input;
    return {
      ...pageStyles.input,
      borderColor: BRAND,
      boxShadow: `0 0 0 4px ${BRAND_FOCUS}`,
    };
  }, [focused]);

  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById('tb-enter-cup')) return;
    const el = document.createElement('style');
    el.id = 'tb-enter-cup';
    el.textContent = `
      .tb-enter-btn:hover:not(:disabled){background:#235c42!important;transform:translateY(-1px)}
      @keyframes tb-error-fade{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:translateY(0)}}
      .tb-enter-error{animation:tb-error-fade .18s ease-out}
    `;
    document.head.appendChild(el);
  }, []);

  const onSubmit = async () => {
    const v = normalized;
    if (!v) {
      setError('Please enter a cup code');
      return;
    }
    if (!v.startsWith('CUP_')) {
      setError('Invalid format. Try CUP_0042');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await getCup(v);
      navigate(`/borrow?cupId=${encodeURIComponent(v)}`);
    } catch (e) {
      if (e.response?.status === 404) {
        setError('Cup not found. Please check the code and try again.');
      } else {
        setError(e.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyles.page}>
      <div style={pageStyles.card}>
        <button style={pageStyles.backBtn} onClick={() => navigate('/')}>
          ←
        </button>

        <div style={pageStyles.logoRow}>
          <span style={pageStyles.logoEmoji}>🍃</span>
          <span style={pageStyles.logoText}>Takeback</span>
        </div>
        <div style={pageStyles.tagline}>Borrow smart. Return kind.</div>

        <div style={pageStyles.divider} />

        <h2 style={pageStyles.heading}>Enter Your Cup Code</h2>
        <div style={pageStyles.sub}>
          Find the 8-character code printed below the QR sticker on your cup
        </div>

        <input
          style={inputStyle}
          value={cupCode}
          onChange={(e) => {
            const next = e.target.value.toUpperCase();
            setCupCode(next);
            if (error) setError('');
          }}
          placeholder="e.g. CUP_0042"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode="text"
          aria-label="Cup code"
        />

        {error && (
          <div className="tb-enter-error" style={pageStyles.err}>
            <span style={pageStyles.errIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          className="tb-enter-btn"
          style={{ ...pageStyles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Find This Cup'}
        </button>

        <div style={pageStyles.helper}>Cup codes are printed below the QR sticker</div>

        <div style={pageStyles.bottomDivider} />
        <div style={pageStyles.bottomText}>
          Want to return a cup? Enter its code above
        </div>
      </div>
    </div>
  );
}

