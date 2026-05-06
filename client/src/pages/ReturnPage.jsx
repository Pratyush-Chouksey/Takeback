import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sendOtp, verifyOtp, returnCup, setAuthToken } from '../api';

const BRAND = '#2D6A4F';
const BRAND_LIGHT = '#D8F3DC';
const BRAND_DARK = '#1B4332';

export default function ReturnPage({ user, setUser }) {
  const [searchParams] = useSearchParams();
  const urlCupId = searchParams.get('cupId') || '';

  // Auth state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Cup state
  const [cupId, setCupId] = useState(urlCupId);
  const [returning, setReturning] = useState(false);

  // Result
  const [returnResult, setReturnResult] = useState(null);

  // Errors
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    setError('');
    setSending(true);
    try {
      await sendOtp(phone.trim());
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  const [isNewUser, setIsNewUser] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    setError('');
    setVerifying(true);
    try {
      const res = await verifyOtp(phone.trim(), name.trim(), otp.trim());
      const { token, user: authUser } = res.data;

      localStorage.setItem('takeback_token', token);
      setAuthToken(token);
      setUser(authUser);
      setVerified(true);
      setIsNewUser(res.data.isNewUser);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleReturn = async () => {
    if (!cupId.trim()) {
      setError('Please enter the Cup ID');
      return;
    }
    setError('');
    setReturning(true);
    try {
      const res = await returnCup(cupId.trim().toUpperCase());
      setReturnResult({ wallet: res.data.wallet });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to return cup');
    } finally {
      setReturning(false);
    }
  };

  // ── Render: Success ──
  if (returnResult) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.iconCircle}>✓</div>

          {isNewUser ? (
            <>
              <h2 style={{ ...styles.heading, color: BRAND }}>Welcome to Takeback! 🎉</h2>
              <p style={{ ...styles.subtext, marginBottom: 12 }}>
                You've been registered and earned ₹50 for returning this cup
              </p>
              <div style={styles.receiptBox}>
                <div style={styles.receiptRow}>
                  <span>Starting balance</span>
                  <span style={{ color: '#555', fontWeight: 700 }}>₹200</span>
                </div>
                <div style={styles.divider} />
                <div style={styles.receiptRow}>
                  <span>Return cashback</span>
                  <span style={{ color: '#16A34A', fontWeight: 700 }}>+₹50</span>
                </div>
                <div style={styles.divider} />
                <div style={styles.receiptRow}>
                  <span>Your wallet</span>
                  <span style={{ color: BRAND, fontWeight: 700 }}>₹{returnResult.wallet}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ ...styles.heading, color: BRAND }}>Cup returned successfully!</h2>
              <div style={styles.receiptBox}>
                <div style={styles.receiptRow}>
                  <span>Cashback earned</span>
                  <span style={{ color: BRAND, fontWeight: 700 }}>+₹50</span>
                </div>
                <div style={styles.divider} />
                <div style={styles.receiptRow}>
                  <span>New balance</span>
                  <span style={{ color: BRAND, fontWeight: 700 }}>₹{returnResult.wallet}</span>
                </div>
              </div>
            </>
          )}

          <div style={styles.thankYouBox}>
            <span style={{ fontSize: '1.6rem' }}>🌱</span>
            <p style={styles.thankYouText}>
              Thank you for helping the planet! Every reuse counts towards a greener future.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Form ──
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.returnIcon}>♻</div>
        <h2 style={styles.heading}>Return a cup, earn ₹50!</h2>
        <p style={styles.subtext}>
          Drop off any Takeback cup and get ₹50 added to your wallet — even if it's not yours.
        </p>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Step 1: Phone */}
        {!verified ? (
          <>
            <div style={styles.stepBadge}>Step 1 — Verify your identity</div>

            <div style={styles.field}>
              <label style={styles.label}>Your Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={otpSent}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Phone Number</label>
              <input
                style={styles.input}
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
              />
            </div>

            {!otpSent ? (
              <button
                style={{ ...styles.btn, opacity: sending ? 0.7 : 1 }}
                onClick={handleSendOtp}
                disabled={sending}
              >
                {sending ? 'Sending…' : 'Send OTP'}
              </button>
            ) : (
              <>
                <div style={styles.otpSentNote}>
                  ✓ OTP sent to {phone}{' '}
                  <span style={styles.otpHint}>(use 1234 for demo)</span>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Enter OTP</label>
                  <input
                    style={{
                      ...styles.input,
                      textAlign: 'center',
                      letterSpacing: '8px',
                      fontSize: '1.3rem',
                    }}
                    type="text"
                    placeholder="••••"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>

                <button
                  style={{ ...styles.btn, opacity: verifying ? 0.7 : 1 }}
                  onClick={handleVerifyOtp}
                  disabled={verifying}
                >
                  {verifying ? 'Verifying…' : 'Verify OTP'}
                </button>
              </>
            )}
          </>
        ) : (
          /* Step 2: Cup ID & Return */
          <>
            <div style={styles.verifiedBanner}>
              <span>✓</span> Logged in as <strong>{user?.name || phone}</strong>
              {user?.wallet != null && (
                <span style={styles.walletInline}>₹{user.wallet}</span>
              )}
            </div>

            <div style={styles.stepBadge}>Step 2 — Identify the cup</div>

            <div style={styles.field}>
              <label style={styles.label}>Cup ID</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. CUP_001"
                value={cupId}
                onChange={(e) => setCupId(e.target.value)}
              />
              {urlCupId && (
                <p style={styles.autoFillHint}>Auto-filled from QR code</p>
              )}
            </div>

            <button
              style={{ ...styles.btn, opacity: returning ? 0.7 : 1 }}
              onClick={handleReturn}
              disabled={returning}
            >
              {returning ? 'Processing…' : 'Confirm Return'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────
const styles = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '32px 16px',
    background: '#f5f7f5',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#fff',
    borderRadius: '16px',
    padding: '32px 28px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  returnIcon: {
    fontSize: '2.4rem',
    marginBottom: '8px',
  },
  heading: {
    margin: '0 0 8px',
    fontSize: '1.4rem',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtext: {
    margin: '0 0 24px',
    fontSize: '0.9rem',
    color: '#666',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: BRAND,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '14px',
    background: BRAND_LIGHT,
    padding: '4px 12px',
    borderRadius: '12px',
  },
  field: {
    width: '100%',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#555',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '14px',
    background: BRAND,
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'opacity 0.2s',
  },
  errorBox: {
    width: '100%',
    padding: '10px 14px',
    background: '#fdecea',
    color: '#c0392b',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '16px',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  otpSentNote: {
    width: '100%',
    padding: '10px 14px',
    background: BRAND_LIGHT,
    color: BRAND_DARK,
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '16px',
    textAlign: 'center',
    fontWeight: 500,
    boxSizing: 'border-box',
  },
  otpHint: {
    fontWeight: 400,
    opacity: 0.7,
    fontSize: '0.8rem',
  },
  verifiedBanner: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: BRAND_LIGHT,
    color: BRAND_DARK,
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 500,
    marginBottom: '20px',
    boxSizing: 'border-box',
    flexWrap: 'wrap',
  },
  walletInline: {
    marginLeft: 'auto',
    background: '#fff',
    padding: '2px 10px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '0.8rem',
    color: BRAND,
  },
  autoFillHint: {
    margin: '4px 0 0',
    fontSize: '0.75rem',
    color: '#999',
    fontStyle: 'italic',
  },
  // Success screen
  iconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: BRAND_LIGHT,
    color: BRAND,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    fontWeight: 700,
    marginBottom: '16px',
  },
  receiptBox: {
    width: '100%',
    background: '#fafafa',
    borderRadius: '10px',
    padding: '16px 20px',
    margin: '16px 0',
    boxSizing: 'border-box',
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    padding: '4px 0',
  },
  divider: {
    height: '1px',
    background: '#e0e0e0',
    margin: '8px 0',
  },
  thankYouBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#E8F5E9',
    borderRadius: '10px',
    padding: '16px',
    width: '100%',
    boxSizing: 'border-box',
  },
  thankYouText: {
    margin: 0,
    fontSize: '0.9rem',
    color: BRAND_DARK,
    lineHeight: 1.5,
  },
};
