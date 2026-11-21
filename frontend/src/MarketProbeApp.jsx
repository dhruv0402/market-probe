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
import Tour from './Tour.jsx';
import FinBotDesk from './FinBotDesk.jsx';
import FinBotDrawer from './FinBotDrawer.jsx';
import AIHedgeFundTerminal from './AIHedgeFundTerminal.jsx';
import AIEvalHarnessView from './AIEvalHarnessView.jsx';
import InsiderClusterRadar from './InsiderClusterRadar.jsx';
import { api } from './lib/apiClient.js';
import { LiveTape, OAuthModal, TerminalStatusIndicator } from './views/ChromeAndModals.jsx';
import LandingPage from './views/LandingPage.jsx';
import { Feed } from './views/FeedViews.jsx';
import { StocksRadar, AlphaAlerts, Rankings, Simulator, Checker } from './views/AnalyticsViews.jsx';
import { WatchlistComponent, BillingComponent, Dataset, How } from './views/UserAndLedgerViews.jsx';
import './mp.css';


const PRIMARY_TABS = [
  { id: 'TERMINAL', label: 'Council', icon: Activity },
  { id: 'FEED', label: 'Feed', icon: Rss },
  { id: 'RANKINGS', label: 'Rankings', icon: Trophy },
  { id: 'SIMULATOR', label: 'Simulator', icon: Calculator },
  { id: 'FINBOT', label: 'FinBot', icon: Sparkles },
  { id: 'DATASET', label: 'Dataset', icon: Database },
];

const MORE_TABS = [
  { id: 'INSIDERS', label: 'Insider Cluster Radar', icon: Users },
  { id: 'STOCKS', label: 'Stocks & Sectors', icon: Layers },
  { id: 'WATCHLIST', label: 'My Watchlist', icon: Bookmark },
  { id: 'ALERTS', label: 'Alpha Alerts', icon: Bell },
  { id: 'CHECKER', label: 'Fact-Check NLP', icon: CheckCircle2 },
  { id: 'EVAL', label: 'AI Evaluation', icon: ShieldCheck },
  { id: 'BILLING', label: 'Plans & Billing', icon: CreditCard },
  { id: 'HOW', label: 'How It Works (v1.0)', icon: BookOpen },
  { id: 'OVERVIEW', label: 'Opening Page (v1.0)', icon: Globe },
];

const TABS = [...PRIMARY_TABS, ...MORE_TABS];

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

/* ----------------------------------- APP ---------------------------------- */
export default function MarketProbeApp() {
  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('mp_user'));
      if (u) return u;
    } catch { }
    return null; // First-time visitors open cleanly on the MarketProbe v1.0 Opening Page
  });
  const [tab, setTab] = useState('TERMINAL'); // Inside workspace, default directly to 5-Agent Quant Council
  const [selectedAuditSetup, setSelectedAuditSetup] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [tour, setTour] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [feed, setFeed] = useState(null);
  const [feedErr, setFeedErr] = useState('');
  const [copilotOpen, setCopilotOpen] = useState(false);

  const openInQuantCouncil = (setup) => {
    setSelectedAuditSetup({ ...setup, _ts: Date.now() });
    setMoreMenuOpen(false);
    setTab('TERMINAL');
  };

  // Global Cmd+K / Ctrl+K / Ctrl+J hotkey listener to toggle FinBot Copilot
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K' || e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setCopilotOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && copilotOpen) {
        setCopilotOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copilotOpen]);

  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });

  const [theme, setTheme] = useState(() => localStorage.getItem('mp_theme') || 'dark');
  const [glow, setGlow] = useState(() => localStorage.getItem('mp_glow') || 'emerald');

  useEffect(() => {
    localStorage.setItem('mp_theme', theme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mp_glow', glow);
    document.documentElement.setAttribute('data-glow', glow);
  }, [glow]);

  // Validate active JWT session on startup
  useEffect(() => {
    const token = localStorage.getItem('mp_token');
    if (token) {
      api('/auth/me')
        .then((data) => {
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('mp_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {
          // Token expired or invalid, log out cleanly
          localStorage.removeItem('mp_token');
          localStorage.removeItem('mp_user');
          setUser(null);
        });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const fetchFeed = () => {
      api('/home-feed')
        .then((data) => { if (active) setFeed(data); })
        .catch((e) => { if (active && !feed) setFeedErr(e.message); });
    };

    fetchFeed();
    // Auto-refresh recommendations feed every 8 seconds to catch fresh ingested calls
    const iv = setInterval(fetchFeed, 8000);
    return () => { active = false; clearInterval(iv); };
  }, [user]);

  const onAuth = (token, u, isNew, targetTab = 'TERMINAL') => {
    localStorage.setItem('mp_token', token);
    localStorage.setItem('mp_user', JSON.stringify(u));
    setUser(u);
    setAuthModal({ open: false, mode: 'login' });
    setTab(targetTab);
    if (isNew && !localStorage.getItem(`mp_tour_done_${u.email}`)) setWelcome(false);
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

  const launchDemoUser = async (targetTab = 'TERMINAL') => {
    const dest = typeof targetTab === 'string' ? targetTab : 'TERMINAL';
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'demo@marketprobe.in', password: 'demo123' }) });
      onAuth(data.access_token, data.user, false, dest);
    } catch {
      const demoU = { id: 'usr_demo', email: 'demo@marketprobe.in', name: 'Institutional Quant', role: 'pro_trader', tier: 'enterprise' };
      onAuth('demo_jwt_token', demoU, false, dest);
    }
  };

  if (!user || tab === 'OVERVIEW') {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
          onLaunchDemo={(dest) => {
            if (user) {
              setTab(typeof dest === 'string' ? dest : 'TERMINAL');
            } else {
              launchDemoUser(dest);
            }
          }}
        />
        <OAuthModal
          open={authModal.open}
          onClose={() => setAuthModal({ ...authModal, open: false })}
          onAuth={(tok, u, isNew) => onAuth(tok, u, isNew, 'TERMINAL')}
        />
      </>
    );
  }

  return (
    <>
      <LiveTape />
      
      <header className="mp-header">
        <div className="mp-logo" onClick={() => setTab('TERMINAL')}>
          <div className="mp-logo-badge"><Activity size={20} /></div>
          <div>
            MarketProbe<span style={{ color: 'var(--green2)' }}>.</span>
            <small>QUANT COUNCIL · v1.0</small>
          </div>
        </div>

        <nav className="mp-nav" data-tour="nav" style={{ position: 'relative' }}>
          {PRIMARY_TABS.map(({ id, label, icon: I }) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => {
                setTab(id);
                setMoreMenuOpen(false);
              }}
            >
              <I size={15} />
              <span>{label}</span>
            </button>
          ))}

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={MORE_TABS.some((m) => m.id === tab) ? 'active' : ''}
              onClick={() => setMoreMenuOpen((prev) => !prev)}
            >
              <Layers size={14} />
              <span>More</span>
              <ChevronDown size={12} />
            </button>

            {moreMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: 210,
                  background: '#0d131f',
                  border: '1px solid var(--line2)',
                  borderRadius: 10,
                  padding: 6,
                  zIndex: 120,
                  boxShadow: '0 14px 32px rgba(0,0,0,0.65)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {MORE_TABS.map(({ id, label, icon: I }) => (
                  <button
                    key={id}
                    type="button"
                    className={tab === id ? 'active' : ''}
                    onClick={() => {
                      setTab(id);
                      setMoreMenuOpen(false);
                    }}
                    style={{ justifyContent: 'flex-start', width: '100%', padding: '8px 12px', fontSize: 13.5 }}
                  >
                    <I size={14} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="mp-spacer" />

        {/* Real-time Sub-Second NSE Status Indicator */}
        <TerminalStatusIndicator />

        {/* Global FinBot Copilot Launcher */}
        <button 
          className="btn" 
          onClick={() => setCopilotOpen(true)}
          title="Open FinBot AI Copilot (Cmd+K)"
          style={{
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <Sparkles size={13} />
          <span>Copilot</span>
          <kbd style={{ fontSize: '9.5px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '3px', padding: '1px 4px', color: '#94a3b8' }}>⌘K</kbd>
        </button>

        <div className="user-chip">
          <div className="avatar">{user.name ? user.name[0].toUpperCase() : 'U'}</div>
          <div className="meta">
            <b>{user.name}</b>
            <span className="tier">{user.tier ? user.tier.toUpperCase() : 'PRO'}</span>
          </div>
        </div>

        <button className="btn btn-ghost" style={{ padding: '6px 9px', flexShrink: 0 }} onClick={logout} title="Log Out of Session">
          <LogOut size={14} />
        </button>
      </header>

      <main
        className="mp-main"
        style={tab === 'TERMINAL' ? { maxWidth: '100%', padding: 0, margin: 0 } : undefined}
      >
        {tab === 'FEED' && (
          <Feed
            data={feed}
            loading={!feed && !feedErr}
            error={feedErr}
            onAuditInCouncil={openInQuantCouncil}
          />
        )}
        <div style={{ display: tab === 'TERMINAL' ? 'block' : 'none' }}>
          <AIHedgeFundTerminal
            selectedSetup={selectedAuditSetup}
            onNavigateTab={setTab}
          />
        </div>
        {tab === 'INSIDERS' && <InsiderClusterRadar onAuditInCouncil={openInQuantCouncil} />}
        {tab === 'WATCHLIST' && <WatchlistComponent />}
        {tab === 'ALERTS' && <AlphaAlerts onAuditInCouncil={openInQuantCouncil} />}
        {tab === 'STOCKS' && <StocksRadar />}
        {tab === 'RANKINGS' && <Rankings />}
        {tab === 'SIMULATOR' && <Simulator />}
        {tab === 'FINBOT' && <FinBotDesk onNavigateTab={setTab} />}
        {tab === 'EVAL' && <AIEvalHarnessView />}
        {tab === 'CHECKER' && <Checker onAuditInCouncil={openInQuantCouncil} />}
        {tab === 'DATASET' && <Dataset onAuditInCouncil={openInQuantCouncil} />}
        {tab === 'BILLING' && <BillingComponent user={user} onUserUpdate={(u) => setUser(u)} />}
        {tab === 'HOW' && <How startTour={startTour} />}
      </main>

      {/* Persistent Statutory SEBI Non-Advisory Disclosure Bar */}
      <footer
        style={{
          borderTop: '1px solid var(--line)',
          background: '#05080d',
          padding: '10px 20px',
          fontSize: '11px',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span>
          <b style={{ color: '#94a3b8' }}>SEBI Non-Advisory Disclosure:</b> MarketProbe is an empirical performance-auditing, primary-source verification, and quantitative simulation platform. It is <b style={{ color: '#cbd5e1' }}>not</b> a SEBI-registered Investment Adviser (IA) or Research Analyst (RA) and does not provide buy/sell recommendations.
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '10.5px', color: '#475569' }}>
          Proof Standard: Empirical Bayes + Wilson 95% CI • SHA-256 Ledger
        </span>
      </footer>

      {/* Global Slide-Out Floating FinBot Copilot Drawer */}
      <FinBotDrawer 
        isOpen={copilotOpen} 
        onClose={() => setCopilotOpen(false)} 
        onNavigateTab={(targetTab) => {
          setTab(targetTab);
          setCopilotOpen(false);
        }}
      />

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
