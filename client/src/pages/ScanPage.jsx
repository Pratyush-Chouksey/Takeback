import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BRAND = '#52B788';

const styles = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    background: 'linear-gradient(135deg, #0f1f16 0%, #1a3a24 50%, #0f1f16 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '32px 16px',
    boxSizing: 'border-box',
    color: '#fff',
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
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 18,
    fontWeight: 800,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 20,
    padding: 28,
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  h: { margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' },
  sub: { marginTop: 10, fontSize: 15, color: '#9ca3af', lineHeight: 1.6 },
  viewfinderWrap: { width: 200, height: 200, margin: '18px auto 10px', position: 'relative' },
  viewfinder: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    border: `2px solid ${BRAND}`,
    background: 'rgba(0,0,0,0.05)',
    boxSizing: 'border-box',
  },
  corner: { position: 'absolute', width: 36, height: 36, borderRadius: 10, boxSizing: 'border-box' },
  note: { marginTop: 12, fontSize: 12, color: '#6b7280' },
  primaryBtn: {
    marginTop: 16,
    width: '100%',
    height: 48,
    background: BRAND,
    color: '#0f1f16',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'transform 0.15s ease, background 0.15s ease',
  },
  secondaryBtn: {
    marginTop: 12,
    width: '100%',
    height: 48,
    background: 'transparent',
    color: BRAND,
    border: `1.5px solid ${BRAND}`,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
  },
  msg: { marginTop: 14, fontSize: 14, color: '#9ca3af', lineHeight: 1.7 },
};

export default function ScanPage() {
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('tb-scan')) return;

    const el = document.createElement('style');
    el.id = 'tb-scan';
    el.textContent = `
      @keyframes tb-scan-pulse{0%{transform:scale(1); box-shadow:0 0 0 0 rgba(82,183,136,0.35)}50%{transform:scale(1.015); box-shadow:0 0 0 10px rgba(82,183,136,0.12)}100%{transform:scale(1); box-shadow:0 0 0 0 rgba(82,183,136,0.35)}}
      .tb-scan-view{animation: tb-scan-pulse 2.2s ease-in-out infinite;}
      button:hover:not(:disabled){opacity:.92}
    `;
    document.head.appendChild(el);
  }, []);

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/')}>
        ←
      </button>

      <div style={styles.card}>
        <h2 style={styles.h}>Scan a Takeback Cup</h2>
        <div style={styles.sub}>Point your camera at the QR code on the cup</div>

        <div style={styles.viewfinderWrap} aria-hidden="true">
          <div className="tb-scan-view" style={styles.viewfinder} />

          {/* Corner brackets */}
          <div style={{ ...styles.corner, left: 16, top: 16, borderTop: `3px solid ${BRAND}`, borderLeft: `3px solid ${BRAND}` }} />
          <div style={{ ...styles.corner, right: 16, top: 16, borderTop: `3px solid ${BRAND}`, borderRight: `3px solid ${BRAND}` }} />
          <div style={{ ...styles.corner, left: 16, bottom: 16, borderBottom: `3px solid ${BRAND}`, borderLeft: `3px solid ${BRAND}` }} />
          <div style={{ ...styles.corner, right: 16, bottom: 16, borderBottom: `3px solid ${BRAND}`, borderRight: `3px solid ${BRAND}` }} />
        </div>

        <div style={styles.note}>Your browser will ask for camera permission</div>

        <button
          style={styles.primaryBtn}
          onClick={() => setShowInstructions(true)}
        >
          Open Camera Scanner
        </button>

        {showInstructions && (
          <>
            <div style={styles.msg}>
              Use your phone&apos;s default camera app to scan — it will open the borrow page automatically
            </div>
            <button style={styles.secondaryBtn} onClick={() => navigate('/enter-cup')}>
              Enter Cup Code Manually →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

