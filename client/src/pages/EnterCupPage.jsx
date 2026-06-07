import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCup } from '../api';

export default function EnterCupPage() {
  const navigate = useNavigate();
  const [cupCode, setCupCode] = useState('');
  const [error,   setError]   = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const normalized = useMemo(() => cupCode.trim().toUpperCase(), [cupCode]);

  const onSubmit = async () => {
    const v = normalized;
    if (!v)              { setError('Please enter a cup code'); return; }
    if (!v.startsWith('CUP_')) { setError('Invalid format — try CUP_0042'); return; }
    setLoading(true); setError('');
    try {
      await getCup(v);
      navigate(`/borrow?cupId=${encodeURIComponent(v)}`);
    } catch (e) {
      if (e.response?.status === 404)
        setError('Cup not found. Please check the code and try again.');
      else
        setError(e.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter') onSubmit(); };

  return (
    <>
      <style>{`
        @keyframes ec-fadein {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ec-err {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ec-card {
          animation: ec-fadein 0.4s ease both;
        }

        .ec-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: none;
          font-family: 'Inter', sans-serif; font-size: 13px;
          color: #5a6b5e; cursor: pointer;
          padding: 0; margin-bottom: 24px;
          transition: color 0.15s;
        }
        .ec-back-btn:hover { color: #1c3a27; }

        .ec-find-btn {
          width: 100%; height: 52px;
          background: #1c3a27; color: #fff;
          border: none; border-radius: 14px;
          font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 500;
          cursor: pointer; margin-top: 16px;
          transition: background 0.2s, transform 0.15s;
        }
        .ec-find-btn:hover:not(:disabled) {
          background: #2d5a3d;
          transform: translateY(-1px);
        }
        .ec-find-btn:disabled { opacity: 0.7; cursor: default; }

        .ec-input::placeholder { color: rgba(28,58,39,0.3); }

        @media (max-width: 768px) {
          .ec-card { padding: 28px !important; }
        }
        @media (max-width: 480px) {
          .ec-card { margin: 16px; border-radius: 20px !important; }
        }
      `}</style>

      <div style={s.page}>
        <div className="ec-card" style={s.card}>

          {/* ← Back */}
          <button className="ec-back-btn" onClick={() => navigate('/')}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>←</span>
            Back
          </button>

          {/* Logo */}
          <div style={s.logoRow}>
            <span style={s.logoTake}>Take</span>
            <span style={s.logoBack}>back</span>
          </div>
          <p style={s.logoTagline}>Borrow smart. Return kind.</p>

          {/* Divider */}
          <div style={s.divider} />

          {/* Heading */}
          <h1 style={s.heading}>Enter Your Cup Code</h1>
          <p style={s.subtext}>
            Find the code printed below the QR sticker on your cup
          </p>

          {/* Input */}
          <input
            className="ec-input"
            style={{
              ...s.input,
              borderColor: focused ? '#4caf7d' : 'rgba(28,58,39,0.2)',
              boxShadow:   focused ? '0 0 0 3px rgba(76,175,125,0.12)' : 'none',
            }}
            value={cupCode}
            onChange={e => {
              setCupCode(e.target.value.toUpperCase());
              if (error) setError('');
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKey}
            placeholder="CUP_0042"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            aria-label="Cup code"
          />

          {/* Error */}
          {error && (
            <div style={{ ...s.errorMsg, animation: 'ec-err 0.18s ease both' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Find button */}
          <button
            className="ec-find-btn"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? 'Checking…' : 'Find This Cup'}
          </button>

          {/* Helper */}
          <p style={s.helper}>Cup codes are printed below the QR sticker</p>
        </div>
      </div>
    </>
  );
}

/* ── Styles ─────────────────────────────────────────── */
const s = {
  page: {
    minHeight: '100vh',
    background: '#f0ede6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#ffffff',
    borderRadius: 24,
    padding: '48px 44px',
    maxWidth: 440,
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 8px 40px rgba(28,58,39,0.08)',
  },

  /* Two-tone logo */
  logoRow: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'center',
    gap: 0, marginBottom: 4,
  },
  logoTake: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700, fontSize: 20, color: '#1c3a27',
  },
  logoBack: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700, fontSize: 20, color: '#4caf7d',
  },
  logoTagline: {
    margin: 0, textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
    fontSize: 12, color: '#5a6b5e',
  },

  divider: {
    height: 1, background: '#f0ede6',
    margin: '18px 0',
  },

  heading: {
    margin: '0 0 8px',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700, fontSize: 26,
    color: '#1c3a27', textAlign: 'center',
  },
  subtext: {
    margin: '0 0 28px',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14, color: '#5a6b5e',
    textAlign: 'center', lineHeight: 1.6,
  },

  input: {
    width: '100%', height: 56,
    border: '1.5px solid rgba(28,58,39,0.2)',
    borderRadius: 14, outline: 'none',
    padding: '0 20px', boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
    fontSize: 18, fontWeight: 600,
    color: '#1c3a27',
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
    background: '#ffffff',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },

  errorMsg: {
    display: 'flex', alignItems: 'center', gap: 6,
    marginTop: 8,
    fontFamily: "'Inter', sans-serif",
    fontSize: 13, color: '#dc2626',
  },

  helper: {
    margin: '20px 0 0',
    fontFamily: "'Inter', sans-serif",
    fontSize: 12, color: '#5a6b5e',
    textAlign: 'center',
  },
};
