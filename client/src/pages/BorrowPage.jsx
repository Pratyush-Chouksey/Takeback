import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { getCup, googleAuth, borrowCup, returnCup } from '../api';
import { useAuth } from '../context/AuthContext';

const BRAND = '#2D6A4F';
const BRAND_LIGHT = '#E8F5E9';
const BRAND_DARK = '#1B4332';
const BG = '#F8FAF9';
const RET = '#F59E0B';
const RET_LIGHT = '#FEF3C7';

export default function BorrowPage() {
  const { user, login, updateWallet } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cupId = searchParams.get('cupId');

  const [cup, setCup] = useState(null);
  const [cupLoading, setCupLoading] = useState(true);
  const [cupNotFound, setCupNotFound] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [borrowResult, setBorrowResult] = useState(null);
  const [returnResult, setReturnResult] = useState(null);

  useEffect(() => {
    if (!cupId) {
      navigate('/enter-cup', { replace: true });
      return;
    }

    setCupNotFound(false);
    setCup(null);
    setCupLoading(true);
    getCup(cupId)
      .then((r) => setCup(r.data.cup))
      .catch((e) => {
        if (e.response?.status === 404) setCupNotFound(true);
        else setError(e.response?.data?.message || 'Something went wrong');
      })
      .finally(() => setCupLoading(false));
  }, [cupId, navigate]);

  // If login happened via ProtectedRoute, auto-continue the intended flow.
  useEffect(() => {
    if (!user || !cup) return;
    if (!sessionStorage.getItem('takeback_auto_proceed')) return;
    if (borrowResult || returnResult) return;

    const run = async () => {
      sessionStorage.removeItem('takeback_auto_proceed');

      // Don't auto-call if return is pending.
      if (cup.status === 'pending') return;

      setError('');
      setProcessing(true);

      try {
        if (cup.status === 'borrowed') {
          await returnCup(cupId);
          setReturnResult({ isNewUser: false });
        } else if (cup.status === 'available') {
          if (user.wallet < 150) return; // Let the UI show the warning card.
          const b = await borrowCup(cupId);
          updateWallet(b.data.wallet);
          setBorrowResult({ wallet: b.data.wallet });
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Something went wrong');
      } finally {
        setProcessing(false);
      }
    };

    run();
  }, [user, cup, cupId, borrowResult, returnResult, updateWallet]);

  // Google login → borrow
  const handleBorrowLogin = async (credentialResponse) => {
    setError(''); setProcessing(true);
    try {
      const a = await googleAuth(credentialResponse.credential);
      login(a.data.user, a.data.token);

      const redirect = sessionStorage.getItem('takeback_redirect');
      if (redirect) {
        sessionStorage.removeItem('takeback_redirect');
        navigate(redirect);
        return;
      }

      const b = await borrowCup(cupId);
      updateWallet(b.data.wallet);
      setBorrowResult({ wallet: b.data.wallet });
    } catch (e) { setError(e.response?.data?.message || 'Something went wrong'); }
    finally { setProcessing(false); }
  };

  // Google login → return
  const handleReturnLogin = async (credentialResponse) => {
    setError(''); setProcessing(true);
    try {
      const a = await googleAuth(credentialResponse.credential);
      login(a.data.user, a.data.token);

      const redirect = sessionStorage.getItem('takeback_redirect');
      if (redirect) {
        sessionStorage.removeItem('takeback_redirect');
        navigate(redirect);
        return;
      }

      await returnCup(cupId);
      setReturnResult({ isNewUser: a.data.isNewUser });
    } catch (e) { setError(e.response?.data?.message || 'Something went wrong'); }
    finally { setProcessing(false); }
  };

  // If user is already logged in — allow direct borrow/return
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
    try {
      await returnCup(cupId);
      setReturnResult({ isNewUser: false });
    } catch (e) { setError(e.response?.data?.message || 'Something went wrong'); }
    finally { setProcessing(false); }
  };

  const isRet = cup?.status === 'borrowed';

  /* ── screens ── */
  if (cupLoading) return <Page><Card><Logo /><Spinner /><p style={st.dim}>Finding your cup…</p></Card></Page>;

  if (cupNotFound) return (
    <Page><Card>
      <Logo />
      <div style={{ fontSize: 48, marginBottom: 10 }}>🔍</div>
      <H style={{ color: '#111827' }}>Cup Not Found</H>
      <P>We couldn&apos;t find cup <strong>{cupId}</strong>. Please check the code.</P>
      <Btn onClick={() => navigate('/enter-cup')}>Try Another Code</Btn>
    </Card></Page>
  );

  if (cup?.status === 'pending') return (
    <Page><Card><Logo /><Pill id={cup.cupId} /><IconCircle bg="#FFF3E0" c="#E65100">⏳</IconCircle>
      <H>Return in Progress</H><P>This cup is already being processed for return. Please hand it to a Takeback representative.</P>
    </Card></Page>
  );

  if (borrowResult) return (
    <Page><Card><Logo /><IconCircle bg={BRAND_LIGHT} c={BRAND}>✓</IconCircle>
      <H style={{ color: BRAND }}>You've borrowed {cupId}!</H>
      <Receipt rows={[['Deposit deducted', '−₹150', '#DC2626'], ['Remaining balance', `₹${borrowResult.wallet}`, BRAND]]} />
      <Tip bg="#FFFBEB" border="#FEF3C7" icon="💡" color="#78350F">Return any Takeback cup at a partner café to earn <strong>₹50 cashback</strong>!</Tip>
    </Card></Page>
  );

  if (returnResult) return (
    <Page><Card><Logo /><IconCircle bg="#FEF3C7" c="#F59E0B">⏳</IconCircle>
      {returnResult.isNewUser ? (
        <>
          <H style={{ color: '#F59E0B' }}>Welcome to Takeback! 🎉</H>
          <P>You've been registered! Your return request has been submitted.</P>
        </>
      ) : (
        <H style={{ color: '#F59E0B' }}>Return Request Submitted!</H>
      )}
      <div style={{ width: '100%', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '18px 20px', marginTop: 8, marginBottom: 16, boxSizing: 'border-box' }}>
        <p style={{ margin: 0, fontSize: 14, color: '#92400E', lineHeight: 1.7, textAlign: 'center' }}>
          Our team will verify your cup shortly.<br />
          <strong>₹50 will be credited</strong> to your Takeback wallet once verified.
        </p>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 1.5 }}>
        You'll see the credit reflected in your wallet after the representative confirms receipt.
      </p>
    </Card></Page>
  );

  /* ── RETURN FLOW ── */
  if (isRet) return (
    <Page><Card>
      <Logo />
      <Pill id={cup.cupId} bg={RET_LIGHT} c="#92400E" />
      <div style={{ fontSize: '2rem', marginBottom: 4 }}>🔄</div>
      <H>Return this cup</H>
      <P>Earn <strong style={{ color: RET }}>₹50 cashback</strong> added to your Takeback wallet</P>
      {error && <Err>{error}</Err>}

      {user ? (
        <>
          <UserBadge user={user} />
          <Btn bg={RET} loading={processing} onClick={handleDirectReturn}>
            {processing ? 'Processing…' : 'Confirm Return'}
          </Btn>
        </>
      ) : (
        <GoogleSection
          onSuccess={handleReturnLogin}
          onError={() => setError('Google login failed. Please try again.')}
          processing={processing}
        />
      )}
    </Card></Page>
  );

  /* ── BORROW FLOW ── */
  return (
    <Page><Card>
      <Logo />
      <Pill id={cup.cupId} />
      {user ? (
        <>
          <UserBadge user={user} />
          <H>Borrow this cup</H>
          <div style={st.walletInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>💳</span>
              <span style={{ fontWeight: 700, color: '#333', fontSize: 14 }}>Your wallet:</span>
            </div>
            <span style={{ fontWeight: 900, color: BRAND, fontSize: '1.1rem' }}>Rs. {user.wallet}</span>
          </div>

          {user.wallet < 150 ? (
            <div style={st.warnCard}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#B91C1C' }}>Insufficient balance. You need Rs.150 to borrow.</div>
              <div style={{ marginTop: 6, fontSize: 14, color: '#991B1B', lineHeight: 1.6 }}>Recharge your wallet to continue.</div>
              <button style={st.warnBtn} onClick={() => { /* placeholder */ }} disabled>
                Recharge your wallet to continue
              </button>
            </div>
          ) : (
            <>
              <P>Rs.150 will be deducted from your wallet</P>
              <Btn loading={processing} onClick={handleDirectBorrow}>
                {processing ? 'Processing…' : 'Borrow This Cup'}
              </Btn>
            </>
          )}
        </>
      ) : (
        <>
          <H>Sign in with Google to borrow this cup</H>
          {error && <Err>{error}</Err>}
          <GoogleSection
            onSuccess={handleBorrowLogin}
            onError={() => setError('Google login failed. Please try again.')}
            processing={processing}
          />
        </>
      )}
    </Card></Page>
  );
}

/* ── Shared components ── */

function GoogleSection({ onSuccess, onError, processing }) {
  return (
    <div className="tb-bp-google" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 8 }}>
      {processing ? (
        <div style={{ padding: 16 }}><Spinner /></div>
      ) : (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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
      <p style={{ margin: 0, fontSize: 12, color: '#bbb' }}>We only access your name and email</p>
    </div>
  );
}

function UserBadge({ user }) {
  return (
    <div style={st.userBadge}>
      {user.picture && <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
      <span style={{ fontWeight: 800, fontSize: 14 }}>Hi, {user.name} 👋</span>
    </div>
  );
}

const Page = ({ children }) => <div style={st.page}>{children}</div>;
const Card = ({ children }) => <div style={st.card}>{children}</div>;
const H = ({ children, style }) => <h2 style={{ ...st.heading, ...style }}>{children}</h2>;
const P = ({ children }) => <p style={st.body}>{children}</p>;
const Err = ({ children }) => <div style={st.err}>{children}</div>;
const Spinner = () => <div style={st.spinner} />;

function Logo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: BRAND, letterSpacing: -0.5 }}>Takeback <span style={{ fontSize: 22 }}>🍃</span></h1>
      <p style={{ margin: '4px 0 0', fontSize: 14, color: '#999' }}>Borrow smart. Return kind.</p>
    </div>
  );
}

function Pill({ id, bg = '#E8F5E9', c = '#2D6A4F' }) {
  return <div style={{ background: bg, color: c, padding: '6px 20px', borderRadius: 20, fontWeight: 700, fontSize: 13, letterSpacing: 1.5, marginBottom: 12, fontFamily: 'monospace' }}>{id}</div>;
}

function IconCircle({ bg, c, children }) {
  return <div style={{ width: 68, height: 68, borderRadius: '50%', background: bg, color: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, marginBottom: 16 }}>{children}</div>;
}

function Btn({ children, bg = BRAND, loading, onClick }) {
  return <button style={{ ...st.btn, background: bg, opacity: loading ? 0.7 : 1 }} onClick={onClick} disabled={loading}>{children}</button>;
}

function Receipt({ rows }) {
  return (
    <div style={st.receipt}>
      {rows.map((r, i) => (
        <div key={i}>
          {i > 0 && <div style={{ height: 1, background: '#E5E5E5', margin: '10px 0' }} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, padding: '3px 0', color: '#444' }}>
            <span>{r[0]}</span><span style={{ fontWeight: 700, color: r[2] }}>{r[1]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Tip({ bg, border, icon, color, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: bg, borderRadius: 12, padding: '14px 16px', width: '100%', boxSizing: 'border-box', border: `1px solid ${border}` }}>
      <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      <p style={{ margin: 0, fontSize: 13, color, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

/* ── Styles ── */
const st = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', background: BG, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  card: { width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  heading: { margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#1a1a1a', textAlign: 'center' },
  body: { margin: '0 0 24px', fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 1.6 },
  btn: { width: '100%', height: 48, background: BRAND, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4, transition: 'opacity 0.2s' },
  err: { width: '100%', padding: '10px 16px', background: '#FEF2F2', color: '#DC2626', borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 16, textAlign: 'center', boxSizing: 'border-box', border: '1px solid #FECACA' },
  walletInfo: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: 12, padding: '12px 16px', marginBottom: 20, boxSizing: 'border-box' },
  receipt: { width: '100%', background: '#FAFAFA', borderRadius: 12, padding: '18px 20px', margin: '18px 0', boxSizing: 'border-box', border: '1px solid #F0F0F0' },
  userBadge: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: 10, padding: '10px 16px', marginBottom: 16, boxSizing: 'border-box', color: BRAND_DARK },
  dim: { color: '#aaa', fontSize: 14, fontWeight: 500 },
  spinner: { width: 36, height: 36, border: `3px solid ${BRAND_LIGHT}`, borderTopColor: BRAND, borderRadius: '50%', animation: 'tb-spin 0.8s linear infinite', marginBottom: 12 },
  warnCard: { width: '100%', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '16px 16px', boxSizing: 'border-box', marginTop: 12 },
  warnBtn: { marginTop: 10, width: '100%', height: 44, borderRadius: 12, border: '1.5px solid #FECACA', background: '#fff', color: '#991B1B', fontWeight: 900, cursor: 'not-allowed', opacity: 0.7 },
};

if (typeof document !== 'undefined' && !document.getElementById('tb-bp')) {
  const el = document.createElement('style'); el.id = 'tb-bp';
  el.textContent = `@keyframes tb-spin{to{transform:rotate(360deg)}}.tb-bp-google .gsi-material-button{width:100%!important}button:hover:not(:disabled){opacity:.85!important}button:active:not(:disabled){transform:scale(.985)}`;
  document.head.appendChild(el);
}
