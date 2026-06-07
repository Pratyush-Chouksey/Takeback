import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { getCup, googleAuth, borrowCup, returnCup } from '../api';
import { useAuth } from '../context/AuthContext';

/* ─── Scoped CSS injected once ─────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('tb-bp-css')) {
  const el = document.createElement('style');
  el.id = 'tb-bp-css';
  el.textContent = `
    @keyframes bp-fadein {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes bp-spin {
      to { transform: rotate(360deg); }
    }

    .bp-card { animation: bp-fadein 0.4s ease both; }

    /* Primary action button */
    .bp-btn-primary {
      width: 100%; height: 52px;
      background: #1c3a27; color: #fff;
      border: none; border-radius: 14px;
      font-family: 'Inter', sans-serif;
      font-size: 15px; font-weight: 500;
      cursor: pointer; margin-top: 16px;
      transition: background 0.2s, transform 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .bp-btn-primary:hover:not(:disabled) { background:#2d5a3d; transform:translateY(-1px); }
    .bp-btn-primary:disabled { opacity:0.65; cursor:default; }

    /* Amber return button */
    .bp-btn-amber {
      width: 100%; height: 52px;
      background: #b45309; color: #fff;
      border: none; border-radius: 14px;
      font-family: 'Inter', sans-serif;
      font-size: 15px; font-weight: 500;
      cursor: pointer; margin-top: 16px;
      transition: background 0.2s, transform 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .bp-btn-amber:hover:not(:disabled) { background:#92400e; transform:translateY(-1px); }
    .bp-btn-amber:disabled { opacity:0.65; cursor:default; }

    /* Outline secondary */
    .bp-btn-outline {
      width: 100%; height: 44px;
      background: #fff; color: #1c3a27;
      border: 1.5px solid rgba(28,58,39,0.3); border-radius: 14px;
      font-family: 'Inter', sans-serif;
      font-size: 14px; font-weight: 500;
      cursor: pointer; margin-top: 10px;
      transition: border-color 0.2s, background 0.2s;
      display: flex; align-items: center; justify-content: center;
    }
    .bp-btn-outline:hover { border-color:#1c3a27; background:rgba(28,58,39,0.03); }
    .bp-btn-outline:disabled { opacity:0.5; cursor:not-allowed; }

    /* Try-another link */
    .bp-try-link {
      background:none; border:none; padding:0;
      font-family:'Inter',sans-serif; font-size:13px;
      color:#5a6b5e; cursor:pointer; margin-top:16px;
      text-decoration:underline; text-underline-offset:2px;
    }
    .bp-try-link:hover { color:#1c3a27; }

    /* Google button full-width */
    .bp-google-wrap .gsi-material-button { width:100%!important; }

    /* Responsive */
    @media (max-width:768px) {
      .bp-card { padding: 28px !important; }
    }
    @media (max-width:480px) {
      .bp-card { margin:16px !important; border-radius:20px !important; }
    }
  `;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function BorrowPage() {
  const { user, login, updateWallet } = useAuth();
  const navigate    = useNavigate();
  const [sp]        = useSearchParams();
  const cupId       = sp.get('cupId');

  const [cup,          setCup]          = useState(null);
  const [cupLoading,   setCupLoading]   = useState(true);
  const [cupNotFound,  setCupNotFound]  = useState(false);
  const [processing,   setProcessing]   = useState(false);
  const [error,        setError]        = useState('');
  const [borrowResult, setBorrowResult] = useState(null);
  const [returnResult, setReturnResult] = useState(null);

  /* ── Load cup ── */
  useEffect(() => {
    if (!cupId) { navigate('/enter-cup', { replace: true }); return; }
    setCupNotFound(false); setCup(null); setCupLoading(true);
    getCup(cupId)
      .then(r  => setCup(r.data.cup))
      .catch(e => {
        if (e.response?.status === 404) setCupNotFound(true);
        else setError(e.response?.data?.message || 'Something went wrong');
      })
      .finally(() => setCupLoading(false));
  }, [cupId, navigate]);

  /* ── Auto-proceed after login via ProtectedRoute ── */
  useEffect(() => {
    if (!user || !cup) return;
    if (!sessionStorage.getItem('takeback_auto_proceed')) return;
    if (borrowResult || returnResult) return;
    const run = async () => {
      sessionStorage.removeItem('takeback_auto_proceed');
      if (cup.status === 'pending') return;
      setError(''); setProcessing(true);
      try {
        if (cup.status === 'borrowed') {
          await returnCup(cupId);
          setReturnResult({ isNewUser: false });
        } else if (cup.status === 'available') {
          if (user.wallet < 150) return;
          const b = await borrowCup(cupId);
          updateWallet(b.data.wallet);
          setBorrowResult({ wallet: b.data.wallet });
        }
      } catch (e) { setError(e.response?.data?.message || 'Something went wrong'); }
      finally { setProcessing(false); }
    };
    run();
  }, [user, cup, cupId, borrowResult, returnResult, updateWallet]);

  /* ── Handlers ── */
  const handleBorrowLogin = async (cr) => {
    setError(''); setProcessing(true);
    try {
      const a = await googleAuth(cr.credential);
      login(a.data.user, a.data.token);
      const rd = sessionStorage.getItem('takeback_redirect');
      if (rd) { sessionStorage.removeItem('takeback_redirect'); navigate(rd); return; }
      const b = await borrowCup(cupId);
      updateWallet(b.data.wallet);
      setBorrowResult({ wallet: b.data.wallet });
    } catch (e) { setError(e.response?.data?.message || 'Something went wrong'); }
    finally { setProcessing(false); }
  };

  const handleReturnLogin = async (cr) => {
    setError(''); setProcessing(true);
    try {
      const a = await googleAuth(cr.credential);
      login(a.data.user, a.data.token);
      const rd = sessionStorage.getItem('takeback_redirect');
      if (rd) { sessionStorage.removeItem('takeback_redirect'); navigate(rd); return; }
      await returnCup(cupId);
      setReturnResult({ isNewUser: a.data.isNewUser });
    } catch (e) { setError(e.response?.data?.message || 'Something went wrong'); }
    finally { setProcessing(false); }
  };

  const handleDirectBorrow = async () => {
    setError(''); setProcessing(true);
    try {
      const b = await borrowCup(cupId);
      updateWallet(b.data.wallet);
      setBorrowResult({ wallet: b.data.wallet });
    } catch (e) { setError(e.response?.data?.message || 'Something went wrong'); }
    finally { setProcessing(false); }
  };

  const handleDirectReturn = async () => {
    setError(''); setProcessing(true);
    try { await returnCup(cupId); setReturnResult({ isNewUser: false }); }
    catch (e) { setError(e.response?.data?.message || 'Something went wrong'); }
    finally { setProcessing(false); }
  };

  /* ══════════════════════════════════
     LOADING
  ══════════════════════════════════ */
  if (cupLoading) return (
    <Page>
      <Card>
        <CardLogo />
        <div style={c.spinnerWrap}><div style={c.spinner} /></div>
        <p style={c.dimText}>Finding your cup…</p>
      </Card>
    </Page>
  );

  /* ══════════════════════════════════
     NOT FOUND
  ══════════════════════════════════ */
  if (cupNotFound) return (
    <Page>
      <Card>
        <CardLogo />
        <StatusIcon bg="#fef2f2" color="#dc2626">🔍</StatusIcon>
        <h2 style={c.heading}>Cup Not Found</h2>
        <p style={c.body}>
          We couldn&apos;t find cup <strong>{cupId}</strong>.
          <br />Please check the code and try again.
        </p>
        <button className="bp-btn-primary" onClick={() => navigate('/enter-cup')}>
          Try Another Code
        </button>
      </Card>
    </Page>
  );

  /* ══════════════════════════════════
     PENDING STATE
  ══════════════════════════════════ */
  if (cup?.status === 'pending') return (
    <Page>
      <Card>
        <CardLogo />
        <CupBadge id={cup.cupId} />
        <StatusIcon bg="#fffbeb" color="#b45309">⏳</StatusIcon>
        <h2 style={c.heading}>Return in Progress</h2>
        <p style={c.body}>
          This cup is already being processed for return.
          Please hand it to a Takeback representative.
        </p>
        <InfoBox bg="#fffbeb" border="#fde68a" color="#92400e">
          🕐 Our staff will confirm receipt and credit your wallet shortly.
        </InfoBox>
      </Card>
    </Page>
  );

  /* ══════════════════════════════════
     BORROW SUCCESS
  ══════════════════════════════════ */
  if (borrowResult) return (
    <Page>
      <Card>
        <CardLogo />
        <StatusIcon bg="#c8e6d0" color="#1c3a27">✓</StatusIcon>
        <h2 style={{ ...c.heading, color: '#1c3a27' }}>Cup borrowed!</h2>
        <p style={c.body}>Enjoy your drink. Return any Takeback cup to earn cashback.</p>
        <div style={c.receipt}>
          <ReceiptRow label="Deposit deducted"  value="−₹150"                  color="#dc2626" />
          <div style={c.receiptDivider} />
          <ReceiptRow label="Remaining balance" value={`₹${borrowResult.wallet}`} color="#1c3a27" bold />
        </div>
        <InfoBox bg="#fffbeb" border="#fde68a" color="#92400e">
          💡 Return any Takeback cup at a partner café to earn <strong>₹50 cashback</strong>!
        </InfoBox>
      </Card>
    </Page>
  );

  /* ══════════════════════════════════
     RETURN SUCCESS
  ══════════════════════════════════ */
  if (returnResult) return (
    <Page>
      <Card>
        <CardLogo />
        <StatusIcon bg="#fffbeb" color="#b45309">⏳</StatusIcon>
        {returnResult.isNewUser ? (
          <>
            <h2 style={{ ...c.heading, color: '#b45309' }}>Welcome to Takeback! 🎉</h2>
            <p style={c.body}>You've been registered! Your return request has been submitted.</p>
          </>
        ) : (
          <h2 style={{ ...c.heading, color: '#b45309' }}>Return Request Submitted!</h2>
        )}
        <InfoBox bg="#fffbeb" border="#fde68a" color="#92400e">
          📋 Our team will verify your cup shortly.{' '}
          <strong>₹50 will be credited</strong> to your Takeback wallet once verified.
        </InfoBox>
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#5a6b5e', textAlign: 'center', lineHeight: 1.5 }}>
          You'll see the credit in your wallet once a representative confirms receipt.
        </p>
      </Card>
    </Page>
  );

  const isReturn = cup?.status === 'borrowed';

  /* ══════════════════════════════════
     RETURN FLOW  (cup is borrowed)
  ══════════════════════════════════ */
  if (isReturn) return (
    <Page>
      <Card>
        <CardLogo />
        <CupBadge id={cup.cupId} bg="#fef3c7" color="#92400e" />
        <StatusIcon bg="#fffbeb" color="#b45309">🔄</StatusIcon>
        <h2 style={{ ...c.heading, color: '#b45309' }}>Return this cup</h2>
        <p style={c.body}>
          Earn <strong style={{ color: '#b45309' }}>₹50 cashback</strong> added to your Takeback wallet.
        </p>
        <InfoBox bg="#fffbeb" border="#fde68a" color="#92400e">
          💰 Cashback will be added after staff verification.
        </InfoBox>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {user ? (
          <>
            <UserGreeting user={user} />
            <button
              className="bp-btn-amber"
              disabled={processing}
              onClick={handleDirectReturn}
            >
              {processing ? <><Spinner />Processing…</> : 'Confirm Return'}
            </button>
          </>
        ) : (
          <GoogleBlock
            onSuccess={handleReturnLogin}
            onError={() => setError('Google sign-in failed. Please try again.')}
            processing={processing}
          />
        )}
        <button className="bp-try-link" onClick={() => navigate('/enter-cup')}>
          Wrong cup? Enter a different code
        </button>
      </Card>
    </Page>
  );

  /* ══════════════════════════════════
     BORROW FLOW  (cup is available)
  ══════════════════════════════════ */
  return (
    <Page>
      <Card>
        <CardLogo />
        <CupBadge id={cup.cupId} />
        <h2 style={c.heading}>Borrow this cup</h2>
        <p style={c.body}>
          {user ? 'Confirm borrow below.' : 'Sign in with Google to continue.'}
        </p>

        {!user && (
          <InfoBox bg="#f5f2eb" border="transparent" color="#5a6b5e" style={{ marginBottom: 20 }}>
            🎁 New members start with free wallet credit.
          </InfoBox>
        )}

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {user ? (
          <>
            <UserGreeting user={user} />
            {/* Wallet balance */}
            <div style={c.walletBox}>
              <span style={{ fontSize: 13, color: '#5a6b5e' }}>Wallet balance</span>
              <span style={{ fontWeight: 700, color: '#1c3a27', fontSize: 15 }}>
                ₹{user.wallet}
              </span>
            </div>
            {user.wallet < 150 ? (
              <div style={c.warnBox}>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
                  Insufficient balance. You need ₹150 to borrow.
                </p>
                <button
                  className="bp-btn-primary"
                  onClick={() => navigate('/wallet')}
                  style={{ background: '#1c3a27', width: '100%' }}
                >
                  Recharge Wallet →
                </button>
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#5a6b5e', textAlign: 'center' }}>
                  ₹150 will be held as a deposit
                </p>
                <button
                  className="bp-btn-primary"
                  disabled={processing}
                  onClick={handleDirectBorrow}
                >
                  {processing ? <><Spinner />Processing…</> : 'Confirm Borrow'}
                </button>
              </>
            )}
          </>
        ) : (
          <GoogleBlock
            onSuccess={handleBorrowLogin}
            onError={() => setError('Google sign-in failed. Please try again.')}
            processing={processing}
          />
        )}

        <button className="bp-try-link" onClick={() => navigate('/enter-cup')}>
          Wrong cup? Enter a different code
        </button>
      </Card>
    </Page>
  );
}

/* ════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
════════════════════════════════════════════════════ */

function Page({ children }) {
  return <div style={c.page}>{children}</div>;
}

function Card({ children }) {
  return <div className="bp-card" style={c.card}>{children}</div>;
}

function CardLogo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: '#1c3a27' }}>
          Take
        </span>
        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: '#4caf7d' }}>
          back
        </span>
      </div>
      <p style={{ margin: '3px 0 0', fontSize: 12, color: '#5a6b5e', fontFamily: "'Inter',sans-serif" }}>
        Borrow smart. Return kind.
      </p>
    </div>
  );
}

function CupBadge({ id, bg = '#c8e6d0', color = '#1c3a27' }) {
  return (
    <div style={{
      display: 'inline-block',
      background: bg, color,
      borderRadius: 100, padding: '6px 16px',
      fontFamily: "'Inter',sans-serif",
      fontSize: 13, fontWeight: 600,
      marginBottom: 20, letterSpacing: 0.5,
    }}>
      Cup #{id}
    </div>
  );
}

function StatusIcon({ bg, color, children }) {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24, fontWeight: 700, marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function InfoBox({ bg, border, color, children }) {
  return (
    <div style={{
      width: '100%', boxSizing: 'border-box',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12, padding: '14px 16px',
      marginBottom: 16,
      fontFamily: "'Inter',sans-serif",
      fontSize: 13, color,
      lineHeight: 1.6,
    }}>
      {children}
    </div>
  );
}

function ErrorBanner({ children }) {
  return (
    <div style={{
      width: '100%', boxSizing: 'border-box',
      background: '#fef2f2', border: '1px solid #fecaca',
      borderRadius: 10, padding: '10px 14px',
      marginBottom: 14,
      fontFamily: "'Inter',sans-serif",
      fontSize: 13, color: '#dc2626',
      textAlign: 'center',
    }}>
      {children}
    </div>
  );
}

function UserGreeting({ user }) {
  return (
    <div style={{
      width: '100%', boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#f5f2eb', borderRadius: 12,
      padding: '12px 14px', marginBottom: 16,
    }}>
      {user.picture && (
        <img
          src={user.picture} alt=""
          style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #4caf7d' }}
          referrerPolicy="no-referrer"
        />
      )}
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 500, color: '#1c3a27' }}>
        Hi, {user.name} 👋
      </span>
    </div>
  );
}

function ReceiptRow({ label, value, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#5a6b5e' }}>{label}</span>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: bold ? 700 : 600, color }}>
        {value}
      </span>
    </div>
  );
}

function GoogleBlock({ onSuccess, onError, processing }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, margin: '8px 0' }}>
      {processing ? (
        <div style={c.spinnerWrap}><div style={c.spinner} /></div>
      ) : (
        <div className="bp-google-wrap" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
          />
        </div>
      )}
      <p style={{ margin: 0, fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#5a6b5e' }}>
        We only access your name and email
      </p>
    </div>
  );
}

function Spinner() {
  return <div style={c.spinnerInline} />;
}

/* ════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════ */
const c = {
  page: {
    minHeight: '100vh',
    background: '#f0ede6',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingLeft: 16,
    paddingRight: 16,
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#ffffff',
    borderRadius: 24,
    padding: '44px',
    maxWidth: 460,
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 8px 40px rgba(28,58,39,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  heading: {
    margin: '0 0 8px',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700, fontSize: 26,
    color: '#1c3a27', textAlign: 'center',
  },
  body: {
    margin: '0 0 20px',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14, color: '#5a6b5e',
    textAlign: 'center', lineHeight: 1.6,
  },

  walletBox: {
    width: '100%', boxSizing: 'border-box',
    background: '#f5f2eb', borderRadius: 12,
    padding: '14px 16px', marginBottom: 4,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontFamily: "'Inter', sans-serif",
  },

  warnBox: {
    width: '100%', boxSizing: 'border-box',
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 12, padding: '14px 16px',
    marginTop: 8,
  },

  receipt: {
    width: '100%', boxSizing: 'border-box',
    background: '#f5f2eb', borderRadius: 12,
    padding: '16px 18px', margin: '16px 0',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  receiptDivider: {
    height: 1, background: 'rgba(28,58,39,0.1)', margin: '8px 0',
  },

  dimText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14, color: '#5a6b5e', textAlign: 'center',
    margin: '8px 0 0',
  },

  spinnerWrap: {
    display: 'flex', justifyContent: 'center',
    padding: '16px 0',
  },
  spinner: {
    width: 32, height: 32,
    border: '3px solid #c8e6d0',
    borderTopColor: '#1c3a27',
    borderRadius: '50%',
    animation: 'bp-spin 0.8s linear infinite',
  },
  spinnerInline: {
    width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'bp-spin 0.8s linear infinite',
    flexShrink: 0,
  },
};
