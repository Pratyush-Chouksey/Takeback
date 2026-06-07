import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────────
   Collage card data — swap `bg` for a real <img> later
───────────────────────────────────────────────────────*/
const CARDS = [
  {
    bg: 'linear-gradient(145deg,#2d5a3d,#1c3a27)',
    label: 'Borrow',
    labelColor: '#fff',
    offsetTop: 40,
    height: 280,
  },
  {
    bg: 'linear-gradient(145deg,#4caf7d,#2d5a3d)',
    label: 'Return anywhere',
    labelColor: '#fff',
    offsetTop: 0,
    height: 280,
  },
  {
    bg: 'linear-gradient(145deg,#c8e6d0,#4caf7d)',
    label: 'Community',
    labelColor: '#1c3a27',
    offsetTop: 0,
    height: 260,
  },
  {
    bg: 'linear-gradient(145deg,#1c3a27,#2d5a3d)',
    label: 'Impact',
    labelColor: '#fff',
    offsetTop: 0,
    height: 260,
  },
];

const STATS = ['10,000+ cups', '1,050+ members', 'Instant cashback'];

const APP_URL = 'https://takeback-nine.vercel.app/enter-cup';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSticky, setShowSticky] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* ── Scoped keyframes & responsive rules ─────── */}
      <style>{`
        @keyframes tb-pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        @keyframes tb-bounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(6px); }
        }
        @keyframes tb-fadein {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .tb-hero-grid {
          display: grid;
          grid-template-columns: 55fr 45fr;
          align-items: center;
          gap: 48px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 100px 64px 60px;
          animation: tb-fadein 0.6s ease both;
        }

        .tb-collage-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .tb-collage-card {
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 16px 40px rgba(0,0,0,0.12);
          transition: transform 0.3s ease;
          cursor: default;
        }
        .tb-collage-card:hover { transform: scale(1.02); }

        .tb-card-label {
          position: absolute;
          bottom: 14px;
          left: 14px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          border-radius: 100px;
          padding: 4px 12px;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          white-space: nowrap;
        }

        .tb-nav-link-btn {
          background: none; border: none; padding: 0;
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 500;
          color: #1c3a27; cursor: pointer;
          transition: opacity 0.2s;
        }
        .tb-nav-link-btn:hover { opacity: 0.65; }

        /* ── Responsive ──────────────────────────── */
        @media (max-width: 900px) {
          .tb-hero-grid {
            grid-template-columns: 1fr !important;
            padding: 88px 24px 60px !important;
            gap: 36px !important;
          }
          .tb-hero-text { text-align: center; align-items: center !important; }
          .tb-hero-text .tb-subtext { max-width: 100% !important; }
          .tb-hero-text .tb-btn-row { justify-content: center !important; }
          .tb-hero-text .tb-stats-row { justify-content: center !important; }
          .tb-collage-wrap { order: -1; }
          .tb-collage-grid { height: 320px !important; }
          .tb-collage-card { height: auto !important; margin-top: 0 !important; }
        }

        @media (max-width: 480px) {
          .tb-headline { font-size: clamp(44px,12vw,60px) !important; }
          .tb-collage-grid { height: 260px !important; }
          .tb-sticky-cta { display: none !important; }
        }

        /* Start Borrowing primary button */
        .tb-start-btn {
          background: #1c3a27;
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 14px 32px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          white-space: nowrap;
        }
        .tb-start-btn:hover {
          background: #2d5a3d;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(28,58,39,0.2);
        }

        /* Sticky floating CTA */
        .tb-sticky-cta {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 50;
          background: #1c3a27;
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 12px 24px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(28,58,39,0.25);
          transition: opacity 0.3s ease, transform 0.2s ease, background 0.2s;
        }
        .tb-sticky-cta:hover {
          background: #2d5a3d;
          transform: translateY(-2px);
        }

        /* ── Steps section ── */
        .tb-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          max-width: 900px;
          margin: 0 auto;
        }
        @media (max-width: 640px) {
          .tb-steps-grid { grid-template-columns: 1fr; gap: 24px; }
        }

        /* ── Section responsive ── */
        @media (max-width: 768px) {
          .tb-section     { padding: 64px 20px !important; }
          .tb-btn-row     { flex-wrap: wrap !important; justify-content: center !important; }
          .tb-start-btn   { width: 100%; text-align: center; }
          .tb-impact-row  { gap: 12px !important; }
          .tb-feature-row { gap: 16px !important; }
        }
        @media (max-width: 480px) {
          .tb-section    { padding: 48px 16px !important; }
          .tb-steps-grid { padding: 0; }
          .tb-impact-card { padding: 20px 16px !important; min-width: 130px !important; }
          .tb-feature-card { min-width: 140px !important; padding: 20px !important; }
        }
      `}</style>

      <div style={s.page}>

        {/* ══════════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════════ */}
        <section style={s.heroSection}>
          <div className="tb-hero-grid">

            {/* ── LEFT: Text ── */}
            <div
              className="tb-hero-text"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              {/* Badge pill */}
              <div style={s.badgePill}>
                <span style={s.badgeDot} />
                INDIA'S REUSABLE CUP MOVEMENT
              </div>

              {/* Headline */}
              <h1 className="tb-headline" style={s.headline}>
                <span style={s.hlNormal}>Borrow</span><br />
                <span style={s.hlItalic}>a cup.</span><br />
                <span style={s.hlNormal}>Return</span><br />
                <span style={s.hlNormal}>kind.</span>
              </h1>

              {/* Subtext */}
              <p className="tb-subtext" style={s.subtext}>
                Borrow a reusable cup, enjoy your drink, and return it at any
                partner location across India. No app needed — just scan and go.
              </p>

              {/* CTA buttons */}
              <div className="tb-btn-row" style={s.btnRow}>
                <a
                  className="tb-start-btn"
                  href={APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Start Borrowing →
                </a>
                <button
                  className="btn-secondary"
                  onClick={() => scrollToSection('community')}
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  Connect with us
                </button>
              </div>

              {/* Reassurance line */}
              <p style={s.reassurance}>
                No app needed&nbsp;·&nbsp;Sign in with Google&nbsp;·&nbsp;Instant cashback
              </p>

              {/* Stat pills */}
              <div className="tb-stats-row" style={s.statsRow}>
                {STATS.map(stat => (
                  <span key={stat} style={s.statPill}>{stat}</span>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Photo collage ── */}
            <div className="tb-collage-wrap">
              <div className="tb-collage-grid">
                {CARDS.map((card, i) => (
                  <div
                    key={i}
                    className="tb-collage-card"
                    style={{
                      background: card.bg,
                      height: card.height,
                      marginTop: card.offsetTop,
                    }}
                  >
                    {/* Swap children for <img> when real photos are available */}
                    <span
                      className="tb-card-label"
                      style={{ color: card.labelColor }}
                    >
                      {card.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            style={s.scrollIndicator}
            onClick={() => scrollToSection('how-it-works')}
            role="button"
            tabIndex={0}
            aria-label="Scroll down"
            onKeyDown={e => e.key === 'Enter' && scrollToSection('how-it-works')}
          >
            <span style={s.scrollLabel}>SCROLL</span>
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              style={s.scrollArrow}
              aria-hidden="true"
            >
              <path
                d="M8 3v10M3 8l5 5 5-5"
                stroke="#5a6b5e" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
        </section>

        {/* ── Sticky floating CTA ── */}
        <a
          className="tb-sticky-cta"
          href={APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Start Borrowing"
          style={{ opacity: showSticky ? 1 : 0, pointerEvents: showSticky ? 'all' : 'none' }}
        >
          Start Borrowing →
        </a>

        {/* ══════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════ */}
        <section id="how-it-works" className="tb-section" style={s.section}>
          <div style={s.sectionInner}>
            <span className="overline" style={{ textAlign: 'center', display: 'block' }}>
              How it works
            </span>
            <h2 className="section-heading" style={{ textAlign: 'center', marginBottom: 48 }}>
              Three simple steps
            </h2>
            <div className="tb-steps-grid">
              {[
                {
                  n: '01', title: 'Scan the QR',
                  desc: 'Scan the QR code printed on any Takeback cup at a partner café.',
                },
                {
                  n: '02', title: 'Borrow & enjoy',
                  desc: 'A ₹150 deposit is held in your Takeback wallet. Enjoy your drink.',
                },
                {
                  n: '03', title: 'Return & earn',
                  desc: 'Drop any Takeback cup at any partner location and get ₹50 cashback.',
                },
              ].map(step => (
                <div key={step.n} style={s.stepCard}>
                  <div style={s.stepNum}>{step.n}</div>
                  <h3 style={s.stepTitle}>{step.title}</h3>
                  <p style={s.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            OUR IMPACT
        ══════════════════════════════════════════ */}
        <section id="our-impact" className="tb-section" style={{ ...s.section, background: '#1e3d2a' }}>
          <div style={s.sectionInner}>
            <span className="overline" style={{ textAlign: 'center', display: 'block', color: '#4caf7d' }}>
              Our impact
            </span>
            <h2
              className="section-heading"
              style={{ textAlign: 'center', color: '#fff', marginBottom: 48 }}
            >
              Every cup counts
            </h2>
            <div className="tb-impact-row" style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { val: '10,000+', label: 'Cups in circulation' },
                { val: '1,050+',  label: 'Active members' },
                { val: '30,000+', label: 'Single-use cups saved' },
                { val: '₹50',     label: 'Cashback per return' },
              ].map(stat => (
                <div key={stat.label} className="tb-impact-card" style={s.impactCard}>
                  <div style={s.impactVal}>{stat.val}</div>
                  <div style={s.impactLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            WHY TAKEBACK
        ══════════════════════════════════════════ */}
        <section id="why-takeback" className="tb-section" style={s.section}>
          <div style={s.sectionInner}>
            <span className="overline" style={{ textAlign: 'center', display: 'block' }}>
              Why Takeback
            </span>
            <h2 className="section-heading" style={{ textAlign: 'center', marginBottom: 48 }}>
              Built for the planet
            </h2>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { icon: '♻️', title: 'Zero waste', body: 'Every cup is washed and reused. No landfill, no oceans.' },
                { icon: '💳', title: 'Reward loop', body: 'Return a cup anywhere — even one that isn\'t yours — and earn ₹50.' },
                { icon: '🌿', title: 'No app needed', body: 'Just scan the QR on the cup with any camera. That\'s it.' },
                { icon: '🤝', title: 'Café-first', body: 'Partnered with cafés across India who share our values.' },
              ].map(f => (
                <div key={f.title} className="tb-feature-card" style={s.featureCard}>
                  <span style={s.featureIcon}>{f.icon}</span>
                  <h3 style={s.featureTitle}>{f.title}</h3>
                  <p style={s.featureBody}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            COMMUNITY
        ══════════════════════════════════════════ */}
        <section id="community" className="tb-section" style={{ ...s.section, background: '#f5f2eb' }}>
          <div style={s.sectionInner}>
            <span className="overline" style={{ textAlign: 'center', display: 'block' }}>
              Community
            </span>
            <h2 className="section-heading" style={{ textAlign: 'center', marginBottom: 20 }}>
              Join 1,050+ members
            </h2>
            <p style={{ ...s.subtext, textAlign: 'center', margin: '0 auto 36px', maxWidth: 520 }}>
              Takeback members span cafés, colleges, and coworking spaces across India.
              Every return makes a difference.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/enter-cup')}>
                Start borrowing →
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/enter-cup')}
              >
                Return a cup
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FOOTER BAR
        ══════════════════════════════════════════ */}
        <footer style={s.footer}>
          <span style={s.footerLogo}>
            <span style={{ color: '#1c3a27' }}>Take</span>
            <span style={{ color: '#4caf7d' }}>back</span>
          </span>
          <span style={s.footerText}>© 2025 Takeback. India's reusable cup movement.</span>
          <button
            style={s.adminPortal}
            onClick={() => navigate('/admin')}
            onMouseEnter={e => e.currentTarget.style.color = '#4caf7d'}
            onMouseLeave={e => e.currentTarget.style.color = '#5a6b5e'}
          >
            Admin →
          </button>
        </footer>
      </div>
    </>
  );
}

/* ── Styles ──────────────────────────────────────────── */
const s = {
  page: {
    background: '#f0ede6',
    fontFamily: "'Inter', sans-serif",
    color: '#1c3a27',
    overflowX: 'hidden',
  },

  /* Hero */
  heroSection: {
    background: '#f0ede6',
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  /* Badge pill */
  badgePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: '#c8e6d0',
    color: '#2d5a3d',
    borderRadius: 100,
    padding: '5px 14px',
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: 28,
    whiteSpace: 'nowrap',
  },
  badgeDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#4caf7d',
    flexShrink: 0,
    animation: 'tb-pulse 2s infinite',
  },

  /* Headline */
  headline: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700,
    fontSize: 'clamp(56px,7vw,92px)',
    lineHeight: 0.92,
    letterSpacing: '-2px',
    marginBottom: 24,
    margin: '0 0 24px',
  },
  hlNormal: { color: '#1c3a27', fontStyle: 'normal', display: 'block' },
  hlItalic: { color: '#4caf7d', fontStyle: 'italic', display: 'block' },

  /* Sub text */
  subtext: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 16,
    fontWeight: 400,
    color: '#5a6b5e',
    maxWidth: 400,
    lineHeight: 1.7,
    marginBottom: 36,
    margin: '0 0 36px',
  },

  /* Buttons */
  btnRow: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: 28,
  },

  /* Reassurance line */
  reassurance: {
    margin: '12px 0 0',
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    color: '#5a6b5e',
    lineHeight: 1.5,
  },

  /* Stat pills */
  statsRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 28,
  },
  statPill: {
    background: '#c8e6d0',
    color: '#2d5a3d',
    borderRadius: 100,
    padding: '5px 14px',
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },

  /* Scroll indicator */
  scrollIndicator: {
    position: 'absolute',
    bottom: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    opacity: 0.5,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    userSelect: 'none',
  },
  scrollLabel: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    color: '#5a6b5e',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  scrollArrow: {
    animation: 'tb-bounce 1.6s ease-in-out infinite',
  },

  /* Generic section */
  section: {
    background: '#f0ede6',
    padding: '96px 24px',
  },
  sectionInner: {
    maxWidth: 1100,
    margin: '0 auto',
  },

  /* Steps */
  stepCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '32px 28px',
    boxShadow: '0 4px 20px rgba(28,58,39,0.06)',
  },
  stepNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 40,
    fontWeight: 700,
    color: '#c8e6d0',
    lineHeight: 1,
    marginBottom: 16,
  },
  stepTitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 18,
    fontWeight: 600,
    color: '#1c3a27',
    margin: '0 0 10px',
  },
  stepDesc: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    color: '#5a6b5e',
    lineHeight: 1.65,
    margin: 0,
  },

  /* Impact */
  impactCard: {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: '32px 36px',
    textAlign: 'center',
    minWidth: 180,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  impactVal: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 48,
    fontWeight: 700,
    color: '#4caf7d',
    lineHeight: 1,
    marginBottom: 8,
  },
  impactLabel: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.65)',
  },

  /* Why Takeback features */
  featureCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '28px 24px',
    maxWidth: 240,
    boxShadow: '0 4px 20px rgba(28,58,39,0.06)',
    flex: '1 1 200px',
  },
  featureIcon: { fontSize: 28, display: 'block', marginBottom: 14 },
  featureTitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    color: '#1c3a27',
    margin: '0 0 8px',
  },
  featureBody: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: '#5a6b5e',
    lineHeight: 1.6,
    margin: 0,
  },

  /* Footer */
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 48px',
    background: '#f0ede6',
    borderTop: '1px solid rgba(28,58,39,0.1)',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerLogo: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700,
    fontSize: 18,
  },
  footerText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    color: '#5a6b5e',
  },
  adminPortal: {
    fontSize: 12,
    color: '#5a6b5e',
    fontWeight: 500,
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    padding: 0,
    transition: 'color 0.15s',
    fontFamily: "'Inter', sans-serif",
  },
};
