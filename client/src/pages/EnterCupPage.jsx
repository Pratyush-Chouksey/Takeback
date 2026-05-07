import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BRAND = '#2D6A4F';
const BRAND_FOCUS = 'rgba(45,106,79,0.1)';

const pageStyles = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    background: 'linear-gradient(135deg, #0f1f16 0%, #1a3a24 50%, #0f1f16 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    boxSizing: 'border-box',
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 76,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 18,
    fontWeight: 800,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: '#fff',
    borderRadius: 20,
    padding: 36,
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  logo: { color: BRAND, fontWeight: 900, fontSize: 14, letterSpacing: -0.2 },
  h: { margin: '10px 0 0', fontSize: 20, fontWeight: 900, color: '#111827' },
  sub: { marginTop: 10, color: '#6b7280', fontSize: 13, lineHeight: 1.6 },
  input: {
    width: '100%',
    height: 52,
    border: '1.5px solid #e5e7eb',
    borderRadius: 12,
    fontSize: 16,
    outline: 'none',
    padding: '0 14px',
    textTransform: 'uppercase',
    letterSpacing: 2,
    boxSizing: 'border-box',
  },
  btn: {
    marginTop: 16,
    width: '100%',
    height: 52,
    background: BRAND,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 900,
  },
  err: { marginTop: 10, color: '#DC2626', fontSize: 13, fontWeight: 600 },
};

function isValidCupCode(v) {
  return /^CUP_\d+$/i.test(v);
}

export default function EnterCupPage() {
  const navigate = useNavigate();
  const [cupCode, setCupCode] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const normalized = useMemo(() => cupCode.trim().toUpperCase(), [cupCode]);

  const inputStyle = useMemo(() => {
    if (!focused) return pageStyles.input;
    return {
      ...pageStyles.input,
      borderColor: BRAND,
      boxShadow: `0 0 0 4px ${BRAND_FOCUS}`,
    };
  }, [focused]);

  const onSubmit = () => {
    const v = normalized;
    if (!v) {
      setError('Please enter a cup code');
      return;
    }
    if (!isValidCupCode(v)) {
      setError('Invalid cup code format');
      return;
    }
    setError('');
    navigate(`/borrow?cupId=${encodeURIComponent(v)}`);
  };

  return (
    <div style={pageStyles.page}>
      <button style={pageStyles.backBtn} onClick={() => navigate('/')}>
        ←
      </button>

      <div style={pageStyles.card}>
        <div style={pageStyles.logo}>🍃 Takeback</div>
        <h2 style={pageStyles.h}>Enter Cup Code</h2>
        <div style={pageStyles.sub}>Find the cup ID printed below the QR code</div>

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

        {error && <div style={pageStyles.err}>{error}</div>}

        <button style={pageStyles.btn} onClick={onSubmit}>
          Find This Cup
        </button>
      </div>
    </div>
  );
}

