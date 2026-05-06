import { useState, useEffect } from 'react';
import { getCupStats, getAdminCups, getAdminUsers, getAdminTransactions, verifyCupReturn } from '../api';

const BRAND = '#2D6A4F';
const ACCENT = '#52B788';
const BG = '#F8FAF9';

const TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'cups', label: 'Cups', icon: '☕' },
  { key: 'users', label: 'Users', icon: '👤' },
  { key: 'transactions', label: 'Transactions', icon: '📋' },
];

const STATUS = {
  available: { bg: '#E8F5E9', c: '#2D6A4F' },
  borrowed: { bg: '#FFF3E0', c: '#E65100' },
  pending: { bg: '#F3E5F5', c: '#6A1B9A' },
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [stats, setStats] = useState(null);
  const [cups, setCups] = useState([]);
  const [users, setUsers] = useState([]);
  const [txns, setTxns] = useState([]);
  const [cupFilter, setCupFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    const go = async () => {
      try {
        if (tab === 'overview') { const r = await getCupStats(); setStats(r.data.stats); }
        else if (tab === 'cups') { const r = await getAdminCups(); setCups(r.data.cups); }
        else if (tab === 'users') { const r = await getAdminUsers(); setUsers(r.data.users); }
        else { const r = await getAdminTransactions(); setTxns(r.data.transactions); }
      } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
      finally { setLoading(false); }
    };
    go();
  }, [tab]);

  const verify = async (id) => {
    try { await verifyCupReturn(id); const r = await getAdminCups(); setCups(r.data.cups); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const filtered = cupFilter === 'all' ? cups : cups.filter(c => c.status === cupFilter);

  const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div style={st.layout}>
      {mobileNav && <div style={st.overlay} onClick={() => setMobileNav(false)} />}

      {/* Sidebar */}
      <aside style={{ ...st.sidebar, ...(mobileNav ? st.sidebarShow : {}) }}>
        <div style={st.sideHead}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>♻ Takeback</div>
          <div style={{ fontSize: 14, color: ACCENT, fontWeight: 600, marginTop: 2 }}>Admin</div>
        </div>
        <nav style={st.sideNav}>
          {TABS.map(t => (
            <button key={t.key} style={{ ...st.navBtn, ...(tab === t.key ? st.navActive : {}) }}
              onClick={() => { setTab(t.key); setMobileNav(false); }}>
              <span style={{ width: 24, textAlign: 'center' }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main style={st.main}>
        <div style={st.topBar}>
          <button style={st.burger} onClick={() => setMobileNav(true)}>☰</button>
          <h1 style={st.pageTitle}>{TABS.find(t => t.key === tab)?.icon} {TABS.find(t => t.key === tab)?.label}</h1>
          <span style={st.adminBadge}>Admin Panel</span>
        </div>

        <div style={st.content}>
          {error && <div style={st.errBox}>{error}</div>}
          {loading ? <div style={st.loaderWrap}><div style={st.spinner} /></div> : (
            <>
              {tab === 'overview' && <Overview stats={stats} />}
              {tab === 'cups' && <Cups cups={filtered} filter={cupFilter} setFilter={setCupFilter} verify={verify} fmt={fmtDate} />}
              {tab === 'users' && <Users users={users} fmt={fmtShort} />}
              {tab === 'transactions' && <Txns txns={txns} fmt={fmtDate} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Overview ── */
function Overview({ stats }) {
  if (!stats) return null;
  const cards = [
    { label: 'Total Cups', val: stats.total, icon: '🥤', bg: '#ECEFF1', c: '#607D8B' },
    { label: 'Available', val: stats.available, icon: '✅', bg: '#E8F5E9', c: '#2E7D32' },
    { label: 'Borrowed', val: stats.borrowed, icon: '🔄', bg: '#FFF3E0', c: '#E65100' },
    { label: 'Pending Return', val: stats.pending, icon: '⏳', bg: '#F3E5F5', c: '#6A1B9A' },
  ];
  return (
    <div style={st.statsGrid}>
      {cards.map(cd => (
        <div key={cd.label} style={st.statCard}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{cd.icon}</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: cd.c }}>{cd.val}</div>
          <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>{cd.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Cups ── */
function Cups({ cups, filter, setFilter, verify, fmt }) {
  const filters = ['all', 'available', 'borrowed', 'pending'];
  return (
    <>
      <div style={st.filterBar}>
        {filters.map(f => (
          <button key={f} style={{ ...st.filterBtn, ...(filter === f ? st.filterActive : {}) }}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}{f === 'pending' ? ' Return' : ''}
          </button>
        ))}
      </div>
      <div style={st.tableWrap}>
        <table style={st.table}>
          <thead><tr>
            {['Cup ID', 'Status', 'Borrowed By', 'Borrowed At', 'Actions'].map(h => <th key={h} style={st.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {cups.map((cup, i) => (
              <tr key={cup.cupId} style={{ ...st.tr, background: i % 2 === 0 ? '#fff' : '#FAFBFA' }}>
                <td style={st.td}><span style={st.mono}>{cup.cupId}</span></td>
                <td style={st.td}><Badge status={cup.status} /></td>
                <td style={st.td}>{cup.borrowedBy ? <>{cup.borrowedBy.name}<br /><span style={st.sub}>{cup.borrowedBy.phone}</span></> : <span style={st.muted}>—</span>}</td>
                <td style={st.td}><span style={st.sub}>{fmt(cup.borrowedAt)}</span></td>
                <td style={st.td}>{cup.status === 'pending' && <button style={st.verifyBtn} onClick={() => verify(cup.cupId)}>✓ Verify Return</button>}</td>
              </tr>
            ))}
            {cups.length === 0 && <tr><td colSpan={5} style={st.empty}>No cups found</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ─── Users ── */
function Users({ users, fmt }) {
  return (
    <div style={st.tableWrap}>
      <table style={st.table}>
        <thead><tr>{['Name', 'Phone', 'Wallet', 'Joined'].map(h => <th key={h} style={st.th}>{h}</th>)}</tr></thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u._id} style={{ ...st.tr, background: i % 2 === 0 ? '#fff' : '#FAFBFA' }}>
              <td style={{ ...st.td, fontWeight: 600 }}>{u.name}</td>
              <td style={st.td}>{u.phone}</td>
              <td style={st.td}><span style={{ fontWeight: 700, color: BRAND }}>₹{u.wallet}</span></td>
              <td style={st.td}><span style={st.sub}>{fmt(u.createdAt)}</span></td>
            </tr>
          ))}
          {users.length === 0 && <tr><td colSpan={4} style={st.empty}>No users yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Transactions ── */
function Txns({ txns, fmt }) {
  return (
    <div style={st.tableWrap}>
      <table style={st.table}>
        <thead><tr>{['User', 'Cup', 'Type', 'Amount', 'Time'].map(h => <th key={h} style={st.th}>{h}</th>)}</tr></thead>
        <tbody>
          {txns.map((tx, i) => (
            <tr key={tx._id} style={{ ...st.tr, background: i % 2 === 0 ? '#fff' : '#FAFBFA' }}>
              <td style={st.td}>{tx.userId ? <>{tx.userId.name}<br /><span style={st.sub}>{tx.userId.phone}</span></> : <span style={st.muted}>Unknown</span>}</td>
              <td style={st.td}><span style={st.mono}>{tx.cupId}</span></td>
              <td style={st.td}><span style={{ ...st.typeBadge, background: tx.type === 'borrow' ? '#FFF3E0' : '#E8F5E9', color: tx.type === 'borrow' ? '#E65100' : '#2E7D32' }}>{tx.type}</span></td>
              <td style={st.td}><span style={{ fontWeight: 700, color: tx.amount < 0 ? '#DC2626' : '#16A34A' }}>{tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}</span></td>
              <td style={st.td}><span style={st.sub}>{fmt(tx.timestamp)}</span></td>
            </tr>
          ))}
          {txns.length === 0 && <tr><td colSpan={5} style={st.empty}>No transactions yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ status }) {
  const s = STATUS[status] || { bg: '#eee', c: '#666' };
  return <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: s.bg, color: s.c, textTransform: 'capitalize' }}>{status}</span>;
}

/* ─── Styles ── */
const st = {
  layout: { display: 'flex', minHeight: 'calc(100vh - 56px)', background: BG, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },

  /* Sidebar */
  sidebar: { width: 240, minWidth: 240, background: BRAND, display: 'flex', flexDirection: 'column', position: 'sticky', top: 56, height: 'calc(100vh - 56px)', boxSizing: 'border-box', zIndex: 200, transition: 'transform 0.25s' },
  sidebarShow: { position: 'fixed', top: 0, left: 0, height: '100vh', transform: 'translateX(0)' },
  sideHead: { padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  sideNav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '16px 10px' },
  navBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'transparent', color: 'rgba(255,255,255,0.65)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left', borderLeft: '3px solid transparent', transition: 'all 0.15s' },
  navActive: { background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600, borderLeftColor: ACCENT },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 190 },

  /* Main */
  main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', gap: 16, padding: '20px 32px', background: '#fff', borderBottom: '1px solid #eee' },
  burger: { display: 'none', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4 },
  pageTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a1a', flex: 1 },
  adminBadge: { fontSize: 12, fontWeight: 600, color: BRAND, background: '#E8F5E9', padding: '4px 12px', borderRadius: 12 },
  content: { padding: 32, flex: 1 },

  /* Stats */
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 },
  statCard: { background: '#fff', borderRadius: 16, padding: 24, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },

  /* Filters */
  filterBar: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filterBtn: { padding: '8px 18px', borderRadius: 20, border: '1.5px solid #ddd', background: '#fff', color: '#777', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  filterActive: { background: BRAND, color: '#fff', borderColor: BRAND },

  /* Table */
  tableWrap: { overflowX: 'auto', borderRadius: 16, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '14px 16px', background: '#F1F5F3', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f5f5f5', height: 56, transition: 'background 0.1s' },
  td: { padding: '12px 16px', verticalAlign: 'middle', color: '#333' },
  empty: { padding: '36px 16px', textAlign: 'center', color: '#bbb', fontSize: 14 },
  mono: { fontFamily: 'monospace', fontWeight: 600, fontSize: 13, background: '#f5f5f5', padding: '3px 10px', borderRadius: 6 },
  sub: { fontSize: 12, color: '#999' },
  muted: { color: '#ddd' },
  typeBadge: { display: 'inline-block', padding: '4px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' },
  verifyBtn: { padding: '6px 14px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' },

  /* Misc */
  errBox: { padding: '10px 16px', background: '#FEF2F2', color: '#DC2626', borderRadius: 10, fontSize: 14, marginBottom: 20, border: '1px solid #FECACA' },
  loaderWrap: { display: 'flex', justifyContent: 'center', padding: 60 },
  spinner: { width: 32, height: 32, border: '3px solid #E8F5E9', borderTopColor: BRAND, borderRadius: '50%', animation: 'tb-spin 0.8s linear infinite' },
};

if (typeof document !== 'undefined' && !document.getElementById('tb-admin')) {
  const el = document.createElement('style'); el.id = 'tb-admin';
  el.textContent = `
    @keyframes tb-spin{to{transform:rotate(360deg)}}
    button:hover:not(:disabled){opacity:.85!important}
    @media(max-width:768px){
      [data-tb-sidebar]{transform:translateX(-100%);position:fixed}
    }
  `;
  document.head.appendChild(el);
}
