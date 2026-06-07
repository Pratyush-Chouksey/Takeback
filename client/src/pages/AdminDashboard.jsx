import { useState, useEffect, useCallback } from 'react';

const BASE       = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ADMIN_KEY  = 'takeback-admin-2024';
const H          = { 'x-admin-key': ADMIN_KEY };

async function apiFetch(path) {
  const r = await fetch(`${BASE}${path}`, { headers: H });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const fmt = d => d
  ? new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
  : '—';
const fmtS = d => d
  ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
  : '—';
const today = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

const NAV = [
  { key:'overview',     label:'Overview'     },
  { key:'cups',         label:'Cups'         },
  { key:'users',        label:'Users'        },
  { key:'transactions', label:'Transactions' },
];

const STATUS_STYLE = {
  available: { background:'#c8e6d0', color:'#1c3a27' },
  borrowed:  { background:'#fef3c7', color:'#92400e' },
  pending:   { background:'#ede9fe', color:'#5b21b6' },
};

const TYPE_STYLE = {
  borrow:   { background:'#fef3c7', color:'#92400e' },
  return:   { background:'#c8e6d0', color:'#1c3a27' },
  recharge: { background:'#ede9fe', color:'#5b21b6' },
};

export default function AdminDashboard() {
  const [section, setSection]         = useState('overview');
  const [stats,   setStats]           = useState({ total:0, available:0, borrowed:0, pending:0 });
  const [cups,    setCups]            = useState([]);
  const [users,   setUsers]           = useState([]);
  const [txns,    setTxns]            = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState('');
  const [filter,  setFilter]          = useState('all');
  const [confirm, setConfirm]         = useState(null);
  const [toast,   setToast]           = useState('');

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const loadAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [sR, cR, uR, tR] = await Promise.all([
        apiFetch('/api/admin/cups/stats'),
        apiFetch('/api/admin/cups'),
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/transactions'),
      ]);
      setStats(sR.stats);
      setCups(cR.cups);
      setUsers(uR.users);
      setTxns(tR.transactions);
    } catch {
      setError('Could not load data. Check server connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const verify = async id => {
    try {
      const r = await fetch(`${BASE}/api/admin/cups/${id}/verify`, { method:'PATCH', headers: H });
      const data = await r.json();
      await loadAll();
      showToast(`✓ ₹50 credited to ${data.user?.name || 'user'}`);
    } catch { alert('Failed to verify'); }
  };

  const markReturned = async id => {
    try {
      await fetch(`${BASE}/api/admin/cups/${id}/mark-returned`, { method:'PATCH', headers: H });
      await loadAll();
      showToast('Cup marked as returned. No credit given.');
    } catch { alert('Failed to mark returned'); }
    setConfirm(null);
  };

  const filtered = filter === 'all' ? cups : cups.filter(c => c.status === filter);

  /* ── styles ── */
  const sidebarItem = active => ({
    padding:'11px 16px', borderRadius:12, marginBottom:4,
    cursor:'pointer', display:'flex', alignItems:'center', gap:12,
    fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:500,
    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
    color:      active ? '#fff' : 'rgba(255,255,255,0.6)',
    boxShadow:  active ? 'inset 3px 0 0 #4caf7d' : 'none',
    transition: 'all 0.15s',
  });

  const pill = (bg, color) => ({
    background:bg, color, borderRadius:100,
    padding:'3px 10px', fontFamily:"'Inter',sans-serif",
    fontSize:12, fontWeight:500, display:'inline-block',
  });

  const cardStyle = {
    background:'#fff', borderRadius:20,
    border:'1px solid rgba(28,58,39,0.08)',
    overflow:'hidden',
  };

  const thStyle = {
    textAlign:'left', padding:'10px 20px',
    background:'#f5f2eb', fontFamily:"'Inter',sans-serif",
    fontSize:11, color:'#5a6b5e', textTransform:'uppercase',
    letterSpacing:'0.8px', fontWeight:500, whiteSpace:'nowrap',
  };

  const tdStyle = {
    padding:'0 20px', height:52, verticalAlign:'middle',
    fontFamily:"'Inter',sans-serif", fontSize:14, color:'#1c3a27',
    borderBottom:'1px solid rgba(28,58,39,0.05)',
  };

  /* ── render ── */
  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden', fontFamily:"'Inter',sans-serif" }}>

      {/* ════ SIDEBAR ════ */}
      <div style={{ width:256, minWidth:256, background:'#1c3a27', height:'100vh', display:'flex', flexDirection:'column', flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding:'28px 24px 0' }}>
          <div style={{ display:'flex', alignItems:'baseline' }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:'#fff' }}>Take</span>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:'#4caf7d' }}>back</span>
          </div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1.5px', marginTop:4 }}>
            Admin Console
          </div>
          <div style={{ height:1, background:'rgba(255,255,255,0.1)', margin:'16px 0' }} />
        </div>

        {/* Nav */}
        <div style={{ padding:'0 12px', flex:1 }}>
          {NAV.map(n => (
            <div
              key={n.key}
              style={sidebarItem(section === n.key)}
              onClick={() => setSection(n.key)}
              onMouseEnter={e => { if (section !== n.key) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (section !== n.key) e.currentTarget.style.background = 'transparent'; }}
            >
              {n.label}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop:'auto', padding:'20px 24px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#4caf7d', flexShrink:0 }} />
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:'rgba(255,255,255,0.4)' }}>System Online</span>
          </div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'rgba(255,255,255,0.2)', marginTop:4 }}>v1.0.0</div>
        </div>
      </div>

      {/* ════ MAIN ════ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#f0ede6' }}>

        {/* Top bar */}
        <div style={{ height:64, background:'#fff', borderBottom:'1px solid rgba(28,58,39,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 36px', flexShrink:0 }}>
          <h1 style={{ margin:0, fontFamily:"'Playfair Display',serif", fontWeight:600, fontSize:20, color:'#1c3a27' }}>
            {NAV.find(n => n.key === section)?.label}
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ background:'#f5f2eb', color:'#5a6b5e', borderRadius:100, padding:'6px 16px', fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500 }}>
              {today}
            </span>
            <button
              onClick={loadAll}
              style={{ display:'flex', alignItems:'center', gap:6, background:'#f5f2eb', color:'#5a6b5e', border:'none', borderRadius:100, padding:'6px 16px', fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, cursor:'pointer' }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:'auto', padding:'32px 36px' }}>

          {error && (
            <div style={{ padding:'14px 20px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, color:'#dc2626', fontFamily:"'Inter',sans-serif", fontSize:14, marginBottom:24, lineHeight:1.6 }}>
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            /* Shimmer skeletons */
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ background:'#e8e4dc', borderRadius:20, height:120, animation:'pulse 1.5s ease-in-out infinite' }} />
              ))}
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {section === 'overview' && (
                <>
                  {/* Stat cards */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:28 }}>
                    {[
                      { label:'TOTAL CUPS',  val:stats.total,     sub:'in circulation' },
                      { label:'AVAILABLE',   val:stats.available,  sub:'ready to borrow' },
                      { label:'BORROWED',    val:stats.borrowed,   sub:'currently out' },
                      { label:'PENDING',     val:stats.pending,    sub:'awaiting return' },
                    ].map(c => (
                      <div key={c.label} style={{ background:'#fff', borderRadius:20, padding:24, border:'1px solid rgba(28,58,39,0.08)' }}>
                        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:'#5a6b5e', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>{c.label}</div>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:40, color:'#1c3a27', lineHeight:1 }}>{c.val ?? 0}</div>
                        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:'#5a6b5e', marginTop:4 }}>{c.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent txns */}
                  {txns.length > 0 && (
                    <div style={cardStyle}>
                      <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(28,58,39,0.06)' }}>
                        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:600, fontSize:16, color:'#1c3a27' }}>Recent Transactions</span>
                      </div>
                      <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                          <thead><tr>
                            {['User','Cup ID','Type','Amount','Time'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {txns.slice(0,10).map(tx => (
                              <tr key={tx._id}>
                                <td style={tdStyle}>{tx.userId?.name || '—'}<br/><span style={{ fontSize:12, color:'#5a6b5e' }}>{tx.userId?.email}</span></td>
                                <td style={tdStyle}><span style={{ fontFamily:'monospace', fontWeight:600, fontSize:13 }}>{tx.cupId}</span></td>
                                <td style={tdStyle}><span style={{ ...pill((TYPE_STYLE[tx.type]||{background:'#f5f2eb',color:'#5a6b5e'}).background,(TYPE_STYLE[tx.type]||{background:'#f5f2eb',color:'#5a6b5e'}).color), textTransform:'capitalize' }}>{tx.type}</span></td>
                                <td style={tdStyle}><span style={{ fontWeight:700, color:tx.amount < 0 ? '#dc2626' : '#4caf7d' }}>{tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}</span></td>
                                <td style={tdStyle}><span style={{ fontSize:12, color:'#5a6b5e' }}>{fmt(tx.timestamp)}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── CUPS ── */}
              {section === 'cups' && (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:600, fontSize:20, color:'#1c3a27' }}>Cups</span>
                      <span style={pill('#c8e6d0','#1c3a27')}>{stats.total}</span>
                    </div>
                    <div style={{ display:'inline-flex', background:'#fff', borderRadius:12, padding:4, border:'1px solid rgba(28,58,39,0.1)' }}>
                      {['all','available','borrowed','pending'].map(f => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          style={{ padding:'7px 16px', borderRadius:8, fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, cursor:'pointer', border:'none', background: filter===f ? '#1c3a27' : 'transparent', color: filter===f ? '#fff' : '#5a6b5e', transition:'all 0.15s' }}
                        >
                          {f.charAt(0).toUpperCase()+f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr>
                          {['Cup ID','Status','Borrowed By','Since','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {filtered.map(cup => (
                            <tr key={cup.cupId}>
                              <td style={tdStyle}><span style={{ fontFamily:'monospace', fontWeight:600, fontSize:13 }}>{cup.cupId}</span></td>
                              <td style={tdStyle}>
                                <span style={{ ...(STATUS_STYLE[cup.status]||{background:'#f5f2eb',color:'#5a6b5e'}), borderRadius:100, padding:'3px 10px', fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, textTransform:'capitalize' }}>
                                  {cup.status}
                                </span>
                              </td>
                              <td style={tdStyle}>
                                {cup.borrowedBy ? <><span style={{ fontWeight:500 }}>{cup.borrowedBy.name}</span><br/><span style={{ fontSize:12, color:'#5a6b5e' }}>{cup.borrowedBy.email}</span></> : <span style={{ color:'#ccc' }}>—</span>}
                              </td>
                              <td style={tdStyle}><span style={{ fontSize:12, color:'#5a6b5e' }}>{fmt(cup.borrowedAt)}</span></td>
                              <td style={tdStyle}>
                                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                  {(cup.status==='borrowed'||cup.status==='pending') && (
                                    <button onClick={() => setConfirm(cup.cupId)} style={{ padding:'6px 14px', border:'1px solid rgba(28,58,39,0.2)', color:'#5a6b5e', background:'#fff', borderRadius:8, fontFamily:"'Inter',sans-serif", fontSize:12, cursor:'pointer' }}>
                                      Mark Returned
                                    </button>
                                  )}
                                  {cup.status==='pending' && (
                                    <button onClick={() => verify(cup.cupId)} style={{ padding:'6px 14px', background:'#c8e6d0', color:'#1c3a27', border:'none', borderRadius:8, fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, cursor:'pointer' }}>
                                      ✓ Verify & Credit ₹50
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr><td colSpan={5} style={{ ...tdStyle, textAlign:'center', color:'#5a6b5e', padding:'36px 20px' }}>No cups found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ── USERS ── */}
              {section === 'users' && (
                <div style={cardStyle}>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead><tr>
                        {['Name','Email','Wallet','Joined'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id}>
                            <td style={{ ...tdStyle, fontWeight:600 }}>{u.name}</td>
                            <td style={tdStyle}><span style={{ fontSize:13, color:'#5a6b5e' }}>{u.email}</span></td>
                            <td style={tdStyle}><span style={{ fontWeight:600, color:'#4caf7d' }}>₹{u.wallet}</span></td>
                            <td style={tdStyle}><span style={{ fontSize:12, color:'#5a6b5e' }}>{fmtS(u.createdAt)}</span></td>
                          </tr>
                        ))}
                        {users.length === 0 && <tr><td colSpan={4} style={{ ...tdStyle, textAlign:'center', color:'#5a6b5e', padding:'36px 20px' }}>No users yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── TRANSACTIONS ── */}
              {section === 'transactions' && (
                <div style={cardStyle}>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead><tr>
                        {['User','Cup ID','Type','Amount','Date'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {txns.map(tx => (
                          <tr key={tx._id}>
                            <td style={tdStyle}>{tx.userId?.name || '—'}<br/><span style={{ fontSize:12, color:'#5a6b5e' }}>{tx.userId?.email}</span></td>
                            <td style={tdStyle}><span style={{ fontFamily:'monospace', fontWeight:600, fontSize:13 }}>{tx.cupId}</span></td>
                            <td style={tdStyle}>
                              <span style={{ ...(TYPE_STYLE[tx.type]||{background:'#f5f2eb',color:'#5a6b5e'}), borderRadius:100, padding:'3px 10px', fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:500, textTransform:'capitalize' }}>
                                {tx.type}
                              </span>
                            </td>
                            <td style={tdStyle}><span style={{ fontWeight:700, color:tx.amount < 0 ? '#dc2626' : '#4caf7d' }}>{tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}</span></td>
                            <td style={tdStyle}><span style={{ fontSize:12, color:'#5a6b5e' }}>{fmt(tx.timestamp)}</span></td>
                          </tr>
                        ))}
                        {txns.length === 0 && <tr><td colSpan={5} style={{ ...tdStyle, textAlign:'center', color:'#5a6b5e', padding:'36px 20px' }}>No transactions yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════ CONFIRM DIALOG ════ */}
      {confirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:380, width:'calc(100% - 32px)', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin:'0 0 8px', fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:'#1c3a27' }}>Confirm Action</h3>
            <p style={{ margin:'0 0 24px', fontFamily:"'Inter',sans-serif", fontSize:14, color:'#5a6b5e', lineHeight:1.6 }}>
              Mark <strong>{confirm}</strong> as returned? No wallet credit will be given.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex:1, padding:11, borderRadius:12, border:'1.5px solid rgba(28,58,39,0.2)', background:'#fff', color:'#5a6b5e', fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:500, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={() => markReturned(confirm)} style={{ flex:1, padding:11, borderRadius:12, border:'none', background:'#1c3a27', color:'#fff', fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:500, cursor:'pointer' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ TOAST ════ */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#1c3a27', color:'#fff', padding:'12px 28px', borderRadius:100, fontSize:14, fontWeight:500, fontFamily:"'Inter',sans-serif", boxShadow:'0 4px 20px rgba(0,0,0,0.2)', whiteSpace:'nowrap', zIndex:9999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
