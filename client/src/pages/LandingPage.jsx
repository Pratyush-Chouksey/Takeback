import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BRAND = '#52B788';

const styles = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #0f1f16 0%, #1a3a24 50%, #0f1f16 100%)',
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    color: '#fff',
    padding: '0 16px',
  },
  heroWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '44px 0 10px',
  },
  hero: { textAlign: 'center', width: '100%', maxWidth: 980 },
  logo: { fontSize: 48, fontWeight: 800, margin: 0, letterSpacing: -0.5 },
  tagline: { fontSize: 20, color: BRAND, marginTop: 14, letterSpacing: '1px', fontWeight: 700 },
  subtext: {
    margin: '16px auto 0',
    fontSize: 16,
    color: '#9ca3af',
    maxWidth: 480,
    lineHeight: 1.7,
  },
  pillsRow: {
    marginTop: 22,
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  pill: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: '8px 18px',
    fontSize: 13,
    color: '#fff',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  },
  ctaRow: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  ctaButton: { marginTop: 32, padding: '16px 36px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700, background: BRAND, color: '#0f1f16' },
  ctaOutline: { marginTop: 12, padding: '16px 36px', borderRadius: 12, border: `1.5px solid ${BRAND}`, cursor: 'pointer', fontSize: 16, fontWeight: 700, background: 'transparent', color: BRAND },
  welcome: { fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12, opacity: 0.92 },
  stepsWrap: { padding: '24px 0 18px' },
  steps: { display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' },
  step: { width: 260, textAlign: 'center' },
  num: { width: 36, height: 36, borderRadius: '50%', border: `2px solid ${BRAND}`, color: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, margin: '0 auto 12px' },
  stepTitle: { fontSize: 14, fontWeight: 800, margin: 0, color: '#fff' },
  stepDesc: { marginTop: 8, fontSize: 13, color: '#9ca3af', lineHeight: 1.6 },
  bottomBar: { borderTop: '1px solid rgba(255,255,255,0.12)', padding: '14px 0 22px', display: 'flex', justifyContent: 'flex-end' },
  adminPortal: { fontSize: 12, color: '#6b7280', fontWeight: 700, cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('tb-landing')) return;

    const el = document.createElement('style');
    el.id = 'tb-landing';
    el.textContent = `
      .tb-landing-cta{transition: background 0.15s ease, transform 0.15s ease;}
      .tb-landing-cta:hover{background:#3d9e6e!important; transform: translateY(-2px);}
      .tb-landing-outline{transition: border-color 0.15s ease, transform 0.15s ease, color 0.15s ease, background 0.15s ease;}
      .tb-landing-outline:hover{transform: translateY(-2px); border-color:#3d9e6e!important; color:#3d9e6e!important;}
      .tb-landing-admin:hover{color:${BRAND}!important;}
    `;
    document.head.appendChild(el);
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.heroWrap}>
        <div style={styles.hero}>
          {user ? <div style={styles.welcome}>Welcome back, {user.name} 👋</div> : null}
          <h1 style={styles.logo}>🍃 Takeback</h1>
          <div style={styles.tagline}>Borrow smart. Return kind.</div>
          <div style={styles.subtext}>
            Join thousands of eco-conscious people reducing single-use cup waste one coffee at a time.
          </div>

          <div style={styles.pillsRow}>
            <div style={styles.pill}>🥤 6,300+ Cups in circulation</div>
            <div style={styles.pill}>♻️ 3,000+ Returns completed</div>
            <div style={styles.pill}>👥 1,000+ Members</div>
          </div>

          <div style={styles.ctaRow}>
            <button className="tb-landing-cta" style={styles.ctaButton} onClick={() => navigate('/enter-cup')}>
              {user ? 'Borrow a Cup →' : 'Enter Cup Code to Borrow →'}
            </button>
            {user ? (
              <button className="tb-landing-outline" style={styles.ctaOutline} onClick={() => navigate('/enter-cup')}>
                View My Wallet (Rs. {user.wallet}) 
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div style={styles.stepsWrap}>
        <div style={styles.steps}>
          <div style={styles.step}>
            <div style={styles.num}>1</div>
            <p style={styles.stepTitle}>Scan QR</p>
            <div style={styles.stepDesc}>Scan the QR code on any Takeback cup</div>
          </div>
          <div style={styles.step}>
            <div style={styles.num}>2</div>
            <p style={styles.stepTitle}>Borrow</p>
            <div style={styles.stepDesc}>Pay Rs.150 from your wallet, enjoy your drink</div>
          </div>
          <div style={styles.step}>
            <div style={styles.num}>3</div>
            <p style={styles.stepTitle}>Return &amp; Earn</p>
            <div style={styles.stepDesc}>Return any cup, get Rs.50 cashback</div>
          </div>
        </div>
      </div>

      <div style={styles.bottomBar}>
        <button className="tb-landing-admin" style={styles.adminPortal} onClick={() => navigate('/admin')}>
          Admin Portal →
        </button>
      </div>
    </div>
  );
}

