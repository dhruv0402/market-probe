import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, PlayCircle, LogOut, Search, ShieldCheck, Trophy,
  Calculator, CheckCircle2, BookOpen, Rss, Play, Loader2,
  ExternalLink, Zap, Database, TrendingUp, TrendingDown,
  Layers, ChevronRight, BarChart3, AlertTriangle, Sparkles,
  Bell, Download, ArrowRight, Lock, Key, Users, Check, X, Shield, Globe,
  Sun, Moon, Palette, Bookmark, CreditCard, Star, Maximize2, Clock, Copy, ChevronDown,
  Share2, Terminal
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API, api, fmt, inr } from '../lib/apiClient.js';

/* ---------------------------- STOCKS & SECTORS ---------------------------- */
export function StocksRadar() {
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

/* -------------------------------- ALERTS ---------------------------------- */
export function AlphaAlerts({ onAuditInCouncil }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minConv, setMinConv] = useState(60);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    api(`/alerts?min_conviction=${minConv}`)
      .then((d) => setAlerts(d.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [minConv]);

  const copyTelegram = (alert) => {
    navigator.clipboard.writeText(alert.telegram_alert_message);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><Bell size={13} /> High-Conviction Broadcast Feed</div>
          <h1 className="mp-h1">Real-Time Alpha Alerts</h1>
          <p className="mp-sub">Instant push notifications for algorithmic setups filtered by Bayesian model conviction &ge; {minConv}%.</p>
        </div>
      </div>

      <div className="toolbar">
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Filter Min Conviction:</span>
        {[50, 60, 65, 70].map((score) => (
          <button 
            key={score} 
            className={`chip ${minConv === score ? 'on' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            onClick={() => setMinConv(score)}
          >
            <Zap size={12} /> &ge; {score}% Score
          </button>
        ))}
        <div className="count"><b>{alerts.length}</b> Live Filtered Alerts</div>
      </div>

      {loading ? (
        <div className="row" style={{ justifyContent: 'center', padding: 60 }}><Loader2 className="spin" /></div>
      ) : (
        <div className="grid-feed" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
          {alerts.map((a) => (
            <div key={a.id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="row between">
                <div className="row">
                  <span className={`pill ${a.action === 'BUY' ? 'pill-buy' : 'pill-sell'}`} style={{ fontSize: 12.5, padding: '4px 10px' }}>
                    {a.action} {String(a.ticker).replace('.NS', '')}
                  </span>
                  {a.is_sebi && <span className="pill pill-sebi">SEBI REG</span>}
                </div>
                <span className="pill pill-hit" style={{ fontSize: 12.5, padding: '4px 10px' }}>
                  {a.ai_conviction_score}% Conviction
                </span>
              </div>

              <div className="row between">
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14.5 }}>{a.creator}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--dim)' }}>{a.platform} · {String(a.timestamp).slice(0, 16)}</div>
                </div>
                <span className={`pill ${a.status === 'HIT' ? 'pill-hit' : a.status === 'MISS' ? 'pill-miss' : 'pill-open'}`}>
                  {a.status}
                </span>
              </div>

              <div className="levels" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="level"><small>Entry</small><b>{inr(a.entry_price)}</b></div>
                <div className="level"><small>Target</small><b style={{ color: 'var(--green2)' }}>{inr(a.target_price)} (+{a.upside_pct}%)</b></div>
                <div className="level"><small>Stop Loss</small><b style={{ color: '#fb7185' }}>{inr(a.stoploss_price)}</b></div>
              </div>

              <div className="row between" style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--line)', gap: 8 }}>
                {onAuditInCouncil && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() =>
                      onAuditInCouncil({
                        ticker: a.ticker,
                        action: a.action,
                        entry_price: a.entry_price,
                        target_price: a.target_price,
                        stoploss_price: a.stoploss_price,
                        creator_name: a.creator,
                      })
                    }
                  >
                    <Activity size={13} /> Audit in Council
                  </button>
                )}
                <button 
                  className={`btn ${copiedId === a.id ? 'btn-primary' : 'btn-ghost'}`} 
                  onClick={() => copyTelegram(a)}
                  style={{ fontSize: 12, padding: '6px 12px', marginLeft: 'auto' }}
                >
                  <Copy size={12} /> {copiedId === a.id ? 'Copied Alert' : 'Copy Webhook'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* -------------------------------- RANKINGS -------------------------------- */
export function Rankings() {
  const [rows, setRows] = useState(null);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'SEBI_ONLY', 'HALL_OF_SHAME'
  const [err, setErr] = useState('');
  useEffect(() => {
    api('/leaderboard')
      .then((d) => {
        if (d && Array.isArray(d.leaderboard) && d.leaderboard.length > 0) {
          setRows(d.leaderboard);
        } else {
          // Fallback to /influencers endpoint
          return api('/influencers').then(alt => setRows((alt && alt.leaderboard) || []));
        }
      })
      .catch((e) => {
        // Retry alternative endpoint before giving up
        api('/influencers')
          .then(alt => setRows((alt && alt.leaderboard) || []))
          .catch(err2 => setErr(e.message || err2.message || 'Failed to load rankings'));
      });
  }, []);
  
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (filterMode === 'SEBI_ONLY') return rows.filter(r => r.is_sebi);
    if (filterMode === 'HALL_OF_SHAME') {
      // Sort by worst win rate and highest drawdown
      return [...rows].sort((a, b) => (a.win_rate - b.win_rate) || (a.max_drawdown - b.max_drawdown));
    }
    return rows;
  }, [rows, filterMode]);

  const top3 = filteredRows.slice(0, 3);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><Trophy size={13} /> Empirical Accountability &amp; Statistical Calibration</div>
          <h1 className="mp-h1">Empirical Track-Record Ledger</h1>
          <p className="mp-sub">
            Ranked transparently by Empirical Bayes shrinkage hit-rate with 95% Wilson confidence intervals. Synthetic benchmarks are excluded; figures report historical resolved outcomes only and are not an endorsement or critique of any individual.
          </p>
        </div>
      </div>

      {/* Filter and Mode Toggles */}
      <div className="row" style={{ gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button 
          className={`btn ${filterMode === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFilterMode('ALL')}
          style={{ fontSize: 13, padding: '8px 16px' }}
        >
          <Trophy size={14} /> All Verified Creators
        </button>
        <button 
          className={`btn ${filterMode === 'SEBI_ONLY' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFilterMode('SEBI_ONLY')}
          style={{ fontSize: 13, padding: '8px 16px' }}
        >
          <ShieldCheck size={14} /> SEBI Registered Desks Only
        </button>
        <button 
          className={`btn ${filterMode === 'HALL_OF_SHAME' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFilterMode('HALL_OF_SHAME')}
          style={{ fontSize: 13, padding: '8px 16px', borderColor: filterMode === 'HALL_OF_SHAME' ? '#fb7185' : undefined, background: filterMode === 'HALL_OF_SHAME' ? '#e11d48' : undefined, color: filterMode === 'HALL_OF_SHAME' ? '#fff' : undefined }}
        >
          <AlertTriangle size={14} /> Lowest Accuracy &amp; High Drawdown
        </button>
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
        {filteredRows && (
          <table className="mp">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Advisor / Entity</th>
                <th>Platform</th>
                <th>SEBI Reg</th>
                <th>Audited Calls</th>
                <th>Raw Hit Rate</th>
                <th>Wilson 95% CI</th>
                <th>Max Drawdown</th>
                <th>Bayes Score</th>
                <th>Grade</th>
                <th>Audit Report</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
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
                  <td className="num" style={{ color: 'var(--muted)', fontSize: 12 }}>
                    {r.wilson_low != null ? `[${r.wilson_low}% – ${r.wilson_high}%]` : '—'}
                  </td>
                  <td className="num" style={{ color: '#fb7185' }}>{r.max_drawdown}%</td>
                  <td>
                    <div className="row">
                      <div className="bar" style={{ width: 70 }}>
                        <i style={{ width: `${r.bayes_win_rate || r.trust_score}%`, background: (r.bayes_win_rate || r.trust_score) >= 60 ? 'var(--green)' : 'var(--blue)' }} />
                      </div>
                      <span className="num" style={{ fontWeight: 700 }}>{r.bayes_win_rate != null ? `${r.bayes_win_rate}%` : r.trust_score}</span>
                    </div>
                  </td>
                  <td><span className={`pill ${r.grade === 'A' ? 'pill-hit' : r.grade === 'F' || r.grade === 'D' ? 'pill-miss' : 'pill-open'}`}>{r.grade}</span></td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 11, padding: '4px 8px', gap: 4 }}
                      onClick={() => {
                        const tweetText = encodeURIComponent(
                          `📊 MarketProbe Audit Report Card: ${r.name} (${r.handle})\n` +
                          `• Win Rate: ${r.win_rate}%\n` +
                          `• Max Drawdown: ${r.max_drawdown}%\n` +
                          `• Reliability Grade: ${r.grade}\n` +
                          `• SEBI Status: ${r.is_sebi ? 'Registered' : 'Unregistered'}\n` +
                          `Tracked autonomously on MarketProbe Terminal 🚀`
                        );
                        window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
                      }}
                      title="Share verified audit card on X / Twitter"
                    >
                      <Share2 size={12} /> Share Card
                    </button>
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

/* -------------------------------- SIMULATOR ------------------------------- */
export function Simulator() {
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
export function Checker({ onAuditInCouncil }) {
  const [text, setText] = useState('Buy RELIANCE at 1378, target 1495, stop loss 1330');
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
          placeholder="e.g. RELIANCE buy above 1378, tgt 1495, SL 1330" 
        />
        <div className="row between" style={{ marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--dim)' }}>Supported:</span>
            <span className="pill pill-buy" style={{ fontSize: 10 }}>English</span>
            <span className="pill pill-open" style={{ fontSize: 10 }}>Hinglish / Hindi Audio Transcripts</span>
          </div>
          <button className="btn btn-primary" onClick={check} disabled={busy} style={{ padding: '10px 20px' }}>
            {busy ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />} Verify Stock Tip
          </button>
        </div>

        {/* Quick Hinglish / English Presets */}
        <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: 'var(--dim)' }}>Try real samples:</span>
          <button 
            type="button" 
            className="btn btn-ghost" 
            style={{ fontSize: 11.5, padding: '4px 10px' }}
            onClick={() => setText('ICICIBANK breaking out above 1640 with target 1785 and SL at 1580. Heavy delivery volumes!')}
          >
            English Breakout
          </button>
          <button 
            type="button" 
            className="btn btn-ghost" 
            style={{ fontSize: 11.5, padding: '4px 10px' }}
            onClick={() => setText('RELIANCE kal 1378 ke upar buy karo, target 1495 aur stop loss 1330 rakhna')}
          >
            Hinglish YouTube Forward
          </button>
          <button 
            type="button" 
            className="btn btn-ghost" 
            style={{ fontSize: 11.5, padding: '4px 10px' }}
            onClick={() => setText('HDFCBANK long above 846 target 920 sl 812 strict stoploss')}
          >
            Telegram Desk Call
          </button>
        </div>
      </div>

      {err && <div className="err" style={{ marginTop: 16 }}>{err}</div>}

      {res && (
        <div className="card" style={{ padding: 24, marginTop: 20, border: '1px solid rgba(16,185,129,0.3)' }}>
          <div className="row between" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{res.verdict_title || 'Audited Setup Analysis'}</h3>
              <div style={{ color: 'var(--dim)', fontSize: 12, marginTop: 2 }}>{res.status}</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              {res.ai_conviction_score != null && (
                <span className={`pill ${res.ai_conviction_score >= 60 ? 'pill-hit' : res.ai_conviction_score >= 50 ? 'pill-open' : 'pill-miss'}`} style={{ fontSize: 13, padding: '6px 12px' }}>
                  {res.ai_conviction_score}% Model Conviction
                </span>
              )}
              {onAuditInCouncil && res.ticker && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    onAuditInCouncil({
                      ticker: res.ticker,
                      action: res.action || 'BUY',
                      entry_price: res.extracted_entry,
                      target_price: res.extracted_target,
                      stoploss_price: res.extracted_stoploss,
                      creator_name: 'Fact-Check Submission',
                    })
                  }
                >
                  <Activity size={14} /> Run 5-Agent Council Audit <ArrowRight size={14} />
                </button>
              )}
            </div>
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
