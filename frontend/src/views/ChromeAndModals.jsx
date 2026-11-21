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

/* ---------------------------------- REAL DATABASE AUTH MODAL ---------------------------------- */
export function OAuthModal({ open, mode: initialMode = 'login', onClose, onAuth }) {
  const [mode, setMode] = useState(initialMode || 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode === 'signup' ? 'signup' : 'login');
      setErr('');
    }
  }, [initialMode, open]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const emailClean = form.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(emailClean)) return setErr('Please enter a valid email address.');

    if (mode === 'signup') {
      if (form.name.trim().length < 2) return setErr('Please enter your full name (at least 2 characters).');
      if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
        return setErr('Password must be at least 8 characters and include both letters and numbers.');
      }
      if (form.password !== form.confirmPassword) {
        return setErr('Passwords do not match.');
      }
    } else if (!form.password) {
      return setErr('Please enter your password.');
    }

    setBusy(true);
    try {
      const data =
        mode === 'login'
          ? await api('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email: emailClean, password: form.password }),
            })
          : await api('/auth/register', {
              method: 'POST',
              body: JSON.stringify({
                name: form.name.trim(),
                email: emailClean,
                password: form.password,
              }),
            });
      onAuth(data.access_token, data.user, mode === 'signup');
    } catch (ex) {
      setErr(ex.message === 'Failed to fetch' ? 'Cannot reach MarketProbe server on port 8080.' : ex.message);
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

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div className="mp-logo-badge" style={{ margin: '0 auto 12px', width: 46, height: 46 }}>
            <Activity size={24} />
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
            {mode === 'login' ? 'Sign In to MarketProbe v1.0' : 'Create MarketProbe Account'}
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>
            Database-backed PBKDF2-SHA256 authentication &amp; revocable JWT sessions.
          </p>
        </div>

        <div className="tabs2" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login');
              setErr('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => {
              setMode('signup');
              setErr('');
            }}
          >
            Create Account
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              Full Name
              <input
                className="input"
                value={form.name}
                onChange={set('name')}
                placeholder="Dhruv Gourisaria"
                autoComplete="name"
                required
              />
            </label>
          )}
          <label>
            Email Address
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder={mode === 'signup' ? '8+ chars with letters & numbers' : 'Enter your password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>
          {mode === 'signup' && (
            <label>
              Confirm Password
              <input
                className="input"
                type="password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
              />
            </label>
          )}

          {err && (
            <div className="err" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="#fb7185" style={{ flexShrink: 0 }} />
              <span>{err}</span>
            </div>
          )}

          <button className="btn btn-primary btn-lg" style={{ justifyContent: 'center', marginTop: 8 }} disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : <Lock size={16} />}
            {mode === 'login' ? 'Sign In & Open Terminal' : 'Create Account & Enter Terminal'}
          </button>
        </form>

        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--line)',
            fontSize: 11.5,
            color: 'var(--dim)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <ShieldCheck size={14} color="var(--green2)" />
          <span>Credentials hashed via PBKDF2-SHA256 (120k rounds) · Stored in SQLite/PostgreSQL</span>
        </div>
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
