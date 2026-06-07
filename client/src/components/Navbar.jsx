import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Our impact',   id: 'our-impact'   },
  { label: 'Why Takeback', id: 'why-takeback'  },
  { label: 'Community',    id: 'community'     },
];

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else     window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLanding = location.pathname === '/';
  const isAppPage =
    location.pathname === '/borrow'    ||
    location.pathname === '/return'    ||
    location.pathname === '/enter-cup' ||
    location.pathname === '/wallet';

  /* Close menu on route change */
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  /* Lock body scroll while overlay is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  /* Don't render on /admin or unknown routes */
  if (!isLanding && !isAppPage) return null;

  return (
    <>
      {/* ── Scoped CSS ─────────────────────────────── */}
      <style>{`
        /* ── Navbar shell ── */
        .tb-nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          height: 80px;
          min-height: 80px;
          flex-shrink: 0;
          padding: 0 52px;
          background: #ffffff;
          border-bottom: 1px solid rgba(28,58,39,0.08);
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
        }
        @media (max-width: 768px) {
          .tb-nav { padding: 0 20px; height: 72px; min-height: 72px; }
        }
        @media (max-width: 480px) {
          .tb-nav { padding: 0 16px; height: 68px; min-height: 68px; }
        }

        .tb-center-links { display: flex; }
        .tb-cta-btn      { display: inline-flex; }
        .tb-burger       { display: none; }

        @media (max-width: 768px) {
          .tb-center-links { display: none !important; }
          .tb-cta-btn      { display: none !important; }
          .tb-burger       { display: flex !important; }
          .tb-user-right   { gap: 8px !important; }
          .tb-user-name    { display: none !important; }
        }

        .tb-navlink {
          background: none; border: none; padding: 0;
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 500; color: #1c3a27;
          cursor: pointer; opacity: 1;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .tb-navlink:hover { opacity: 0.65; }

        .tb-cta-btn {
          background: #1c3a27; color: #ffffff;
          border: none; border-radius: 100px;
          padding: 10px 22px;
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background 0.2s;
          white-space: nowrap; align-items: center;
        }
        .tb-cta-btn:hover { background: #2d5a3d; }

        .tb-overlay-link {
          background: none; border: none; padding: 0;
          font-family: 'Playfair Display', serif;
          font-weight: 700; font-size: 32px;
          color: #1c3a27; cursor: pointer;
          transition: color 0.2s; text-align: center;
        }
        .tb-overlay-link:hover { color: #4caf7d; }

        .tb-overlay-cta {
          background: #1c3a27; color: #ffffff;
          border: none; border-radius: 100px;
          padding: 14px 36px;
          font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 500;
          cursor: pointer; transition: background 0.2s;
        }
        .tb-overlay-cta:hover { background: #2d5a3d; }

        .tb-logout-btn {
          padding: 6px 14px; border-radius: 100px;
          border: 1.5px solid rgba(28,58,39,0.25);
          background: #ffffff; color: #5a6b5e;
          font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
          font-family: 'Inter', sans-serif;
          white-space: nowrap;
        }
        .tb-logout-btn:hover { border-color: #dc2626; color: #dc2626; }
      `}</style>

      {/* ── Navbar bar ─────────────────────────────── */}
      <header className="tb-nav">

        {/* Logo */}
        <span
          style={st.logoWrap}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (isLanding) window.scrollTo({ top: 0, behavior: 'smooth' });
            else navigate('/');
          }}
          onKeyDown={e => e.key === 'Enter' && navigate('/')}
        >
          <span style={st.logoTake}>Take</span>
          <span style={st.logoBack}>back</span>
        </span>

        {/* Center nav links — landing only, hidden on mobile */}
        {isLanding && (
          <nav className="tb-center-links" style={st.centerLinks}>
            {NAV_LINKS.map(l => (
              <button key={l.id} className="tb-navlink" onClick={() => scrollTo(l.id)}>
                {l.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right slot */}
        <div className="tb-user-right" style={st.right}>
          {isAppPage && user ? (
            /* User session controls */
            <>
              {user.picture && (
                <img src={user.picture} alt="" style={st.avatar} referrerPolicy="no-referrer" />
              )}
              <span style={st.userName}>{String(user.name || '').slice(0, 14)}</span>
              <button
                onClick={() => navigate('/wallet')}
                title="Tap to recharge"
                style={st.walletPill}
              >
                ₹{user.wallet ?? 0}
              </button>
              <button className="tb-logout-btn" onClick={logout}>Logout</button>
            </>
          ) : (
            /* Landing CTA (desktop) + hamburger (mobile) */
            <>
              <button
                className="tb-cta-btn"
                onClick={() => navigate('/enter-cup')}
              >
                Connect with us
              </button>

              <button
                className="tb-burger"
                style={st.burger}
                aria-label="Open menu"
                onClick={() => setMenuOpen(true)}
              >
                <span style={st.burgerLine} />
                <span style={st.burgerLine} />
                <span style={st.burgerLine} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Full-screen mobile overlay ──────────────── */}
      <div
        style={{
          ...st.overlay,
          opacity:       menuOpen ? 1 : 0,
          transform:     menuOpen ? 'translateY(0)' : 'translateY(-16px)',
          pointerEvents: menuOpen ? 'all' : 'none',
        }}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-modal="true"
      >
        {/* Close ×  */}
        <button
          style={st.closeBtn}
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          ×
        </button>

        {/* Overlay logo */}
        <span style={{ ...st.logoWrap, marginBottom: 52 }}>
          <span style={st.logoTake}>Take</span>
          <span style={st.logoBack}>back</span>
        </span>

        {/* Overlay nav links */}
        <nav style={st.overlayLinks}>
          {NAV_LINKS.map(l => (
            <button
              key={l.id}
              className="tb-overlay-link"
              onClick={() => {
                setMenuOpen(false);
                setTimeout(() => scrollTo(l.id), 280);
              }}
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Overlay CTA */}
        <button
          className="tb-overlay-cta"
          style={{ marginTop: 12 }}
          onClick={() => {
            setMenuOpen(false);
            setTimeout(() => navigate('/enter-cup'), 200);
          }}
        >
          Connect with us
        </button>
      </div>
    </>
  );
}

/* ── Static style objects ───────────────────────────── */
const st = {
  nav: {
    fontFamily: "'Inter', sans-serif",
  },

  /* Two-tone logo */
  logoWrap: {
    display: 'inline-flex', alignItems: 'baseline',
    cursor: 'pointer', userSelect: 'none', flexShrink: 0,
  },
  logoTake: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700, fontSize: 26,
    color: '#1c3a27', lineHeight: 1,
  },
  logoBack: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700, fontSize: 26,
    color: '#4caf7d', lineHeight: 1,
  },

  /* Center nav */
  centerLinks: {
    alignItems: 'center', gap: 36,
    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
  },

  /* Right area */
  right: {
    display: 'flex', alignItems: 'center', gap: 12,
    flexShrink: 0,
  },

  /* Hamburger */
  burger: {
    flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    gap: 5, width: 36, height: 36,
    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
  },
  burgerLine: {
    display: 'block', width: 22, height: 2,
    background: '#1c3a27', borderRadius: 2,
  },

  /* Full-screen overlay */
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: '#ffffff',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.28s ease, transform 0.28s ease',
    fontFamily: "'Inter', sans-serif",
    padding: '0 32px',
    boxSizing: 'border-box',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 20,
    background: 'none', border: 'none',
    fontSize: 36, lineHeight: 1,
    color: '#1c3a27', cursor: 'pointer',
    fontWeight: 300, padding: 4,
    fontFamily: 'sans-serif',
  },
  overlayLinks: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 28,
    marginBottom: 40,
  },

  /* User-session widgets */
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    border: '2px solid #4caf7d', objectFit: 'cover',
  },
  userName: {
    fontWeight: 600, fontSize: 14, color: '#1c3a27',
    maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  walletBadge: {
    background: '#c8e6d0', color: '#1c3a27',
    padding: '4px 14px', borderRadius: 100,
    fontWeight: 600, fontSize: 13,
  },
  walletPill: {
    background: '#c8e6d0', color: '#1c3a27',
    padding: '5px 12px', borderRadius: 100,
    fontWeight: 600, fontSize: 13,
    border: 'none', cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'background 0.15s',
  },
};
