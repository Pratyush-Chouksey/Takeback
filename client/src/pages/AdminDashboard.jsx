import { useState, useEffect } from 'react';
import { getCupStats, getAdminCups, getAdminUsers, getAdminTransactions, verifyCupReturn, markCupReturned } from '../api';

const CSS = `
@keyframes ad-spin { to { transform: rotate(360deg); } }
@keyframes ad-fade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.ad-nav-btn { display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:12px;margin-bottom:4px;cursor:pointer;transition:all 0.15s;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;background:transparent;border:none;color:rgba(255,255,255,0.6);width:100%;text-align:left; }
.ad-nav-btn:hover { background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.9); }
.ad-nav-btn.active { background:rgba(255,255,255,0.12);color:#fff;box-shadow:inset 3px 0 0 #4caf7d; }
.ad-stat-card { background:#fff;border-radius:20px;padding:28px 24px;border:1px solid rgba(28,58,39,0.08);transition:all 0.2s;cursor:default;overflow:hidden;position:relative; }
.ad-stat-card:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(28,58,39,0.08); }
.ad-tr:hover td { background:#f5f2eb !important; }
.ad-mark-btn { padding:6px 14px;border:1px solid rgba(28,58,39,0.2);color:#5a6b5e;background:#fff;border-radius:8px;font-family:'Inter',sans-serif;font-size:12px;cursor:pointer;transition:all 0.15s;white-space:nowrap; }
.ad-mark-btn:hover { border-color:#1c3a27;color:#1c3a27; }
.ad-verify-btn { padding:6px 14px;background:#c8e6d0;color:#1c3a27;border:none;border-radius:8px;font-family:'Inter',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s;white-space:nowrap; }
.ad-verify-btn:hover { background:#4caf7d;color:#fff; }
.ad-filter-tab { padding:7px 16px;border-radius:9px;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;background:transparent;border:none;color:#5a6b5e; }
.ad-filter-tab.active { background:#1c3a27;color:#fff; }
.ad-filter-tab:not(.active):hover { background:rgba(28,58,39,0.06); }
.ad-refresh-btn { display:flex;align-items:center;gap:6px;background:#f5f2eb;color:#5a6b5e;border:none;border-radius:100px;padding:6px 16px;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s; }
.ad-refresh-btn:hover { background:#e8e4dc;color:#1c3a27; }
.ad-confirm-cancel { flex:1;padding:11px;border-radius:12px;border:1.5px solid rgba(28,58,39,0.2);background:#fff;color:#5a6b5e;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all 0.15s; }
.ad-confirm-cancel:hover { border-color:#1c3a27;color:#1c3a27; }
.ad-confirm-ok { flex:1;padding:11px;border-radius:12px;border:none;background:#1c3a27;color:#fff;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:background 0.15s; }
.ad-confirm-ok:hover { background:#2d5a3d; }
@media (max-width:1024px) {
  .ad-sidebar { width:64px !important; }
  .ad-sidebar .ad-nav-label, .ad-sidebar .ad-side-head-text, .ad-sidebar .ad-side-footer-text { display:none !important; }
  .ad-sidebar .ad-nav-btn { justify-content:center;padding:12px; }
  .ad-main { margin-left:0; }
}
@media (max-width:768px) {
  .ad-sidebar { display:none !important; }
  .ad-bottom-tabs { display:flex !important; }
  .ad-content-area { padding:20px 16px !important; }
  .ad-topbar { padding:0 16px !important; }
  .ad-stats-grid { grid-template-columns:1fr 1fr !important; }
}
.ad-bottom-tabs { display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;background:#1c3a27;border-top:1px solid rgba(255,255,255,0.1);height:56px;align-items:stretch; }
.ad-bottom-tab { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:none;background:transparent;cursor:pointer;color:rgba(255,255,255,0.5);font-family:'Inter',sans-serif;font-size:10px;font-weight:500;transition:color 0.15s; }
.ad-bottom-tab.active { color:#4caf7d; }
`;

const TABS = [
  { key: 'overview',     label: 'Overview',     icon: '▦' },
  { key: 'cups',         label: 'Cups',          icon: '◎' },
  { key: 'users',        label: 'Users',         icon: '◉' },
  { key: 'transactions', label: 'Transactions',  icon: '≡' },
];

const STATUS_BADGE = {
  available: { bg:'#c8e6d0', c:'#1c3a27' },
  borrowed:  { bg:'#fef3c7', c:'#92400e' },
  pending:   { bg:'#ede9fe', c:'#5b21b6' },
};

const TYPE_BADGE = {
  borrow:   { bg:'#fef3c7', c:'#92400e' },
  return:   { bg:'#c8e6d0', c:'#1c3a27' },
  recharge: { bg:'#ede9fe', c:'#5b21b6' },
};

const STAT_ACCENT = {
  'Total Cups': '#5a6b5e',
  'Available':  '#4caf7d',
  'Borrowed':   '#d97706',
  'Pending':    '#7c3aed',
};

export default function AdminDashboard() {
  const [tab, setTab]               = useState('overview');
  const [stats, setStats]           = useState({ total: 0, available: 0, borrowed: 0, pending: 0 });
  const [cups, setCups]             = useState([]);
  const [users, setUsers]           = useState([]);
  const [txns, setTxns]             = useState([]);
  const [cupFilter, setCupFilter]   = useState('all');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState('');
  const [confirmCup, setConfirmCup] = useState(null);

  const load = async (t) => {
    setLoading(true); setError('');
    try {
      if (t === 'overview') {
        const [sr, tr] = await Promise.all([getCupStats(), getAdminTransactions()]);
        setStats(sr.data.stats);
        setTxns(tr.data.transactions);
      } else if (t === 'cups') {
        const [cr, sr] = await Promise.all([getAdminCups(), getCupStats()]);
        setCups(cr.data.cups); setStats(sr.data.stats);
      } else if (t === 'users') {
        const r = await getAdminUsers(); setUsers(r.data.users);
      } else {
        const r = await getAdminTransactions(); setTxns(r.data.transactions);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Could not connect to server. Check your connection.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(tab); }, [tab]);

  const refreshCups = async () => {
    const [cr, sr] = await Promise.all([getAdminCups(), getCupStats()]);
    setCups(cr.data.cups); setStats(sr.data.stats);
  };

  const verify = async (id) => {
    try {
      const r = await verifyCupReturn(id); await refreshCups();
      showToast(`✓ ₹50 credited to ${r.data.user?.name || 'user'}`);
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const markReturned = async (id) => {
    try { await markCupReturned(id); await refreshCups(); showToast('Cup marked returned. No credit.'); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const filtered = cupFilter === 'all' ? cups : cups.filter(c => c.status === cupFilter);
  const fmtDate  = d => d ? new Date(d).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
  const fmtShort = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
  const today    = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});

  return (
    <>
      <style>{CSS}</style>
      <div style={{display:'flex',height:'100vh',minHeight:'100vh',overflow:'hidden',fontFamily:"'Inter',sans-serif",background:'#f0ede6',position:'relative'}}>

        {/* ── Sidebar ── */}
        <aside className="ad-sidebar" style={{width:256,minWidth:256,background:'#1c3a27',display:'flex',flexDirection:'column',height:'100vh',boxSizing:'border-box',flexShrink:0,transition:'width 0.2s'}}>
          {/* Logo */}
          <div style={{padding:'28px 24px 0'}}>
            <div style={{display:'flex',alignItems:'baseline'}}>
              <span className="ad-side-head-text" style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:'#fff'}}>Take</span>
              <span className="ad-side-head-text" style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:'#4caf7d'}}>back</span>
            </div>
            <div className="ad-side-head-text" style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'1.5px',marginTop:4}}>Admin Console</div>
            <div style={{height:1,background:'rgba(255,255,255,0.1)',margin:'20px 0'}} />
          </div>
          {/* Nav */}
          <nav style={{padding:'0 12px',flex:1}}>
            {TABS.map(t => (
              <button key={t.key} className={`ad-nav-btn${tab===t.key?' active':''}`} onClick={() => setTab(t.key)}>
                <span style={{fontSize:16,flexShrink:0}}>{t.icon}</span>
                <span className="ad-nav-label">{t.label}</span>
              </button>
            ))}
          </nav>
          {/* Footer */}
          <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',padding:'20px 24px',marginTop:'auto'}}>
            <div className="ad-side-footer-text" style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#4caf7d',flexShrink:0}} />
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:'rgba(255,255,255,0.4)'}}>System Online</span>
            </div>
            <div className="ad-side-footer-text" style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:'rgba(255,255,255,0.2)',marginTop:4}}>v1.0.0</div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
          {/* Topbar */}
          <div className="ad-topbar" style={{height:64,background:'#fff',borderBottom:'1px solid rgba(28,58,39,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 36px',flexShrink:0}}>
            <h1 style={{margin:0,fontFamily:"'Playfair Display',serif",fontWeight:600,fontSize:20,color:'#1c3a27'}}>
              {TABS.find(t => t.key === tab)?.label}
            </h1>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{background:'#f5f2eb',color:'#5a6b5e',borderRadius:100,padding:'6px 16px',fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:500}}>{today}</span>
              <button className="ad-refresh-btn" onClick={() => load(tab)}>
                <span style={{fontSize:14}}>↻</span> Refresh
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="ad-content-area" style={{flex:1,overflowY:'auto',background:'#f0ede6',padding:'32px 36px',paddingBottom:72}}>
            {error && (
              <div style={{padding:'16px 20px',background:'#fef2f2',color:'#dc2626',borderRadius:12,fontSize:14,marginBottom:24,border:'1px solid #fecaca',fontFamily:"'Inter',sans-serif",lineHeight:1.6}}>
                ⚠️ {error}
              </div>
            )}
            {loading ? <SkeletonGrid /> : (
              <>
                {tab==='overview'     && <Overview stats={stats} txns={txns} fmtDate={fmtDate} />}
                {tab==='cups'         && <Cups cups={filtered} filter={cupFilter} setFilter={setCupFilter} verify={verify} openConfirm={setConfirmCup} fmt={fmtDate} stats={stats} />}
                {tab==='users'        && <Users users={users} fmt={fmtShort} />}
                {tab==='transactions' && <TxnsTable txns={txns} fmt={fmtDate} />}
              </>
            )}
          </div>
        </div>

        {/* Mobile bottom tabs */}
        <div className="ad-bottom-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`ad-bottom-tab${tab===t.key?' active':''}`} onClick={() => setTab(t.key)}>
              <span style={{fontSize:18}}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'#1c3a27',color:'#fff',padding:'12px 28px',borderRadius:100,fontSize:14,fontWeight:500,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,0.2)',whiteSpace:'nowrap',fontFamily:"'Inter',sans-serif",animation:'ad-fade 0.2s ease both'}}>{toast}</div>}

      {/* Confirm modal */}
      {confirmCup && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200,animation:'ad-fade 0.2s ease both'}}>
          <div style={{width:'calc(100% - 32px)',maxWidth:380,background:'#fff',borderRadius:20,padding:32,boxSizing:'border-box',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>
            <h3 style={{margin:0,fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:'#1c3a27'}}>Confirm Action</h3>
            <p style={{margin:'8px 0 24px',fontFamily:"'Inter',sans-serif",fontSize:14,color:'#5a6b5e',lineHeight:1.6}}>Mark <strong>{confirmCup}</strong> as returned? No wallet credit will be given.</p>
            <div style={{display:'flex',gap:10}}>
              <button className="ad-confirm-cancel" onClick={() => setConfirmCup(null)}>Cancel</button>
              <button className="ad-confirm-ok" onClick={async () => { await markReturned(confirmCup); setConfirmCup(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Overview ── */
function Overview({ stats, txns, fmtDate }) {
  const cards = [
    { label:'Total Cups',  val:stats.total,     icon:'🥤', sub:'in circulation' },
    { label:'Available',   val:stats.available,  icon:'✅', sub:'ready to borrow' },
    { label:'Borrowed',    val:stats.borrowed,   icon:'🔄', sub:'currently out' },
    { label:'Pending',     val:stats.pending,    icon:'⏳', sub:'awaiting return' },
  ];
  return (
    <>
      <div className="ad-stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,marginBottom:24}}>
        {cards.map(cd => (
          <div key={cd.label} className="ad-stat-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:'#5a6b5e',textTransform:'uppercase',letterSpacing:'0.8px',fontWeight:500}}>{cd.label}</span>
              <div style={{width:36,height:36,borderRadius:'50%',background:'#f5f2eb',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{cd.icon}</div>
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'clamp(32px,3vw,44px)',color:'#1c3a27',lineHeight:1,margin:'0 0 4px'}}>{cd.val}</div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:'#5a6b5e'}}>{cd.sub}</div>
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,borderRadius:'0 0 20px 20px',background:STAT_ACCENT[cd.label]}} />
          </div>
        ))}
      </div>
      {txns.length > 0 && (
        <div style={{background:'#fff',borderRadius:20,border:'1px solid rgba(28,58,39,0.08)',overflow:'hidden'}}>
          <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(28,58,39,0.06)'}}>
            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:600,fontSize:16,color:'#1c3a27'}}>Recent Transactions</span>
          </div>
          <TxnsTable txns={txns.slice(0,10)} fmt={fmtDate} />
        </div>
      )}
    </>
  );
}

/* ── Cups ── */
function Cups({ cups, filter, setFilter, verify, openConfirm, fmt, stats }) {
  const filters = ['all','available','borrowed','pending'];
  const counts  = { all:stats?.total??0, available:stats?.available??0, borrowed:stats?.borrowed??0, pending:stats?.pending??0 };
  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:600,fontSize:20,color:'#1c3a27'}}>Cups</span>
          <span style={{background:'#c8e6d0',color:'#1c3a27',borderRadius:100,padding:'3px 10px',fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:500}}>{stats?.total ?? 0}</span>
        </div>
        <div style={{display:'inline-flex',background:'#fff',borderRadius:12,padding:4,border:'1px solid rgba(28,58,39,0.1)'}}>
          {filters.map(f => (
            <button key={f} className={`ad-filter-tab${filter===f?' active':''}`} onClick={() => setFilter(f)}>
              {f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
      </div>
      <TableCard>
        <Table heads={['Cup ID','Status','Borrowed By','Since','Actions']}>
          {cups.map(cup => (
            <tr key={cup.cupId} className="ad-tr">
              <Td><span style={{fontFamily:'monospace',fontWeight:600,fontSize:13,color:'#1c3a27'}}>{cup.cupId}</span></Td>
              <Td><StatusBadge s={cup.status} /></Td>
              <Td>{cup.borrowedBy ? <><span style={{fontSize:14,color:'#1c3a27',fontWeight:500}}>{cup.borrowedBy.name}</span><br/><span style={{fontSize:12,color:'#5a6b5e'}}>{cup.borrowedBy.email}</span></> : <span style={{color:'#d0ccc5'}}>—</span>}</Td>
              <Td><span style={{fontSize:12,color:'#5a6b5e'}}>{fmt(cup.borrowedAt)}</span></Td>
              <Td>
                {(cup.status==='borrowed'||cup.status==='pending') && (
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button className="ad-mark-btn" onClick={() => openConfirm(cup.cupId)}>Mark Returned</button>
                    {cup.status==='pending' && <button className="ad-verify-btn" onClick={() => verify(cup.cupId)}>✓ Verify & Credit ₹50</button>}
                  </div>
                )}
              </Td>
            </tr>
          ))}
          {cups.length===0 && <EmptyRow cols={5} msg="No cups found" />}
        </Table>
      </TableCard>
    </>
  );
}

/* ── Users ── */
function Users({ users, fmt }) {
  return (
    <TableCard>
      <Table heads={['Name','Email','Wallet','Joined']}>
        {users.map(u => (
          <tr key={u._id} className="ad-tr">
            <Td><span style={{fontWeight:600,color:'#1c3a27'}}>{u.name}</span></Td>
            <Td><span style={{fontSize:13,color:'#5a6b5e'}}>{u.email}</span></Td>
            <Td><span style={{fontWeight:600,color:'#4caf7d',fontFamily:"'Inter',sans-serif"}}>₹{u.wallet}</span></Td>
            <Td><span style={{fontSize:12,color:'#5a6b5e'}}>{fmt(u.createdAt)}</span></Td>
          </tr>
        ))}
        {users.length===0 && <EmptyRow cols={4} msg="No users yet" />}
      </Table>
    </TableCard>
  );
}

/* ── Transactions ── */
function TxnsTable({ txns, fmt }) {
  return (
    <TableCard>
      <Table heads={['User','Cup ID','Type','Amount','Date']}>
        {txns.map(tx => {
          const tb = TYPE_BADGE[tx.type] || { bg:'#f5f2eb', c:'#5a6b5e' };
          return (
            <tr key={tx._id} className="ad-tr">
              <Td>{tx.userId ? <><span style={{fontWeight:500,color:'#1c3a27'}}>{tx.userId.name}</span><br/><span style={{fontSize:12,color:'#5a6b5e'}}>{tx.userId.email}</span></> : <span style={{color:'#d0ccc5'}}>Unknown</span>}</Td>
              <Td><span style={{fontFamily:'monospace',fontSize:13,fontWeight:600,color:'#1c3a27'}}>{tx.cupId}</span></Td>
              <Td><span style={{background:tb.bg,color:tb.c,borderRadius:100,padding:'3px 10px',fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:500,textTransform:'capitalize'}}>{tx.type}</span></Td>
              <Td><span style={{fontWeight:700,color:tx.amount<0?'#dc2626':'#4caf7d'}}>{tx.amount>0?'+':''}₹{Math.abs(tx.amount)}</span></Td>
              <Td><span style={{fontSize:12,color:'#5a6b5e'}}>{fmt(tx.timestamp)}</span></Td>
            </tr>
          );
        })}
        {txns.length===0 && <EmptyRow cols={5} msg="No transactions yet" />}
      </Table>
    </TableCard>
  );
}

/* ── Skeletons ── */
function SkeletonGrid() {
  const shimmer = { background:'linear-gradient(90deg,#f5f2eb 25%,#ede9e2 50%,#f5f2eb 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite', borderRadius:12 };
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{background:'#fff',borderRadius:20,padding:28,border:'1px solid rgba(28,58,39,0.08)'}}>
          <div style={{...shimmer,height:12,width:'60%',marginBottom:16}} />
          <div style={{...shimmer,height:44,width:'40%',marginBottom:8}} />
          <div style={{...shimmer,height:10,width:'50%'}} />
        </div>
      ))}
    </div>
  );
}

/* ── Shared primitives ── */
function TableCard({ children }) {
  return <div style={{background:'#fff',borderRadius:20,border:'1px solid rgba(28,58,39,0.08)',overflow:'hidden'}}>{children}</div>;
}

function Table({ heads, children }) {
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
        <thead><tr>{heads.map(h => <th key={h} style={{textAlign:'left',padding:'13px 20px',background:'#f5f2eb',fontFamily:"'Inter',sans-serif",fontSize:11,color:'#5a6b5e',textTransform:'uppercase',letterSpacing:'0.8px',fontWeight:500,whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children }) {
  return <td style={{padding:'0 20px',height:58,verticalAlign:'middle',borderBottom:'1px solid rgba(28,58,39,0.05)',fontFamily:"'Inter',sans-serif",color:'#1c3a27'}}>{children}</td>;
}

function StatusBadge({ s }) {
  const b = STATUS_BADGE[s] || { bg:'#f5f2eb', c:'#5a6b5e' };
  return <span style={{background:b.bg,color:b.c,borderRadius:100,padding:'4px 12px',fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:500,textTransform:'capitalize'}}>{s}</span>;
}

function EmptyRow({ cols, msg }) {
  return <tr><td colSpan={cols} style={{padding:'36px 20px',textAlign:'center',color:'#5a6b5e',fontFamily:"'Inter',sans-serif",fontSize:14}}>{msg}</td></tr>;
}
