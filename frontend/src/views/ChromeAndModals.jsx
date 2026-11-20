import React, { useEffect, useState } from 'react';
import {
  Activity, PlayCircle, LogOut, Search, ShieldCheck, Trophy,
  Calculator, CheckCircle2, BookOpen, Rss, Play, Loader2,
  ExternalLink, Zap, Database, TrendingUp, TrendingDown,
  Layers, ChevronRight, BarChart3, AlertTriangle, Sparkles,
  Bell, Download, ArrowRight, Lock, Key, Users, Check, X, Shield, Globe,
  Sun, Moon, Palette, Bookmark, CreditCard, Star, Maximize2, Clock, Copy, ChevronDown,
  Share2, Terminal
} from 'lucide-react';
import { API, api, fmt, inr } from '../lib/apiClient.js';

/* ---------------------------------- LIVE TAPE ----------------------------- */
export function LiveTape() {
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
    const iv = setInterval(fetchQuotes, 10000);
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

/* ---------------------------------- OAUTH & AUTH MODAL ---------------------------------- */
export function OAuthModal({ open, onClose, onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!open) return null;

  const handleOAuth = async (provider, defaultName) => {
    setErr('');
    setOauthLoading(provider);
    try {
      const email = `trader.${provider}@marketprobe.finance`;
      const data = await api('/auth/oauth', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          name: defaultName,
          email,
        }),
      });
      onAuth(data.access_token, data.user, true);
    } catch (ex) {
      setErr(ex.message || `Failed to sign in with ${provider}`);
    } finally {
      setOauthLoading(null);
    }
  };

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
      setErr(ex.message === 'Failed to fetch' ? 'Cannot reach server. Is the backend running?' : ex.message);
    } finally { 
      setBusy(false); 
    }
  };

  const launchDemo = async () => {
    setBusy(true);
    setErr('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'demo@marketprobe.in', password: 'demo123' }) });
      onAuth(data.access_token, data.user, true);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} title="Close">
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="mp-logo-badge" style={{ margin: '0 auto 12px', width: 46, height: 46 }}>
            <Activity size={24} />
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
            {mode === 'login' ? 'Access MarketProbe Terminal' : 'Create Quantitative Account'}
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13.5 }}>
            Enterprise algorithmic verification & regulatory alpha suite.
          </p>
        </div>

        {/* 1-Click One-Touch OAuth Logins */}
        <div className="oauth-btn-group">
          <button 
            type="button" 
            className="btn-oauth google" 
            onClick={() => handleOAuth('Google', 'Quantitative Portfolio Manager')} 
            disabled={busy || !!oauthLoading}
          >
            {oauthLoading === 'Google' ? <Loader2 size={16} className="spin" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            Continue with Google Single Sign-On
          </button>

          <button 
            type="button" 
            className="btn-oauth github" 
            onClick={() => handleOAuth('GitHub', 'Algo Engineer & Quant')} 
            disabled={busy || !!oauthLoading}
          >
            {oauthLoading === 'GitHub' ? <Loader2 size={16} className="spin" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            )}
            Sign in with GitHub
          </button>

          <button 
            type="button" 
            className="btn-oauth zerodha" 
            onClick={() => handleOAuth('Zerodha', 'Zerodha Kite Trader')} 
            disabled={busy || !!oauthLoading}
          >
            {oauthLoading === 'Zerodha' ? <Loader2 size={16} className="spin" /> : (
              <span style={{ fontWeight: 900, letterSpacing: '0.5px' }}>⚡ KITE</span>
            )}
            Connect with Zerodha Kite Connect
          </button>
        </div>

        <div className="divider">or standard fund credentials</div>

        <div className="tabs2">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setErr(''); }}>Institutional Login</button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setErr(''); }}>Register Trader Account</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              Full Legal / Fund Name
              <input className="input" value={form.name} onChange={set('name')} placeholder="Dr. Vikram Sen / Apex Quant Fund" required />
            </label>
          )}
          <label>
            Corporate / Trader Email Address
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="trader@hedgefund.in" autoComplete="email" required />
          </label>
          <label>
            Password
            <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Minimum 6 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
          </label>

          {err && (
            <div className="err" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="#fb7185" style={{ flexShrink: 0 }} />
              <span>{err}</span>
            </div>
          )}

          <button className="btn btn-primary btn-lg" style={{ justifyContent: 'center', marginTop: 8 }} disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : <Lock size={16} />}
            {mode === 'login' ? 'Authenticate & Enter Terminal' : 'Create Quantitative Account'}
          </button>

          <button type="button" className="btn btn-ghost" style={{ justifyContent: 'center', marginTop: 4 }} onClick={launchDemo} disabled={busy}>
            <PlayCircle size={15} color="var(--green2)" /> Launch Verified Demo Trader Session
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------- INSTITUTIONAL TERMINAL BADGE ---------------------------------- */
/* ---------------------------------- HONEST DATA FRESHNESS INDICATOR ---------------------------------- */
export function TerminalStatusIndicator() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let active = true;
    const poll = () => {
      api('/system/data-health')
        .then((d) => { if (active) setHealth(d); })
        .catch(() => {});
    };
    poll();
    const iv = setInterval(poll, 30000);
    return () => { active = false; clearInterval(iv); };
  }, []);

  const isLive = health?.quote_feed_status === 'LIVE_EXCHANGE';
  const syncTime = health?.last_quote_sync ? String(health.last_quote_sync).slice(0, 5) : '';
  const tooltip = health
    ? `Feed: ${health.quote_feed_status} (last sync ${health.last_quote_sync || 'N/A'}) | Verified Primary Calls: ${health.verified_primary_calls} | Hygiene Anomalies: ${health.hygiene_anomalies_remaining}`
    : 'Checking live exchange feed & data hygiene status...';

  return (
    <div
      className="terminal-status-chip"
      title={tooltip}
      style={
        isLive
          ? undefined
          : {
              background: 'rgba(245, 158, 11, 0.1)',
              borderColor: 'rgba(245, 158, 11, 0.35)',
            }
      }
    >
      <span
        className="live-dot"
        style={
          isLive
            ? undefined
            : { background: '#f59e0b', boxShadow: '0 0 6px #f59e0b', animation: 'none' }
        }
      />
      <span
        className="status-text"
        style={isLive ? undefined : { color: '#fbbf24' }}
      >
        {isLive ? 'NSE LIVE' : `SNAPSHOT${syncTime ? ` · ${syncTime}` : ''}`}
      </span>
    </div>
  );
}

/* ---------------------------------- PROOF INSPECTOR MODAL ---------------------------------- */
export function ProofInspectorModal({ record, onClose }) {
  if (!record) return null;
  const tier = record.verification_tier || 'ARCHIVED_UNVERIFIED';
  const isVerified = tier === 'VERIFIED_PRIMARY';
  const hasRealUrl = record.source_url && /^https?:\/\//i.test(record.source_url) && !['https://www.youtube.com', 'https://www.nseindia.com', 'https://research.brokerage.com'].includes(record.source_url.toLowerCase());

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, padding: 24, background: '#0b0f17', border: '1px solid #243248' }}>
        <div className="row between" style={{ marginBottom: 14, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
          <div className="row" style={{ gap: 8 }}>
            <ShieldCheck size={18} color={isVerified ? '#34d399' : '#fbbf24'} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Primary-Source Proof &amp; Audit Record #{record.id}</div>
              <div style={{ fontSize: 11.5, color: 'var(--dim)', fontFamily: 'var(--mono)' }}>
                SHA-256 Proof Hash: {record.proof_hash || 'UNHASHED'}
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="row between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div className="row" style={{ gap: 8 }}>
            <span className={`pill ${isVerified ? 'pill-hit' : 'pill-open'}`}>{tier.replace(/_/g, ' ')}</span>
            <span className="pill pill-sebi">{record.platform}</span>
            <span className={`pill ${record.action === 'BUY' ? 'pill-buy' : 'pill-sell'}`}>
              {record.action} {String(record.ticker || '').replace('.NS', '')}
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--dim)', fontFamily: 'var(--mono)' }}>
            Logged: {String(record.timestamp || record.call_timestamp || 'N/A').slice(0, 19)}
          </span>
        </div>

        <div className="levels" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 14 }}>
          <div className="level"><small>Stated Entry</small><b>{inr(record.stated_entry_price || record.entry_price)}</b></div>
          <div className="level"><small>Target</small><b style={{ color: 'var(--green2)' }}>{inr(record.target_price)}</b></div>
          <div className="level"><small>Stop-Loss</small><b style={{ color: '#fb7185' }}>{inr(record.stoploss_price)}</b></div>
          <div className="level"><small>Exchange Exit</small><b>{record.actual_exit_price ? inr(record.actual_exit_price) : 'Open / Pending'}</b></div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', marginBottom: 6 }}>
            Archived Primary Statement ({record.creator_name || 'Tracked Source'})
          </div>
          <div className="quote" style={{ fontSize: 13 }}>{record.quote || record.raw_quote || 'No verbatim transcript stored.'}</div>
        </div>

        <div className="row between" style={{ paddingTop: 12, borderTop: '1px solid var(--line)', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 11.5, color: 'var(--dim)' }}>
            Outcome: <b style={{ color: 'var(--text)' }}>{record.outcome_status || record.status || 'OPEN'}</b>
            {record.labeled_at ? ` · Resolved ${String(record.labeled_at).slice(0, 16)}` : ''}
          </div>
          {hasRealUrl ? (
            <a href={record.source_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: 12, textDecoration: 'none' }}>
              Open Primary Source <ExternalLink size={12} />
            </a>
          ) : (
            <span style={{ fontSize: 11.5, color: '#fbbf24' }}>No deep primary URL archived for this legacy record</span>
          )}
        </div>
      </div>
    </div>
  );
}
