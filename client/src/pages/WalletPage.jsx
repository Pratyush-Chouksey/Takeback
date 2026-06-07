import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const IS_DEV = import.meta.env.VITE_RAZORPAY_KEY_ID === 'rzp_test_placeholder';
const AMOUNTS = [100, 200, 500];

const WALLET_CSS = `
  @media (max-width: 480px) {
    .wlt-card { padding: 28px 20px !important; border-radius: 20px !important; }
    .wlt-amount-btn { font-size: 15px !important; padding: 13px 0 !important; }
    .wlt-pay-btn { font-size: 14px !important; }
  }
  @media (max-width: 360px) {
    .wlt-card { padding: 20px 14px !important; }
  }
`;

export default function WalletPage() {
  const navigate = useNavigate();
  const { user, updateWallet } = useAuth();
  const [selected,   setSelected]   = useState(200);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);
  const [newBalance, setNewBalance] = useState(0);

  const wallet = user?.wallet ?? 0;

  async function handleRecharge() {
    setLoading(true); setError('');
    try {
      /* ── Dev / placeholder key bypass ── */
      if (IS_DEV) {
        setTimeout(async () => {
          try {
            const res = await api.post('/api/wallet/verify-dev', { amount: selected });
            updateWallet(res.data.wallet);
            setNewBalance(res.data.wallet);
            setSuccess(true);
          } catch {
            setError('Dev recharge failed. Is the server running?');
          } finally { setLoading(false); }
        }, 1800);
        return;
      }

      /* ── Real Razorpay flow ── */
      const { data } = await api.post('/api/wallet/create-order', { amount: selected });
      const options = {
        key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:      selected * 100,
        currency:    'INR',
        name:        'Takeback',
        description: `Wallet recharge — ₹${selected}`,
        order_id:    data.order.id,
        handler: async function(response) {
          try {
            const verify = await api.post('/api/wallet/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              amount:              selected,
            });
            updateWallet(verify.data.wallet);
            setNewBalance(verify.data.wallet);
            setSuccess(true);
          } catch {
            setError('Payment done but verification failed. Contact support.');
          } finally { setLoading(false); }
        },
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme:   { color: '#1c3a27' },
        modal:   { ondismiss: () => { setLoading(false); setError('Payment cancelled.'); } },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', r => {
        setError(`Payment failed: ${r.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  /* ── page / card shared styles ── */
  const page = { minHeight:'100vh', background:'#f0ede6', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'Inter',sans-serif" };
  const card = { background:'#fff', borderRadius:24, padding:'44px', maxWidth:440, width:'100%', boxShadow:'0 8px 40px rgba(28,58,39,0.08)' };
  const logo = { display:'flex', justifyContent:'center', alignItems:'baseline', marginBottom:4 };
  const div  = { height:1, background:'#f0ede6', margin:'16px 0' };

  /* ── SUCCESS STATE ── */
  if (success) return (
    <div style={page}>
      <style>{WALLET_CSS}</style>
      <div className="wlt-card" style={card}>
        {/* ✓ circle */}
        <div style={{ width:60, height:60, borderRadius:'50%', background:'#1c3a27', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, color:'#fff', margin:'0 auto 20px' }}>✓</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:'#1c3a27', textAlign:'center', margin:'0 0 8px' }}>Payment Successful!</h2>
        <p style={{ textAlign:'center', fontSize:15, color:'#5a6b5e', margin:'0 0 20px' }}>₹{selected} has been added to your wallet</p>
        {/* New balance box */}
        <div style={{ background:'#f5f2eb', borderRadius:12, padding:'14px 16px', textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:14, color:'#5a6b5e', marginBottom:4 }}>New wallet balance</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:32, color:'#1c3a27' }}>₹{newBalance}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={() => navigate('/enter-cup')} style={{ background:'#1c3a27', color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontSize:15, fontWeight:500, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
            Borrow a Cup →
          </button>
          <button onClick={() => navigate('/')} style={{ background:'transparent', color:'#5a6b5e', border:'1.5px solid rgba(28,58,39,0.2)', borderRadius:14, padding:'13px 0', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
            Back to home
          </button>
        </div>
        <p style={{ textAlign:'center', fontSize:11, color:'rgba(28,58,39,0.4)', marginTop:16 }}>🔒 Secured by Razorpay</p>
      </div>
    </div>
  );

  /* ── MAIN RECHARGE FORM ── */
  const projected = wallet + selected;
  const cupsAfter = Math.floor(projected / 150);

  return (
    <div style={page}>
      <style>{WALLET_CSS}</style>
      <div className="wlt-card" style={card}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', fontSize:13, color:'#5a6b5e', cursor:'pointer', padding:0, marginBottom:24, display:'flex', alignItems:'center', gap:6, fontFamily:"'Inter',sans-serif" }}>
          ← Back
        </button>

        {/* Logo */}
        <div style={logo}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:'#1c3a27' }}>Take</span>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:'#4caf7d' }}>back</span>
        </div>

        <div style={div} />

        {/* Heading */}
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:26, color:'#1c3a27', textAlign:'center', margin:'0 0 8px' }}>Recharge Wallet</h1>

        {/* Current balance */}
        <p style={{ textAlign:'center', fontSize:14, color:'#5a6b5e', marginBottom:28 }}>
          Current balance: <span style={{ color:'#1c3a27', fontWeight:600 }}>₹{wallet}</span>
        </p>

        {/* Amount picker label */}
        <p style={{ fontSize:13, color:'#5a6b5e', fontWeight:500, marginBottom:12 }}>Select amount</p>

        {/* Amount buttons */}
        <div style={{ display:'flex', gap:10 }}>
          {AMOUNTS.map(amt => (
            <button
              key={amt}
              className="wlt-amount-btn"
              onClick={() => setSelected(amt)}
              style={{
                flex:1, padding:'16px 0', borderRadius:14, cursor:'pointer',
                fontFamily:"'Inter',sans-serif", fontSize:17, fontWeight:700,
                transition:'all 0.15s',
                background:   selected === amt ? '#f0ede6' : '#fff',
                color:        selected === amt ? '#1c3a27' : '#5a6b5e',
                border:       selected === amt ? '2px solid #1c3a27' : '1.5px solid rgba(28,58,39,0.15)',
              }}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        {/* Info box */}
        <div style={{ background:'#f5f2eb', borderRadius:12, padding:'12px 16px', marginTop:16, fontSize:13, color:'#5a6b5e', lineHeight:1.6 }}>
          After recharge: <strong style={{ color:'#1c3a27' }}>₹{projected}</strong>
          {projected >= 150 && (
            <span> · Enough to borrow <strong style={{ color:'#1c3a27' }}>{cupsAfter} cup{cupsAfter !== 1 ? 's' : ''}</strong> 🎉</span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', color:'#dc2626', fontSize:13, marginTop:12 }}>
            {error}
          </div>
        )}

        {/* Dev mode notice */}
        {IS_DEV && (
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'10px 14px', color:'#92400e', fontSize:12, marginTop:12, textAlign:'center' }}>
            🛠 Dev mode: payment will be simulated (no real Razorpay key set)
          </div>
        )}

        {/* Pay button */}
        <button
          className="wlt-pay-btn"
          onClick={handleRecharge}
          disabled={loading}
          style={{
            width:'100%', height:52, marginTop:20,
            background:'#1c3a27', color:'#fff', border:'none', borderRadius:14,
            fontFamily:"'Inter',sans-serif", fontSize:15, fontWeight:500, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, transition:'all 0.2s',
          }}
        >
          {loading ? 'Processing…' : `Pay ₹${selected} via UPI / Card`}
        </button>

        {/* Disclaimer */}
        <p style={{ textAlign:'center', fontSize:11, color:'rgba(28,58,39,0.4)', marginTop:16 }}>🔒 Secured by Razorpay</p>
      </div>
    </div>
  );
}
