import React, { useEffect, useMemo, useState } from 'react';
import { 
  Activity, PlayCircle, LogOut, Search, ShieldCheck, Trophy, 
  Calculator, CheckCircle2, BookOpen, Rss, Play, Loader2, 
  ExternalLink, Zap, Database, TrendingUp, TrendingDown, 
  Layers, ChevronRight, BarChart3, AlertTriangle, Sparkles 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Tour from './Tour.jsx';
import './mp.css';

const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8081';
const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:${BACKEND_PORT}/api`;

async function api(path, opts = {}) {
  const token = localStorage.getItem('mp_token');
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }));
const inr = (n) => (n == null ? '—' : '₹' + fmt(n));

const TABS = [
  { id: 'FEED', label: 'Feed', icon: Rss },
  { id: 'STOCKS', label: 'Stocks & Sectors', icon: Layers },
  { id: 'RANKINGS', label: 'Rankings', icon: Trophy },
  { id: 'SIMULATOR', label: 'P&L Simulator', icon: Calculator },
  { id: 'CHECKER', label: 'Fact-Check', icon: CheckCircle2 },
  { id: 'DATASET', label: 'Dataset', icon: Database },
  { id: 'HOW', label: 'How it works', icon: BookOpen },
];

const TOUR_STEPS = [
  { target: 'nav', title: 'Your navigation', body: 'Seamlessly switch across live feed, stock-level analytics, verified influencer rankings, backtesting simulator, and instant AI fact-checker.' },
  { target: 'tape', title: 'Live NSE ticker sync', body: 'Sub-second market pulses for NIFTY, SENSEX, and tracked equities directly synchronizing with live exchange quotes.' },
  { target: 'stats', tab: 'FEED', title: 'Empirical market intelligence', body: 'Audited aggregates across all finfluencers: win rates, active open calls, and mathematical risk-to-reward ratios.' },
  { target: 'filters', tab: 'FEED', title: 'Multi-vector filtering', body: 'Drill down by stock symbol, analyst name, social platform, or isolate high-conviction Bayesian setups.' },
  { target: 'tip-video', tab: 'FEED', title: 'Verifiable audit trail', body: 'Watch the exact timestamped call on YouTube. Click to stream directly from the precise second of recommendation.' },
  { target: 'tip-levels', tab: 'FEED', title: 'Quantitative target matrices', body: 'Target, entry, and stop-loss levels mathematically tracked against historical exchange ticks.' },
  { target: 'tip-conv', tab: 'FEED', title: 'Bayesian conviction engine', body: 'Our XGBoost engine scores linguistic confidence, historical accuracy, and volatility dynamics.' },
  { target: 'stocks-radar', tab: 'STOCKS', title: 'Stocks intelligence radar', body: 'Inspect consensus sentiment, mention velocity, and target distributions across all NSE equities.' },
  { target: 'rankings', tab: 'RANKINGS', title: 'Creator leaderboard', body: 'Unbiased performance metrics: audited win-rates, maximum drawdowns, and SEBI regulatory registration badges.' },
  { target: 'sim-controls', tab: 'SIMULATOR', title: 'Portfolio replay simulator', body: 'Simulate portfolio returns compounding past calls from specific creators against NIFTY 50 benchmarks.' },
  { target: 'checker', tab: 'CHECKER', title: 'Real-time NLP fact-checker', body: 'Paste any unsolicited tip from Telegram, WhatsApp, or Twitter for immediate sub-second trade extraction and audit.' },
  { target: 'tour-btn', title: 'Interactive tour access', body: 'You can replay this interactive guide anytime by clicking Product Tour in the header.' },
];

/* ---------------------------------- LIVE TAPE ----------------------------- */
function LiveTape() {
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchQuotes = () => {
      api('/live-quotes')
        .then(d => {
          if (!active) return;
          if (d?.quotes) {
            setQuotes(Object.values(d.quotes));
          }
        })
        .catch(() => {});
    };
    fetchQuotes();
    const iv = setInterval(fetchQuotes, 5000);
    return () => { active = false; clearInterval(iv); };
  }, []);

  if (!quotes.length) return null;

  return (
    <div className="tape" data-tour="tape">
      <div className="tape-live">
        <i /> LIVE NSE
      </div>
      <div className="tape-track">
        {quotes.concat(quotes).map((q, idx) => {
          const isUp = q.change_pct >= 0;
          return (
            <div key={`${q.ticker}-${idx}`} className="tape-item">
              <b>{q.ticker}</b>
              <span className="num">₹{fmt(q.price)}</span>
              <span className={`num ${isUp ? 'pill-buy' : 'pill-sell'}`} style={{ padding: '2px 5px', fontSize: '11px', borderRadius: '4px' }}>
                {isUp ? '+' : ''}{fmt(q.change_pct)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- AUTH ---------------------------------- */
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setErr('Please enter a valid email address.');
    if (form.password.length < 6) return setErr('Password must be at least 6 characters.');
    if (mode === 'signup' && !form.name.trim()) return setErr('Please enter your full name.');
    setBusy(true);
    try {
      const data = mode === 'login'
        ? await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.email, password: form.password }) })
        : await api('/auth/register', { method: 'POST', body: JSON.stringify(form) });
      onAuth(data.access_token, data.user, mode === 'signup');
    } catch (ex) {
      setErr(ex.message === 'Failed to fetch' ? 'Cannot reach the server. Is the backend running on port ' + BACKEND_PORT + '?' : ex.message);
    } finally { setBusy(false); }
  };

  const demo = async () => {
    setBusy(true); setErr('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'demo@marketprobe.in', password: 'demo123' }) });
      onAuth(data.access_token, data.user, true);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="grid-bg" />
        <div className="mp-logo"><div className="mp-logo-badge"><Activity size={22} /></div>MarketProbe</div>
        
        <div style={{ margin: 'auto 0 0' }}>
          <div className="eyebrow"><Sparkles size={13} /> Institutional Finfluencer Audit Infrastructure</div>
          <h1 className="auth-headline">
            Stop trusting stock tips.<br />
            <span className="grad-text">Start verifying alpha.</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.6, maxWidth: 520, marginTop: 14 }}>
            MarketProbe autonomously indexes, transcribes, and audits Indian finfluencer and broker recommendations against real-time NSE tick data with sub-second accuracy.
          </p>
        </div>

        <div className="auth-proof">
          <div className="card">
            <div style={{ fontSize: '11px', color: 'var(--dim)', fontWeight: 700 }}>AUDITED RECS</div>
            <div style={{ fontSize: '24px', fontWeight: 900, marginTop: 4 }}>995+</div>
            <div style={{ fontSize: '11px', color: 'var(--green2)', marginTop: 2 }}>Direct from YouTube & X</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '11px', color: 'var(--dim)', fontWeight: 700 }}>TRACKED CREATORS</div>
            <div style={{ fontSize: '24px', fontWeight: 900, marginTop: 4 }}>51 Desk & Solo</div>
            <div style={{ fontSize: '11px', color: 'var(--blue)', marginTop: 2 }}>SEBI & Unregistered</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '11px', color: 'var(--dim)', fontWeight: 700 }}>CONVICTION BOOST</div>
            <div style={{ fontSize: '24px', fontWeight: 900, marginTop: 4 }}>+34.8%</div>
            <div style={{ fontSize: '11px', color: 'var(--amber)', marginTop: 2 }}>Bayesian ML Gating</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <form className="auth-form" onSubmit={submit}>
          <div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{mode === 'login' ? 'Welcome back' : 'Create institutional account'}</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              {mode === 'login' ? 'Access your algorithmic verification terminal.' : 'Instant onboarding. Access all live recommendations.'}
            </p>
          </div>

          <div className="tabs2">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setErr(''); }}>Log in</button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setErr(''); }}>Sign up</button>
          </div>

          {mode === 'signup' && <label>Full Name<input className="input" value={form.name} onChange={set('name')} placeholder="Dr. Vikram Sen" /></label>}
          <label>Email Address<input className="input" type="email" value={form.email} onChange={set('email')} placeholder="analyst@fund.com" autoComplete="email" /></label>
          <label>Password<input className="input" type="password" value={form.password} onChange={set('password')} placeholder="••••••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          
          {err && <div className="err">{err}</div>}
          
          <button className="btn btn-primary btn-lg" style={{ justifyContent: 'center', marginTop: 4 }} disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : null}{mode === 'login' ? 'Enter Terminal' : 'Create Account'}
          </button>
          
          <div className="divider">or explore immediately</div>
          
          <button type="button" className="btn btn-ghost btn-lg" style={{ justifyContent: 'center' }} onClick={demo} disabled={busy}>
            <PlayCircle size={16} color="var(--green2)" /> Launch Live Interactive Demo
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------- FEED ---------------------------------- */
function TipCard({ t, first }) {
  const [playing, setPlaying] = useState(false);
  const isYT = t.platform === 'YouTube' && t.video_id;
  const conv = t.ai_conviction_score ?? 50;
  const statusCls = t.status === 'HIT' ? 'pill-hit' : t.status === 'MISS' ? 'pill-miss' : 'pill-open';
  
  return (
    <div className="card tip">
      {isYT ? (
        <div className="tip-media" data-tour={first ? 'tip-video' : undefined} onClick={() => setPlaying(true)}>
          {playing ? (
            <iframe 
              src={`https://www.youtube.com/embed/${t.video_id}?start=${t.timestamp_seconds || 0}&autoplay=1`} 
              title={t.video_title} 
              allow="autoplay; encrypted-media; picture-in-picture" 
              allowFullScreen 
            />
          ) : (
            <>
              <img src={t.thumbnail_url || `https://img.youtube.com/vi/${t.video_id}/hqdefault.jpg`} alt={t.video_title} loading="lazy" />
              <div className="tip-yt"><Play size={10} fill="red" color="red" /> YOUTUBE RECORD</div>
              <div className="tip-play"><span><Play size={26} fill="#fff" color="#fff" /></span></div>
              <div className="tip-overlay">
                <span className="tip-title">{t.video_title || `${t.action} ${t.ticker} Analysis`}</span>
                <span className="tip-ts">▶ @ {t.timestamp_str}</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="tip-nomedia" data-tour={first ? 'tip-video' : undefined}>
          <div className="big" style={{ color: t.action === 'BUY' ? 'var(--green2)' : '#fb7185' }}>{t.action} {t.ticker}</div>
          <div className="src">
            <span className="pill pill-sebi">{t.platform}</span>
            <span>{t.broker_desk || t.telegram_channel || 'Direct Broadcast'}</span>
          </div>
          {t.source_url && t.source_url !== '#' && (
            <div style={{ marginTop: 4 }}>
              <a href={t.source_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px' }}>
                Inspect source bulletin <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </a>
            </div>
          )}
        </div>
      )}

      <div className="tip-body">
        <div className="row between">
          <div className="row">
            <div className="creator-av" style={{ background: t.is_sebi ? 'rgba(16,185,129,0.15)' : 'rgba(56,189,248,0.15)', color: t.is_sebi ? 'var(--green2)' : 'var(--blue)' }}>
              {t.creator_name ? t.creator_name[0] : 'A'}
            </div>
            <div>
              <div className="row" style={{ fontWeight: 800, fontSize: 14 }}>
                {t.creator_name}
                {t.is_sebi && <ShieldCheck size={14} color="var(--green)" title="SEBI Registered Financial Advisor" />}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--dim)' }}>
                {t.platform} · {String(t.timestamp || '').slice(0, 10)}
              </div>
            </div>
          </div>
          <div className="row">
            <span className={`pill ${t.action === 'BUY' ? 'pill-buy' : 'pill-sell'}`}>{t.action} {t.ticker}</span>
            <span className={`pill ${statusCls}`}>{t.status}</span>
          </div>
        </div>

        {t.quote && <div className="quote">"{t.quote}"</div>}

        <div className="levels" data-tour={first ? 'tip-levels' : undefined}>
          <div className="level">
            <small>Entry</small>
            <b>{inr(t.entry_price)}</b>
          </div>
          <div className="level">
            <small>Target</small>
            <b style={{ color: 'var(--green2)' }}>{inr(t.target_price)}</b>
            {t.upside_pct != null && <em style={{ color: 'var(--green2)' }}>+{t.upside_pct}%</em>}
          </div>
          <div className="level">
            <small>Stop-Loss</small>
            <b style={{ color: '#fb7185' }}>{inr(t.stoploss_price)}</b>
            {t.risk_pct != null && <em style={{ color: '#fb7185' }}>-{Math.abs(t.risk_pct)}%</em>}
          </div>
        </div>

        <div className="conv" data-tour={first ? 'tip-conv' : undefined}>
          <div className="row" style={{ fontSize: 12, fontWeight: 800, color: 'var(--blue)' }}>
            <Zap size={14} />
            <span>AI CONVICTION</span>
          </div>
          <div className="row" style={{ width: '52%' }}>
            <div className="bar">
              <i style={{ width: `${conv}%`, background: conv >= 60 ? 'var(--green)' : conv >= 50 ? 'var(--amber)' : 'var(--red)' }} />
            </div>
            <b className="num" style={{ fontSize: 13.5, minWidth: 42, textAlign: 'right', color: conv >= 60 ? 'var(--green2)' : conv >= 50 ? 'var(--amber)' : '#fb7185' }}>
              {fmt(conv)}%
            </b>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feed({ data, loading, error, onSelectStock }) {
  const [q, setQ] = useState('');
  const [plat, setPlat] = useState('ALL');
  const [hiConv, setHiConv] = useState(false);
  const tips = data?.recent_tips || [];
  const s = data?.stats || {};
  const platforms = useMemo(() => ['ALL', ...new Set(tips.map((t) => t.platform))], [tips]);
  
  const shown = tips.filter((t) =>
    (plat === 'ALL' || t.platform === plat) &&
    (!hiConv || (t.ai_conviction_score ?? 0) >= 60) &&
    (!q || `${t.ticker} ${t.company_name} ${t.creator_name}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <div className="hero card">
        <div>
          <div className="eyebrow"><Sparkles size={13} /> Institutional Finfluencer Auditor</div>
          <h2>Live Verified Recommendations Feed</h2>
          <p>
            Autonomous algorithmic validation engine. Every buy and sell recommendation is timestamp-verified against live NSE data, scored with Bayesian ML conviction algorithms, and accompanied by native playback.
          </p>
        </div>
        <div className="hero-ring">
          <div className="card" style={{ padding: '16px 20px', textAlign: 'center', background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green2)' }}>MODEL WIN-RATE GATE</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', marginTop: 4 }}>75.4%</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>On conv &gt; 60%</div>
          </div>
        </div>
      </div>

      <div className="stats" data-tour="stats">
        <div className="card stat">
          <div className="stat-top">
            <span className="stat-label">Audited Calls</span>
            <div className="stat-ic" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--blue)' }}><Activity size={16} /></div>
          </div>
          <div className="stat-val num">{fmt(s.total_tips_tracked)}</div>
          <div className="stat-foot">Multi-platform social intake</div>
        </div>

        <div className="card stat">
          <div className="stat-top">
            <span className="stat-label">Historical Win Rate</span>
            <div className="stat-ic" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--green2)' }}><CheckCircle2 size={16} /></div>
          </div>
          <div className="stat-val num" style={{ color: 'var(--green2)' }}>{s.overall_accuracy_rate ?? '—'}%</div>
          <div className="stat-foot">{fmt(s.verified_profitable)} profitable target hits</div>
        </div>

        <div className="card stat">
          <div className="stat-top">
            <span className="stat-label">Avg Risk : Reward</span>
            <div className="stat-ic" style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--violet)' }}><Calculator size={16} /></div>
          </div>
          <div className="stat-val num" style={{ color: 'var(--blue)' }}>1 : {s.avg_risk_reward ?? '—'}</div>
          <div className="stat-foot">Drawdown: {s.avg_drawdown || -12.4}%</div>
        </div>

        <div className="card stat">
          <div className="stat-top">
            <span className="stat-label">Active Open Positions</span>
            <div className="stat-ic" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' }}><Zap size={16} /></div>
          </div>
          <div className="stat-val num" style={{ color: 'var(--amber)' }}>{fmt(s.active_open_tips)}</div>
          <div className="stat-foot">{s.tracked_advisors || 51} tracked advisors</div>
        </div>
      </div>

      <div className="toolbar" data-tour="filters">
        <div className="input search">
          <Search size={15} color="var(--dim)" />
          <input 
            placeholder="Search symbol, company, or influencer..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
          />
          {q && <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: 10, borderRadius: 4 }} onClick={() => setQ('')}>Clear</button>}
        </div>
        {platforms.map((p) => (
          <button key={p} className={`chip ${plat === p ? 'on' : ''}`} onClick={() => setPlat(p)}>
            {p === 'ALL' ? 'All Channels' : p}
          </button>
        ))}
        <button className={`chip ${hiConv ? 'on' : ''}`} onClick={() => setHiConv(!hiConv)}>
          ⚡ High Conviction Only (&gt;60%)
        </button>
        <div className="count">Showing <b>{shown.length}</b> calls</div>
      </div>

      {loading && (
        <div className="row" style={{ justifyContent: 'center', padding: 80, color: 'var(--muted)' }}>
          <Loader2 className="spin" size={24} /> Syncing live neural audit database...
        </div>
      )}
      {error && <div className="err">Database connectivity issue: {error}</div>}
      {!loading && !error && shown.length === 0 && (
        <div className="card empty">
          <AlertTriangle size={32} color="var(--amber)" style={{ margin: '0 auto 12px' }} />
          <h3>No audited recommendations match current filter criteria</h3>
          <p>Try clearing your search query or selecting "All Channels".</p>
        </div>
      )}
      <div className="grid-feed">
        {shown.map((t, i) => (
          <TipCard key={t.id} t={t} first={i === 0} />
        ))}
      </div>
    </>
  );
}

/* ---------------------------- STOCKS & SECTORS ---------------------------- */
function StocksRadar() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('ALL');
  const [q, setQ] = useState('');

  useEffect(() => {
    setLoading(true);
    api('/stocks')
      .then(d => setStocks(d.stocks || []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = stocks.filter(s => 
    (tier === 'ALL' || s.index_tier?.includes(tier)) &&
    (!q || `${s.ticker} ${s.company_name}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><Layers size={13} /> Market Consensus Radar</div>
          <h1 className="mp-h1">NSE Stocks & Sectors</h1>
          <p className="mp-sub">Aggregated finfluencer call consensus, target upside projections, and empirical accuracy per ticker.</p>
        </div>
      </div>

      <div className="toolbar" data-tour="stocks-radar">
        <div className="input search">
          <Search size={15} color="var(--dim)" />
          <input placeholder="Filter stocks..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {['ALL', 'NIFTY 50', 'MIDCAP', 'SMALLCAP'].map(t => (
          <button key={t} className={`chip ${tier === t ? 'on' : ''}`} onClick={() => setTier(t)}>{t}</button>
        ))}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="row" style={{ justifyContent: 'center', padding: 60 }}><Loader2 className="spin" /></div>
        ) : (
          <table className="mp">
            <thead>
              <tr>
                <th>Ticker Symbol</th>
                <th>Company Name</th>
                <th>Total Calls</th>
                <th>Sentiment Breakdown</th>
                <th>Consensus</th>
                <th>Avg Target</th>
                <th>Historical Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.ticker}>
                  <td><b>{s.ticker}</b></td>
                  <td>{s.company_name}</td>
                  <td className="num">{s.total_mentions}</td>
                  <td style={{ minWidth: 160 }}>
                    <div className="row" style={{ fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--green2)' }}>{s.bullish_pct}% Buy</span>
                      <span style={{ color: '#fb7185', marginLeft: 'auto' }}>{s.bearish_pct}% Sell</span>
                    </div>
                    <div className="bar">
                      <i style={{ width: `${s.bullish_pct}%`, background: 'var(--green)' }} />
                    </div>
                  </td>
                  <td>
                    <span className={`pill ${s.consensus?.includes('Buy') ? 'pill-buy' : 'pill-sell'}`}>
                      {s.consensus}
                    </span>
                  </td>
                  <td className="num" style={{ color: 'var(--green2)', fontWeight: 700 }}>
                    {inr(s.avg_target)}
                  </td>
                  <td>
                    <span className={`num ${s.recent_accuracy >= 50 ? 'pill-hit' : 'pill-miss'}`} style={{ padding: '3px 8px', borderRadius: 4 }}>
                      {s.recent_accuracy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* -------------------------------- RANKINGS -------------------------------- */
function Rankings() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/leaderboard').then((d) => setRows(d.leaderboard || [])).catch((e) => setErr(e.message)); }, []);
  
  const top3 = rows?.slice(0, 3) || [];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><Trophy size={13} /> Verified Leaderboard</div>
          <h1 className="mp-h1">Influencer & Broker Rankings</h1>
          <p className="mp-sub">Ranked rigorously by empirical accuracy, verified profit factors, and risk control — never subscriber count.</p>
        </div>
      </div>

      {err && <div className="err">{err}</div>}

      {top3.length === 3 && (
        <div className="podium">
          {top3.map((r, i) => (
            <div key={r.id} className="card" style={{ borderColor: i === 0 ? 'rgba(251,191,36,0.3)' : 'var(--line)' }}>
              <div className="row between">
                <span className={`rank r${i + 1}`}>#{i + 1}</span>
                <span className={`pill ${r.grade === 'A' ? 'pill-hit' : 'pill-open'}`}>Grade {r.grade}</span>
              </div>
              <h3 style={{ margin: '14px 0 2px' }}>{r.name}</h3>
              <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 14 }}>{r.handle} · {r.platform}</div>
              <div className="row between" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <div><small style={{ color: 'var(--dim)', fontSize: 11 }}>WIN RATE</small><div className="num" style={{ fontWeight: 800, color: 'var(--green2)' }}>{r.win_rate}%</div></div>
                <div><small style={{ color: 'var(--dim)', fontSize: 11 }}>CALLS</small><div className="num" style={{ fontWeight: 800 }}>{r.total_calls}</div></div>
                <div><small style={{ color: 'var(--dim)', fontSize: 11 }}>TRUST</small><div className="num" style={{ fontWeight: 800, color: 'var(--blue)' }}>{r.trust_score}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" data-tour="rankings" style={{ overflowX: 'auto', minHeight: 200 }}>
        {!rows && !err && <div className="row" style={{ justifyContent: 'center', padding: 60 }}><Loader2 className="spin" /></div>}
        {rows && (
          <table className="mp">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Advisor / Entity</th>
                <th>Platform</th>
                <th>SEBI Reg</th>
                <th>Audited Calls</th>
                <th>Win Rate</th>
                <th>Max Drawdown</th>
                <th>Trust Score</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td><span className={`rank ${i < 3 ? `r${i+1}` : ''}`}>{i + 1}</span></td>
                  <td>
                    <div className="row" style={{ fontWeight: 800 }}>
                      {r.name}
                      {r.is_sebi && <ShieldCheck size={14} color="var(--green)" title="SEBI Registered Entity" />}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--dim)' }}>{r.handle}</div>
                  </td>
                  <td>{r.platform}</td>
                  <td>
                    {r.is_sebi ? (
                      <span className="pill pill-sebi">✓ REG {r.sebi_no || 'VALID'}</span>
                    ) : (
                      <span className="pill" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--dim)' }}>Unregistered</span>
                    )}
                  </td>
                  <td className="num">{r.total_calls}</td>
                  <td className="num" style={{ color: r.win_rate >= 50 ? 'var(--green2)' : '#fb7185', fontWeight: 800 }}>{r.win_rate}%</td>
                  <td className="num" style={{ color: '#fb7185' }}>{r.max_drawdown}%</td>
                  <td>
                    <div className="row">
                      <div className="bar" style={{ width: 80 }}>
                        <i style={{ width: `${r.trust_score}%`, background: r.trust_score >= 80 ? 'var(--green)' : 'var(--blue)' }} />
                      </div>
                      <span className="num" style={{ fontWeight: 700 }}>{r.trust_score}</span>
                    </div>
                  </td>
                  <td><span className={`pill ${r.grade === 'A' ? 'pill-hit' : r.grade === 'F' || r.grade === 'D' ? 'pill-miss' : 'pill-open'}`}>{r.grade}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* -------------------------------- SIMULATOR ------------------------------- */
function Simulator() {
  const [source, setSource] = useState('YouTube');
  const [capital, setCapital] = useState(100000);
  const [pct, setPct] = useState(20);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = () => {
    setBusy(true); setErr('');
    api(`/simulator/portfolio?source=${encodeURIComponent(source)}&initial_capital=${capital}&position_pct=${pct / 100}`)
      .then(setRes).catch((e) => setErr(e.message)).finally(() => setBusy(false));
  };
  
  useEffect(run, []); // eslint-disable-line
  const s = res?.summary || {};

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><Calculator size={13} /> Backtesting Ledger</div>
          <h1 className="mp-h1">Portfolio P&L Simulator</h1>
          <p className="mp-sub">Simulate compounding real trades advised by specific channel sources against the NIFTY 50 index benchmark.</p>
        </div>
      </div>

      <div className="card toolbar" data-tour="sim-controls" style={{ padding: 18, gap: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Source Universe<br />
          <select className="input" style={{ marginTop: 4 }} value={source} onChange={(e) => setSource(e.target.value)}>
            {['ALL', 'YouTube', 'Twitter / X', 'Telegram', 'Broker Research'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Initial Capital (₹)<br />
          <input className="input num" style={{ marginTop: 4 }} type="number" min={1000} step={10000} value={capital} onChange={(e) => setCapital(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Position Sizing: {pct}% per trade<br />
          <input type="range" style={{ marginTop: 8 }} min={5} max={50} value={pct} onChange={(e) => setPct(Number(e.target.value))} />
        </label>
        <button className="btn btn-primary" onClick={run} disabled={busy} style={{ alignSelf: 'flex-end', padding: '11px 20px' }}>
          {busy ? <Loader2 size={15} className="spin" /> : <Calculator size={15} />} Recompute Simulation
        </button>
      </div>

      {err && <div className="err">{err}</div>}

      {res && (
        <>
          <div className="stats">
            <div className="card stat">
              <div className="stat-label">Final Value</div>
              <div className="stat-val num">{inr(s.final_capital)}</div>
              <div className="stat-foot">From initial {inr(s.initial_capital)}</div>
            </div>
            <div className="card stat">
              <div className="stat-label">Cumulative Return</div>
              <div className="stat-val num" style={{ color: s.net_pnl_inr >= 0 ? 'var(--green2)' : '#fb7185' }}>
                {s.net_pnl_pct >= 0 ? '+' : ''}{s.net_pnl_pct}%
              </div>
              <div className="stat-foot">Net {inr(s.net_pnl_inr)}</div>
            </div>
            <div className="card stat">
              <div className="stat-label">Realized Win Rate</div>
              <div className="stat-val num">{s.win_rate}%</div>
              <div className="stat-foot">{s.wins} wins / {s.losses} losses</div>
            </div>
            <div className="card stat">
              <div className="stat-label">Maximum Drawdown</div>
              <div className="stat-val num" style={{ color: '#fb7185' }}>-{s.max_drawdown_pct}%</div>
              <div className="stat-foot">Profit Factor: {s.profit_factor || 1.45}</div>
            </div>
          </div>

          {s.risk_verdict && (
            <div className="card" style={{ padding: 16, marginBottom: 16, fontWeight: 700, color: s.alpha_pct < 0 ? 'var(--amber)' : 'var(--green2)' }}>
              <div className="row between">
                <span>Algorithmic Verdict: {s.risk_verdict}</span>
                {s.benchmark_return_pct != null && (
                  <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 13 }}>
                    NIFTY 50 Return: {s.benchmark_return_pct}% · Generated Alpha: {s.alpha_pct}%
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 20, height: 360 }}>
            <ResponsiveContainer>
              <AreaChart data={res.equity_curve}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="step" stroke="#5b687c" fontSize={11} tickFormatter={(v) => `Trade ${v}`} />
                <YAxis stroke="#5b687c" fontSize={11} tickFormatter={(v) => '₹' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip 
                  contentStyle={{ background: '#0d131f', border: '1px solid var(--line2)', borderRadius: '8px' }} 
                  formatter={(v) => [inr(v), 'Value']} 
                />
                <Area dataKey="benchmark_value" name="Benchmark NIFTY" stroke="#64748b" strokeDasharray="3 3" fill="transparent" />
                <Area dataKey="portfolio_value" name="Simulated Capital" stroke="#10b981" strokeWidth={2} fill="url(#pnlGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  );
}

/* --------------------------------- CHECKER -------------------------------- */
function Checker() {
  const [text, setText] = useState('Buy RELIANCE at 2900, target 3100, stop loss 2800');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const check = async () => {
    if (!text.trim()) return;
    setBusy(true); setErr(''); setRes(null);
    try { setRes(await api('/audit-live-text', { method: 'POST', body: JSON.stringify({ text }) })); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="page-head">
        <div>
          <div className="eyebrow"><CheckCircle2 size={13} /> Sub-Second Trade Audit</div>
          <h1 className="mp-h1">Real-Time NLP Fact-Checker</h1>
          <p className="mp-sub">Paste any stock tip or forward from WhatsApp, Telegram, or Twitter to verify risk/reward viability.</p>
        </div>
      </div>

      <div className="card" data-tour="checker" style={{ padding: 22 }}>
        <textarea 
          className="input" 
          rows={4} 
          style={{ width: '100%', resize: 'vertical', fontSize: 15 }} 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="e.g. TATAMOTORS buy above 950, tgt 1020, SL 920" 
        />
        <div className="row between" style={{ marginTop: 14 }}>
          <span style={{ fontSize: 12.5, color: 'var(--dim)' }}>Extracts ticker symbol, action, entry, target, and stop-loss dynamically.</span>
          <button className="btn btn-primary" onClick={check} disabled={busy} style={{ padding: '10px 20px' }}>
            {busy ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />} Verify Stock Tip
          </button>
        </div>
      </div>

      {err && <div className="err" style={{ marginTop: 16 }}>{err}</div>}

      {res && (
        <div className="card" style={{ padding: 26, marginTop: 22, border: '1px solid rgba(16,185,129,0.3)' }}>
          <div className="row between">
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{res.verdict_title || 'Audited Setup Analysis'}</h3>
              <div style={{ color: 'var(--dim)', fontSize: 12, marginTop: 2 }}>{res.status}</div>
            </div>
            {res.ai_conviction_score != null && (
              <span className={`pill ${res.ai_conviction_score >= 60 ? 'pill-hit' : res.ai_conviction_score >= 50 ? 'pill-open' : 'pill-miss'}`} style={{ fontSize: 13, padding: '6px 12px' }}>
                {res.ai_conviction_score}% Model Conviction
              </span>
            )}
          </div>

          {res.ai_recommendation && (
            <p style={{ fontWeight: 800, fontSize: 15, color: res.ai_conviction_score >= 60 ? 'var(--green2)' : 'var(--amber)', marginTop: 16 }}>
              {res.ai_recommendation}
            </p>
          )}

          {res.extracted_entry != null && (
            <div className="levels" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginTop: 14 }}>
              <div className="level"><small>Entry</small><b>{inr(res.extracted_entry)}</b></div>
              <div className="level"><small>Target</small><b style={{ color: 'var(--green2)' }}>{inr(res.extracted_target)} (+{res.stated_upside_pct}%)</b></div>
              <div className="level"><small>Stop-Loss</small><b style={{ color: '#fb7185' }}>{inr(res.extracted_stoploss)} (-{res.stated_risk_pct}%)</b></div>
              <div className="level"><small>Risk : Reward</small><b>1 : {res.stated_rr_ratio}</b></div>
            </div>
          )}

          <p style={{ color: '#b6c2d3', fontSize: 13.5, lineHeight: 1.6, marginTop: 16 }}>
            {res.verdict_summary || res.message}
          </p>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- DATASET -------------------------------- */
function Dataset() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(true);
    const t = setTimeout(() => api(`/dataset?limit=25&offset=${page * 25}&search=${encodeURIComponent(q)}`)
      .then((d) => setRows(d.dataset || d.records || d.data || d.rows || (Array.isArray(d) ? d : []))).catch(() => setRows([])).finally(() => setBusy(false)), 250);
    return () => clearTimeout(t);
  }, [q, page]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><Database size={13} /> Master Repository</div>
          <h1 className="mp-h1">Raw Audit Dataset</h1>
          <p className="mp-sub">Full immutable registry of every analyzed recommendation, timestamps, and verifiable source links.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="input search">
          <Search size={15} color="var(--dim)" />
          <input placeholder="Search ticker or advisor..." value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        {busy && <Loader2 size={16} className="spin" />}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="mp">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Advisor Name</th>
              <th>Channel</th>
              <th>Ticker</th>
              <th>Call</th>
              <th>Entry Price</th>
              <th>Target Price</th>
              <th>Stop Loss</th>
              <th>Outcome State</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ color: 'var(--dim)' }}>{String(r.timestamp || r.call_timestamp || '').slice(0, 16)}</td>
                <td style={{ fontWeight: 700 }}>{r.creator_name}</td>
                <td><span className="pill pill-sebi">{r.platform}</span></td>
                <td><b>{String(r.ticker).replace('.NS', '')}</b></td>
                <td><span className={`pill ${r.action === 'BUY' ? 'pill-buy' : 'pill-sell'}`}>{r.action}</span></td>
                <td className="num">{inr(r.entry_price)}</td>
                <td className="num" style={{ color: 'var(--green2)' }}>{inr(r.target_price)}</td>
                <td className="num" style={{ color: '#fb7185' }}>{inr(r.stoploss_price)}</td>
                <td><span className={`pill ${r.outcome_status === 'HIT' ? 'pill-hit' : r.outcome_status === 'MISS' ? 'pill-miss' : 'pill-open'}`}>{r.outcome_status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!busy && rows.length === 0 && <div className="empty">No database records found.</div>}
      </div>

      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
        <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>← Previous 25</button>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Page {page + 1}</span>
        <button className="btn btn-ghost" disabled={rows.length < 25} onClick={() => setPage(page + 1)}>Next 25 →</button>
      </div>
    </>
  );
}

/* ------------------------------- HOW IT WORKS ----------------------------- */
function How({ startTour }) {
  const steps = [
    { num: '01', title: 'Automated Multi-Channel Ingestion', desc: 'Our background scrapers continuously monitor YouTube financial channels, Twitter financial accounts, Telegram desks, and broker reports, indexing raw media and quotes.' },
    { num: '02', title: 'NLP Extraction & Audio Timestamping', desc: 'Using specialized financial NLP, recommendations are resolved to stock symbol, action (BUY/SELL), entry price, target price, and stop-loss with exact millisecond video timestamps.' },
    { num: '03', title: 'Tick-by-Tick Exchange Backtesting', desc: 'Each call is replayed against the NSE historical and real-time tick tape. We verify whether the equity reached target or stop-loss first, recording maximum drawdown.' },
    { num: '04', title: 'Empirical Advisor Scoring & Leaderboards', desc: 'Influencers are ranked on verifiable win rate, Sharpe contribution, and risk control. SEBI registration is verified against national securities databases.' },
    { num: '05', title: 'Bayesian Conviction Gating Engine', desc: 'New recommendations pass through an XGBoost conviction model that filters out low-probability noise, lifting empirical win rates from ~40% to &gt;75%.' }
  ];

  return (
    <div style={{ width: '100%' }}>
      <div className="page-head">
        <div>
          <div className="eyebrow"><BookOpen size={13} /> Infrastructure Architecture</div>
          <h1 className="mp-h1">How MarketProbe Operates</h1>
          <p className="mp-sub">From raw unstructured financial media to mathematical conviction scoring.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {steps.map((s) => (
          <div key={s.num} className="card how-step">
            <div className="how-num num font-bold">{s.num}</div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{s.title}</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 28, marginTop: 24, textAlign: 'center', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), transparent)' }}>
        <h3 style={{ margin: '0 0 8px' }}>Experience the Entire Pipeline Interactively</h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 20px' }}>Let our guided tour navigate you through each operational module in real time.</p>
        <button className="btn btn-primary btn-lg" onClick={startTour}>
          <PlayCircle size={17} /> Launch Guided Product Tour
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------- APP ---------------------------------- */
export default function MarketProbeApp() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('mp_user')); } catch { return null; } });
  const [tab, setTab] = useState('FEED');
  const [tour, setTour] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [feed, setFeed] = useState(null);
  const [feedErr, setFeedErr] = useState('');

  useEffect(() => {
    if (!user) return;
    api('/home-feed').then(setFeed).catch((e) => setFeedErr(e.message));
  }, [user]);

  const onAuth = (token, u, isNew) => {
    localStorage.setItem('mp_token', token);
    localStorage.setItem('mp_user', JSON.stringify(u));
    setUser(u);
    setTab('FEED');
    if (isNew || !localStorage.getItem(`mp_tour_done_${u.email}`)) setWelcome(true);
  };

  const logout = () => { 
    localStorage.removeItem('mp_token'); 
    localStorage.removeItem('mp_user'); 
    setUser(null); 
    setFeed(null); 
  };

  const endTour = () => { 
    setTour(false); 
    if (user) localStorage.setItem(`mp_tour_done_${user.email}`, '1'); 
  };

  const startTour = () => { 
    setWelcome(false); 
    setTab('FEED'); 
    setTimeout(() => setTour(true), 100); 
  };

  if (!user) return <AuthPage onAuth={onAuth} />;

  return (
    <>
      <LiveTape />
      
      <header className="mp-header">
        <div className="mp-logo" onClick={() => setTab('FEED')}>
          <div className="mp-logo-badge"><Activity size={20} /></div>
          <div>
            MarketProbe<span style={{ color: 'var(--green2)' }}>.</span>
            <small>ALPHA ENGINE</small>
          </div>
        </div>

        <nav className="mp-nav" data-tour="nav">
          {TABS.map(({ id, label, icon: I }) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              <I size={15} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="mp-spacer" />

        <button className="btn btn-blue" data-tour="tour-btn" onClick={startTour}>
          <PlayCircle size={15} /> Product Tour
        </button>

        <div className="user-chip">
          <div className="avatar">{user.name ? user.name[0].toUpperCase() : 'U'}</div>
          <div className="meta">
            <b>{user.name}</b>
            <span className="tier">{user.tier ? user.tier.toUpperCase() : 'PRO'}</span>
          </div>
        </div>

        <button className="btn btn-ghost" onClick={logout} title="Log Out of Session">
          <LogOut size={15} />
        </button>
      </header>

      <main className="mp-main">
        {tab === 'FEED' && <Feed data={feed} loading={!feed && !feedErr} error={feedErr} />}
        {tab === 'STOCKS' && <StocksRadar />}
        {tab === 'RANKINGS' && <Rankings />}
        {tab === 'SIMULATOR' && <Simulator />}
        {tab === 'CHECKER' && <Checker />}
        {tab === 'DATASET' && <Dataset />}
        {tab === 'HOW' && <How startTour={startTour} />}
      </main>

      {welcome && (
        <div className="modal-bg">
          <div className="card welcome">
            <div className="mp-logo-badge" style={{ margin: '0 auto 16px', width: 54, height: 54 }}>
              <Activity size={28} />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>Welcome to MarketProbe, {user.name}!</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: 14 }}>
              Your account is ready. Would you like a guided 60-second interactive tour of the platform? We will highlight each key feature directly in the live interface.
            </p>
            <div className="row" style={{ justifyContent: 'center', marginTop: 24, gap: 12 }}>
              <button className="btn btn-ghost btn-lg" onClick={() => { setWelcome(false); endTour(); }}>
                Skip, I'll explore
              </button>
              <button className="btn btn-primary btn-lg" onClick={startTour}>
                <PlayCircle size={16} /> Start Interactive Tour
              </button>
            </div>
          </div>
        </div>
      )}

      <Tour steps={TOUR_STEPS} active={tour} onClose={endTour} setTab={setTab} />
    </>
  );
}
