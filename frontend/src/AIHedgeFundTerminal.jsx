import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Database,
  Activity,
  RefreshCw,
  UploadCloud,
  FileText,
  PlayCircle,
  BarChart2,
  Zap,
  ArrowRight,
  UserCheck,
  MessageSquare,
  Play,
  Send,
  Sparkles,
  Scale,
  Search,
  Brain,
  Radio,
  Layers,
  RotateCcw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const INTENT_LABELS = {
  SIGNAL_BROADCAST: {
    label: 'Signal Broadcast',
    cls: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  },
  PEER_CHALLENGE: {
    label: 'Peer Challenge',
    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
  },
  PARAMETER_RECALIBRATION: {
    label: 'Bayesian Haircut',
    cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
  },
  COUNTERFACTUAL_PROPOSAL: {
    label: 'Counterfactual Proposal',
    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  },
  RISK_CONSTRAINT_INJECTION: {
    label: 'Risk & Tax Gate',
    cls: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
  },
  EQUILIBRIUM_SYNTHESIS: {
    label: 'CIO Decree',
    cls: 'bg-teal-500/15 text-teal-300 border-teal-500/35',
  },
};

const VOTE_LABELS = {
  BULLISH: { text: 'Bullish', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35' },
  APPROVED: { text: 'Approved', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35' },
  COMPLIANT: { text: 'SEBI Compliant', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35' },
  CREDIBLE: { text: 'Credible Desk', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35' },
  HIGH_CONVICTION_EXECUTE: {
    text: 'High-Conviction Execute',
    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  },
  COUNCIL_RESTRUCTURED_BUY: {
    text: 'Council-Restructured Buy',
    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  },
  BEARISH_VETO: { text: 'Math Veto', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40' },
  RISK_VETO: { text: 'Risk Veto', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40' },
  INSTITUTIONAL_VETO: {
    text: 'Institutional Veto — Sub-Optimal Risk/Alpha',
    cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  },
  SEBI_WARNING: { text: 'SEBI Flag', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40' },
  UNRELIABLE_FLAG: { text: 'Low Empirical Edge', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40' },
  AVERAGE: { text: 'Neutral Track', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/35' },
  NEUTRAL: { text: 'Neutral', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/35' },
  DIVERGENT_SIGNAL: { text: 'Herd Divergence', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/35' },
  UNVERIFIED_DESK: { text: 'Unverified Desk', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/35' },
  MODERATE_SPECULATIVE: {
    text: 'Moderate Speculative Setup',
    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  },
  MODERATE_RESTRUCTURED: {
    text: 'Improved Risk/Reward Setup',
    cls: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  },
  DEFENSIVE_HOLD: { text: 'Defensive Hold', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/35' },
  DEFENSIVE_WAIT: { text: 'Defensive Wait', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/35' },
  AVOID_SUBPAR_ALPHA: {
    text: 'Avoid — Weak Expected Value',
    cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  },
};

function getVoteMeta(code) {
  return (
    VOTE_LABELS[code] || {
      text: (code || 'Pending').replace(/_/g, ' '),
      cls: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
    }
  );
}

export default function AIHedgeFundTerminal({ selectedSetup, onNavigateTab }) {
  const [activeNav, setActiveNav] = useState('council'); // 'council' | 'dropzone' | 'quantlab'
  const [ticker, setTicker] = useState('RELIANCE');
  const [action, setAction] = useState('BUY');
  const [entryPrice, setEntryPrice] = useState(2980);
  const [targetPrice, setTargetPrice] = useState(3240);
  const [stoplossPrice, setStoplossPrice] = useState(2890);
  const [creatorName, setCreatorName] = useState('Motilal Oswal');
  const [horizonDays, setHorizonDays] = useState(30);
  const [userDirective, setUserDirective] = useState('');

  // Live queue from DB
  const [liveQueue, setLiveQueue] = useState([]);
  const [candles, setCandles] = useState([]);
  const [candlesLoading, setCandlesLoading] = useState(false);

  // Multimodal dropzone inputs
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // MPT & Tax Lab state
  const [mptResult, setMptResult] = useState(null);
  const [taxGains, setTaxGains] = useState(120000);
  const [taxLosses, setTaxLosses] = useState(40000);
  const [taxDays, setTaxDays] = useState(180);
  const [taxResult, setTaxResult] = useState(null);
  const [quantLabLoading, setQuantLabLoading] = useState(false);

  // Council runtime states
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditResult, setAuditResult] = useState(null);
  const [memoryProfile, setMemoryProfile] = useState(null);
  const [universeCount, setUniverseCount] = useState(2458);

  // Inter-agent bus filter & replay state
  const [busRoundFilter, setBusRoundFilter] = useState('ALL');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(-1);

  const fileInputRef = useRef(null);
  const replayTimerRef = useRef(null);

  const fetchMemory = async () => {
    try {
      const res = await fetch('/api/user/memory/profile?user_id=demo-trader');
      if (res.ok) {
        const data = await res.json();
        setMemoryProfile(data);
      }
    } catch (e) {
      console.error('Memory fetch error', e);
    }
  };

  const fetchLiveQueue = async () => {
    try {
      const res = await fetch('/api/home-feed?min_conviction=0');
      if (res.ok) {
        const data = await res.json();
        if (data?.stats?.total_calls) setUniverseCount(data.stats.total_calls);
        if (Array.isArray(data?.recent_tips)) {
          setLiveQueue(data.recent_tips.slice(0, 6));
        }
      }
    } catch (e) {
      console.error('Queue fetch error', e);
    }
  };

  const fetchStockCandles = async (sym) => {
    if (!sym) return;
    setCandlesLoading(true);
    try {
      const res = await fetch(`/api/stock-candles?symbol=${encodeURIComponent(sym)}&period=1mo&interval=1d`);
      if (res.ok) {
        const data = await res.json();
        setCandles(data?.candles || []);
      }
    } catch (e) {
      console.error('Candles fetch error', e);
    } finally {
      setCandlesLoading(false);
    }
  };

  const runQuantLabTools = async (g = taxGains, l = taxLosses, d = taxDays) => {
    setQuantLabLoading(true);
    try {
      const [mptResp, taxResp] = await Promise.all([
        fetch('/api/finbot/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tickers: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK'],
            risk_free_rate: 0.065,
          }),
        }),
        fetch('/api/finbot/tax-harvest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            realized_gains: Number(g) || 0,
            unrealized_losses: Number(l) || 0,
            holding_period_days: Number(d) || 180,
          }),
        }),
      ]);
      if (mptResp.ok) setMptResult(await mptResp.json());
      if (taxResp.ok) setTaxResult(await taxResp.json());
    } catch (e) {
      console.error('Quant lab fetch failed', e);
    } finally {
      setQuantLabLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();
    fetchLiveQueue();
    runMultiAgentAudit();
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, []);

  // Load setup pushed from Verified Feed or Market Open Radar
  useEffect(() => {
    if (!selectedSetup || !selectedSetup.ticker) return;
    const cleanSym = String(selectedSetup.ticker).toUpperCase().replace('.NS', '').replace('.BO', '');
    setActiveNav('council');
    setTicker(cleanSym);
    setAction((selectedSetup.action || 'BUY').toUpperCase());
    setEntryPrice(selectedSetup.entry_price || 1000);
    setTargetPrice(selectedSetup.target_price || 1080);
    setStoplossPrice(selectedSetup.stoploss_price || 950);
    setCreatorName(selectedSetup.creator_name || 'Verified Desk');
    runMultiAgentAudit({
      ticker: cleanSym,
      action: (selectedSetup.action || 'BUY').toUpperCase(),
      entry_price: selectedSetup.entry_price || 1000,
      target_price: selectedSetup.target_price || 1080,
      stoploss_price: selectedSetup.stoploss_price || 950,
      creator_name: selectedSetup.creator_name || 'Verified Desk',
    });
  }, [selectedSetup?._ts]);

  const stopReplay = () => {
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    setIsReplaying(false);
    setReplayIndex(-1);
  };

  const runMultiAgentAudit = async (overrides = {}) => {
    stopReplay();
    setIsAuditing(true);
    setAuditError('');

    const targetSym = overrides.ticker ?? ticker;
    const payload = {
      ticker: targetSym,
      action: overrides.action ?? action,
      entry_price:
        overrides.entry_price !== undefined
          ? parseFloat(overrides.entry_price)
          : parseFloat(entryPrice) || 0,
      target_price:
        overrides.target_price !== undefined
          ? parseFloat(overrides.target_price)
          : parseFloat(targetPrice) || 0,
      stoploss_price:
        overrides.stoploss_price !== undefined
          ? parseFloat(overrides.stoploss_price)
          : parseFloat(stoplossPrice) || 0,
      creator_name: overrides.creator_name ?? creatorName,
      user_id: 'demo-trader',
      horizon_days:
        overrides.horizon_days !== undefined
          ? parseInt(overrides.horizon_days, 10)
          : parseInt(horizonDays, 10) || 30,
      user_directive:
        overrides.user_directive !== undefined ? overrides.user_directive : '',
    };

    try {
      const [auditResp] = await Promise.all([
        fetch('/api/multiagent/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        fetchStockCandles(targetSym),
      ]);

      if (!auditResp.ok) {
        throw new Error(`Council endpoint returned HTTP ${auditResp.status}`);
      }
      const data = await auditResp.json();
      setAuditResult(data);
      if (data.horizon_days) setHorizonDays(data.horizon_days);
      if (payload.user_directive) {
        fetchMemory();
      }
    } catch (e) {
      console.error('Audit failed', e);
      setAuditError(e.message || 'Multi-agent deliberation failed');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDirectiveSubmit = (e, directiveOverride = null) => {
    e?.preventDefault();
    const text = (directiveOverride ?? userDirective).trim();
    if (!text || isAuditing) return;
    if (!directiveOverride) setUserDirective('');
    runMultiAgentAudit({ user_directive: text });
  };

  const handleApplyCounterfactual = () => {
    const cf = auditResult?.counterfactual_restructuring?.restructured_metrics;
    if (!cf) return;
    setEntryPrice(cf.entry);
    setTargetPrice(cf.target);
    setStoplossPrice(cf.stoploss);
    runMultiAgentAudit({
      entry_price: cf.entry,
      target_price: cf.target,
      stoploss_price: cf.stoploss,
    });
  };

  const handleStartReplay = () => {
    const packets = auditResult?.message_bus?.packets || [];
    if (!packets.length) return;
    if (isReplaying) {
      stopReplay();
      return;
    }
    setBusRoundFilter('ALL');
    setIsReplaying(true);
    setReplayIndex(0);
    let idx = 0;
    replayTimerRef.current = setInterval(() => {
      idx += 1;
      if (idx >= packets.length) {
        clearInterval(replayTimerRef.current);
        replayTimerRef.current = null;
        setIsReplaying(false);
      } else {
        setReplayIndex(idx);
      }
    }, 280);
  };

  const handleDropzoneSubmit = async (e) => {
    e?.preventDefault();
    stopReplay();
    setIsAuditing(true);
    setAuditError('');
    try {
      const formData = new FormData();
      if (selectedFile) formData.append('file', selectedFile);
      if (youtubeUrl) formData.append('youtube_url', youtubeUrl);
      if (rawText) formData.append('raw_text', rawText);
      formData.append('creator_name', creatorName || 'Multimodal Dropzone');
      formData.append('user_id', 'demo-trader');

      const res = await fetch('/api/audit/drop', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Dropzone failed (${res.status})`);
      const data = await res.json();
      setAuditResult(data);
      if (data.ticker) {
        setTicker(data.ticker);
        fetchStockCandles(data.ticker);
      }
      if (data.entry) setEntryPrice(data.entry);
      if (data.target) setTargetPrice(data.target);
      if (data.stoploss) setStoplossPrice(data.stoploss);
      setUniverseCount((prev) => prev + 1);
      fetchLiveQueue();
      setActiveNav('council');
    } catch (err) {
      console.error('Dropzone submission failed', err);
      setAuditError(err.message || 'Dropzone failed');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const allPackets = auditResult?.message_bus?.packets || [];
  const visiblePackets = allPackets.filter((p) => {
    const roundMatch = busRoundFilter === 'ALL' || p.round === busRoundFilter;
    if (!roundMatch) return false;
    if (isReplaying && replayIndex >= 0) {
      const pGlobalIdx = allPackets.findIndex((x) => x.id === p.id);
      return pGlobalIdx <= replayIndex;
    }
    return true;
  });

  const activeReplayPacket =
    isReplaying && replayIndex >= 0 && replayIndex < allPackets.length
      ? allPackets[replayIndex]
      : null;

  const favoriteTickersFormatted = Array.isArray(memoryProfile?.favorite_tickers)
    ? memoryProfile.favorite_tickers.join(', ')
    : memoryProfile?.favorite_tickers || 'RELIANCE, TATAMOTORS, TCS';

  const cfData = auditResult?.counterfactual_restructuring;
  const verdictMeta = getVoteMeta(auditResult?.council_verdict);

  return (
    <div className="bg-[#06090e] text-[#e6ecf5] min-h-[calc(100vh-116px)] flex flex-col">
      {/* 1. CLEAN WORKSTATION SUB-BAR */}
      <div className="bg-[#0b0f17] border-b border-[#1b2434] px-5 py-2.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 leading-tight">
                5-Agent Quantitative Council
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                3-Round Peer Bus • Merton Monte Carlo • Empirical Bayes • Tail CVaR
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 bg-[#06090e] p-1 rounded border border-[#1b2434] ml-2">
            <button
              onClick={() => setActiveNav('council')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeNav === 'council'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Deliberation Council</span>
            </button>
            <button
              onClick={() => setActiveNav('dropzone')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeNav === 'dropzone'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/35'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Multimodal Dropzone</span>
            </button>
            <button
              onClick={() => {
                setActiveNav('quantlab');
                if (!mptResult || !taxResult) runQuantLabTools();
              }}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeNav === 'quantlab'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>MPT &amp; Tax Lab</span>
            </button>
          </div>
        </div>

        {/* Live Telemetry Status Pills */}
        <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>
              {auditResult?.message_bus?.redis_synced ? 'Redis Bus Live' : 'In-Memory Bus'}
            </span>
          </div>
          <div className="bg-[#111722] border border-[#1b2434] px-2.5 py-1 rounded text-slate-300">
            Packets:{' '}
            <b className="text-sky-300 tabular-nums">
              {auditResult?.message_bus?.total_packets_exchanged ?? 0}
            </b>{' '}
            • Convergence:{' '}
            <b className="text-emerald-300 tabular-nums">
              {auditResult?.message_bus?.consensus_convergence_pct ?? 0}%
            </b>
          </div>
          <div className="bg-[#111722] border border-[#1b2434] px-2.5 py-1 rounded text-slate-300">
            Audited Ledger: <b className="text-white tabular-nums">{universeCount}</b>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE 3-COLUMN GRID */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANEL: Setup Inputs & Live Audited Calls Queue */}
        <aside className="w-full lg:w-80 bg-[#0b0f17] border-b lg:border-b-0 lg:border-r border-[#1b2434] p-4 flex flex-col gap-5 shrink-0 overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Trade Setup Inputs
              </span>
              <button
                onClick={() => onNavigateTab?.('FEED')}
                className="text-[11px] text-sky-400 hover:underline font-medium"
              >
                Browse Full Feed →
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">
                NSE Ticker
              </label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="quant-input w-full text-sm py-2 px-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  Direction
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="quant-input w-full text-xs py-2 px-2.5"
                >
                  <option value="BUY">BUY (LONG)</option>
                  <option value="SELL">SELL (SHORT)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  Horizon (Days)
                </label>
                <input
                  type="number"
                  min="5"
                  max="365"
                  value={horizonDays}
                  onChange={(e) => setHorizonDays(e.target.value)}
                  className="quant-input w-full text-xs py-2 px-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">
                Finfluencer / Brokerage Desk
              </label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="quant-input w-full text-xs py-2 px-3"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Entry ₹</label>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="quant-input w-full text-xs py-2 text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] text-emerald-400 mb-1">Target ₹</label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="quant-input w-full text-xs py-2 text-center text-emerald-300"
                />
              </div>
              <div>
                <label className="block text-[11px] text-rose-400 mb-1">Stop ₹</label>
                <input
                  type="number"
                  value={stoplossPrice}
                  onChange={(e) => setStoplossPrice(e.target.value)}
                  className="quant-input w-full text-xs py-2 text-center text-rose-300"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setActiveNav('council');
                runMultiAgentAudit();
              }}
              disabled={isAuditing}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Council Deliberating...' : 'Run 3-Round Agent Audit'}</span>
            </button>
          </div>

          {/* Live Database Audited Calls Selector */}
          <div className="border-t border-[#1b2434] pt-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Database Calls Queue
            </div>
            <div className="space-y-2">
              {liveQueue.length === 0 ? (
                <div className="text-xs text-slate-500 py-2">Loading recent calls...</div>
              ) : (
                liveQueue.map((item) => {
                  const sym = String(item.ticker || '').replace('.NS', '');
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveNav('council');
                        setTicker(sym);
                        setAction((item.action || 'BUY').toUpperCase());
                        setEntryPrice(item.entry_price || 1000);
                        setTargetPrice(item.target_price || 1080);
                        setStoplossPrice(item.stoploss_price || 950);
                        setCreatorName(item.influencer_name || 'Verified Desk');
                        runMultiAgentAudit({
                          ticker: sym,
                          action: (item.action || 'BUY').toUpperCase(),
                          entry_price: item.entry_price || 1000,
                          target_price: item.target_price || 1080,
                          stoploss_price: item.stoploss_price || 950,
                          creator_name: item.influencer_name || 'Verified Desk',
                        });
                      }}
                      className={`w-full text-left p-2.5 rounded border transition-colors ${
                        ticker === sym
                          ? 'bg-[#111722] border-sky-500/50'
                          : 'bg-[#06090e] border-[#1b2434] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100">{sym}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.action === 'BUY'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {item.action} • ₹{item.entry_price}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-1">
                        {item.influencer_name || 'Analyst'} • Tgt ₹{item.target_price}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* CENTER PANEL: Dynamic Council / Dropzone / Quant Lab Stage */}
        <main className="flex-1 bg-[#06090e] overflow-y-auto p-5 space-y-5">
          {activeNav === 'dropzone' ? (
            /* MODE 2: MULTIMODAL DRAG-AND-DROP INGESTION */
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-sky-400" />
                    <span>Multimodal Signal Ingestion &amp; Auto-Audit</span>
                  </h2>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                    Commits Live to DB
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Drop a brokerage PDF report, paste a financial YouTube link, or paste any raw
                  WhatsApp/Telegram trade recommendation. Agent 1 parses levels, commits them to
                  SQLite, and convenes all 5 agents immediately.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRawText(
                        'Motilal Oswal recommends BUY on RELIANCE at ₹2980 with target ₹3240 and stop loss ₹2890 on O2C margin expansion.'
                      )
                    }
                    className="btn-quant-tool text-xs py-1 px-2.5 text-sky-300 border-sky-500/30"
                  >
                    Load Sample: RELIANCE Buy Call
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRawText(
                        'ICICI Direct initiates BUY on INFY around ₹1840 targeting ₹2020 with strict stoploss ₹1750 on US BFSI recovery.'
                      )
                    }
                    className="btn-quant-tool text-xs py-1 px-2.5 text-emerald-300 border-emerald-500/30"
                  >
                    Load Sample: INFY Breakout
                  </button>
                </div>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-sky-400 bg-sky-500/10'
                    : 'border-[#1b2434] hover:border-sky-500/50 bg-[#0b0f17]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.mp3,.mp4"
                  className="hidden"
                  onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                />
                <FileText className="w-10 h-10 text-sky-400 mb-3" />
                <span className="text-sm font-bold text-white">
                  {selectedFile
                    ? `Selected File: ${selectedFile.name}`
                    : 'Drop Brokerage PDF, Text Transcript, or Media File Here'}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supports Motilal Oswal / ICICI Direct PDFs, transcripts, or audio clips
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0b0f17] border border-[#1b2434] p-4 rounded-lg space-y-2">
                  <label className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-rose-400" />
                    <span>YouTube Video Link</span>
                  </label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="quant-input w-full text-xs py-2 px-3"
                  />
                </div>

                <div className="bg-[#0b0f17] border border-[#1b2434] p-4 rounded-lg space-y-2">
                  <label className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                    <span>Raw Telegram / FinTwit Recommendation</span>
                  </label>
                  <input
                    type="text"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Buy TATAMOTORS at 940 target 1050 sl 890..."
                    className="quant-input w-full text-xs py-2 px-3"
                  />
                </div>
              </div>

              <button
                onClick={handleDropzoneSubmit}
                disabled={isAuditing || (!selectedFile && !youtubeUrl && !rawText)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {isAuditing
                    ? 'Ingesting & Running 5-Agent Council...'
                    : 'Commit to Empirical DB & Run Council Audit'}
                </span>
              </button>
            </div>
          ) : activeNav === 'quantlab' ? (
            /* MODE 3: MPT PORTFOLIO OPTIMIZER & SECTION 112A TAX LAB */
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Markowitz Efficient Frontier &amp; Section 112A/111A Tax-Harvest Lab
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live SLSQP convex portfolio optimization paired with Indian Income Tax Act loss-harvesting calculator.
                  </p>
                </div>
                <button
                  onClick={() => runQuantLabTools()}
                  disabled={quantLabLoading}
                  className="btn-quant-tool px-3 py-1.5 text-xs text-emerald-300 border-emerald-500/40"
                >
                  {quantLabLoading ? 'Recalculating...' : 'Recompute Quant Models'}
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Markowitz MPT */}
                <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1b2434] pb-2">
                    <span className="text-sm font-bold text-sky-300">
                      Markowitz Tangency Portfolio (Max Sharpe)
                    </span>
                    {mptResult?.max_sharpe_portfolio && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-xs font-mono font-bold">
                        Sharpe: {mptResult.max_sharpe_portfolio.sharpe_ratio}
                      </span>
                    )}
                  </div>

                  {mptResult?.max_sharpe_portfolio && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                      {Object.entries(mptResult.max_sharpe_portfolio.weights_pct || {}).map(
                        ([asset, wt]) => (
                          <div
                            key={asset}
                            className="bg-[#111722] border border-[#1b2434] p-2.5 rounded"
                          >
                            <div className="text-[11px] text-slate-400 truncate">{asset}</div>
                            <div className="text-base font-bold text-white mt-0.5">{wt}%</div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {mptResult?.efficient_frontier && (
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mptResult.efficient_frontier}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1b2434" />
                          <XAxis
                            dataKey="volatility_pct"
                            stroke="#64748b"
                            tick={{ fontSize: 11 }}
                            unit="%"
                          />
                          <YAxis
                            dataKey="expected_return_pct"
                            stroke="#64748b"
                            tick={{ fontSize: 11 }}
                            unit="%"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#111722',
                              borderColor: '#1b2434',
                              fontSize: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="expected_return_pct"
                            name="Expected Return %"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#38bdf8' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Indian Tax-Loss Harvesting Calculator */}
                <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-4">
                  <div className="border-b border-[#1b2434] pb-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-300">
                      Section 111A / 112A Tax-Loss Harvesting Engine
                    </span>
                    <span className="text-xs font-mono text-slate-400">Income Tax Act Sec 70/71</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Realized Gains (₹)</label>
                      <input
                        type="number"
                        value={taxGains}
                        onChange={(e) => setTaxGains(e.target.value)}
                        className="quant-input w-full py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Unrealized Losses (₹)</label>
                      <input
                        type="number"
                        value={taxLosses}
                        onChange={(e) => setTaxLosses(e.target.value)}
                        className="quant-input w-full py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Holding Period (Days)</label>
                      <input
                        type="number"
                        value={taxDays}
                        onChange={(e) => setTaxDays(e.target.value)}
                        className="quant-input w-full py-2 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => runQuantLabTools(taxGains, taxLosses, taxDays)}
                    className="btn-quant-primary py-2 px-4 text-xs"
                  >
                    Compute Net Tax Savings
                  </button>

                  {taxResult && (
                    <div className="bg-[#111722] border border-[#1b2434] rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{taxResult.gain_type}</span>
                        <span className="font-mono font-bold text-amber-300">
                          Effective Rate: {taxResult.tax_rate_pct}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 font-mono">
                        <div>
                          <div className="text-[11px] text-slate-400">Tax Before</div>
                          <div className="text-sm font-bold text-rose-300">
                            ₹{Number(taxResult.tax_before_harvest).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Tax After</div>
                          <div className="text-sm font-bold text-slate-100">
                            ₹{Number(taxResult.tax_after_harvest).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Net Tax Saved</div>
                          <div className="text-base font-bold text-emerald-400">
                            ₹{Number(taxResult.tax_saved).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300">{taxResult.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* MODE 1: 5-AGENT COMMUNICATING DELIBERATION STAGE */
            <>
              {/* Direct Council Command Bar */}
              <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3 space-y-2.5">
                <form onSubmit={handleDirectiveSubmit} className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-sky-400 shrink-0" />
                  <input
                    type="text"
                    value={userDirective}
                    onChange={(e) => setUserDirective(e.target.value)}
                    placeholder="Direct the 5-Agent Council (e.g. 'Test 60 days horizon' or 'Conservative risk max 5% loss')..."
                    className="bg-transparent border-0 outline-none text-sm text-white flex-1 placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={isAuditing || !userDirective.trim()}
                    className="px-3.5 py-1.5 rounded bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500/25 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Direct Council</span>
                  </button>
                </form>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-slate-500 font-medium">Quick Directives:</span>
                  {[
                    'Evaluate 60 days horizon',
                    'Switch to conservative capital preservation max 5% loss',
                    'Evaluate aggressive breakout swing 21 days',
                  ].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={(e) => handleDirectiveSubmit(e, d)}
                      className="px-2 py-0.5 rounded bg-[#111722] border border-[#1b2434] hover:border-sky-500/40 text-slate-300 transition-colors cursor-pointer"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {auditError && (
                <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-lg text-xs">
                  {auditError}
                </div>
              )}

              {/* Grand CIO Consensus Hero Banner + Key 4 Summary Stat Tiles */}
              {auditResult && (
                <div
                  className={`rounded-lg border p-4 space-y-4 ${
                    auditResult.council_verdict === 'HIGH_CONVICTION_EXECUTE'
                      ? 'bg-emerald-500/10 border-emerald-500/35'
                      : auditResult.council_verdict === 'INSTITUTIONAL_VETO'
                      ? 'bg-rose-500/10 border-rose-500/35'
                      : 'bg-amber-500/10 border-amber-500/35'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {auditResult.council_verdict === 'HIGH_CONVICTION_EXECUTE' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <ShieldAlert className="w-5 h-5 text-rose-400" />
                        )}
                        <h2 className="text-base font-bold text-white">
                          {verdictMeta.text}
                        </h2>
                        <span className="px-2 py-0.5 rounded bg-[#06090e]/80 border border-slate-700 text-xs font-mono text-sky-300">
                          {auditResult.ticker} • {auditResult.action} • {auditResult.horizon_days}D Horizon
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed max-w-4xl">
                        {auditResult.executive_summary}
                      </p>
                    </div>

                    <div className="bg-[#06090e]/90 border border-[#1b2434] rounded-lg px-4 py-2.5 text-center shrink-0">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Conviction Score
                      </div>
                      <div className="text-2xl font-bold font-mono text-white tabular-nums mt-0.5">
                        {auditResult.composite_conviction_score}
                        <span className="text-sm text-slate-400"> / 100</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Key Decision Stat Tiles */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
                    <div className="bg-[#0b0f17]/90 border border-[#1b2434] rounded p-3">
                      <div className="text-[11px] text-slate-400">1st-Passage Target Odds</div>
                      <div className="text-lg font-bold text-emerald-400 tabular-nums mt-0.5">
                        {(
                          (auditResult.quant_math?.monte_carlo?.p_target_first || 0) * 100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-[11px] text-slate-500">
                        vs SL Risk{' '}
                        {(
                          (auditResult.quant_math?.monte_carlo?.p_stoploss_first || 0) * 100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>

                    <div className="bg-[#0b0f17]/90 border border-[#1b2434] rounded p-3">
                      <div className="text-[11px] text-slate-400">Post-Tax Expected Return</div>
                      <div className="text-lg font-bold text-sky-300 tabular-nums mt-0.5">
                        {auditResult.risk_memory?.post_tax_ev_pct >= 0 ? '+' : ''}
                        {auditResult.risk_memory?.post_tax_ev_pct ?? 0}%
                      </div>
                      <div className="text-[11px] text-slate-500">Net of STT &amp; Sec 111A tax</div>
                    </div>

                    <div className="bg-[#0b0f17]/90 border border-[#1b2434] rounded p-3">
                      <div className="text-[11px] text-slate-400">Creator Bayes Win-Rate</div>
                      <div className="text-lg font-bold text-amber-300 tabular-nums mt-0.5">
                        {auditResult.forensic_audit?.bayes_shrinkage_rate ?? 50}%
                      </div>
                      <div className="text-[11px] text-slate-500">
                        N={auditResult.forensic_audit?.sample_size ?? 0} • Brier{' '}
                        {auditResult.forensic_audit?.brier_score ?? '0.25'}
                      </div>
                    </div>

                    <div className="bg-[#0b0f17]/90 border border-[#1b2434] rounded p-3">
                      <div className="text-[11px] text-slate-400">Safe Half-Kelly Alloc</div>
                      <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                        {auditResult.risk_memory?.optimal_allocation_pct ?? 0}%
                      </div>
                      <div className="text-[11px] text-slate-500">
                        95% CVaR Tail -{auditResult.quant_math?.tail_risk?.cvar_95_pct ?? 0}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Counterfactual Trade Restructuring Comparison */}
              {cfData && (
                <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2434] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Counterfactual Trade Restructuring (Quant + Risk Negotiation)
                      </span>
                    </div>
                    <button
                      onClick={handleApplyCounterfactual}
                      className="px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Apply Council Restructured Levels</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#111722] border border-[#1b2434] rounded-lg p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">Original Submitted Call</span>
                        <span className="text-xs font-mono text-rose-300">
                          Conviction: {auditResult?.composite_conviction_score}/100
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 font-mono pt-1">
                        <div>
                          <div className="text-[11px] text-slate-400">Target / Stop</div>
                          <b className="text-white text-sm">
                            ₹{cfData.original_metrics.target} / ₹{cfData.original_metrics.stoploss}
                          </b>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Target Odds</div>
                          <b className="text-rose-300 text-sm">
                            {(cfData.original_metrics.p_target_first * 100).toFixed(1)}%
                          </b>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Post-Tax EV</div>
                          <b className="text-amber-300 text-sm">
                            {auditResult?.risk_memory?.post_tax_ev_pct}%
                          </b>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#111722] border border-emerald-500/40 rounded-lg p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300">
                          Council-Negotiated Equilibrium
                        </span>
                        <span className="text-xs font-mono text-emerald-300">
                          {getVoteMeta(cfData.restructured_verdict).text} (
                          {cfData.restructured_conviction_score}/100)
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 font-mono pt-1">
                        <div>
                          <div className="text-[11px] text-slate-400">Optimal Target / SL</div>
                          <b className="text-emerald-300 text-sm">
                            ₹{cfData.restructured_metrics.target} / ₹
                            {cfData.restructured_metrics.stoploss}
                          </b>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Target Odds</div>
                          <b className="text-sky-300 text-sm">
                            {(cfData.restructured_metrics.p_target_first * 100).toFixed(1)}% (
                            {cfData.improvement_hit_prob_pct >= 0 ? '+' : ''}
                            {cfData.improvement_hit_prob_pct}%)
                          </b>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Post-Tax EV / Kelly</div>
                          <b className="text-emerald-300 text-sm">
                            {cfData.restructured_post_tax_ev_pct}% /{' '}
                            {cfData.restructured_allocation_pct}%
                          </b>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5-Agent Deliberation Roster Grid */}
              {auditResult?.agents_roster && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span>5-Agent Council Convergence (Round 1 → Round 3)</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Bayesian Peer Recalibration Active
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                    {auditResult.agents_roster.map((ag) => {
                      const vm = getVoteMeta(ag.vote);
                      const isActiveSender = activeReplayPacket?.sender === ag.agent_id;
                      const isActiveRecipient =
                        activeReplayPacket?.recipient === ag.agent_id ||
                        activeReplayPacket?.recipient === 'BROADCAST_ALL';

                      return (
                        <div
                          key={ag.agent_id}
                          className={`bg-[#0b0f17] rounded-lg p-3 border transition-all space-y-2.5 ${
                            isActiveSender
                              ? 'border-sky-400 ring-2 ring-sky-400/30'
                              : isActiveRecipient
                              ? 'border-emerald-400/60'
                              : 'border-[#1b2434]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-white leading-snug">
                              {ag.name}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${vm.cls}`}
                            >
                              {vm.text}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 leading-snug">{ag.role}</div>
                          <div className="bg-[#111722] px-2.5 py-1.5 rounded border border-[#141b27] flex items-center justify-between text-xs font-mono tabular-nums">
                            <span className="text-slate-400">
                              R1 <b className="text-white">{ag.round_1_score}</b> → R3{' '}
                              <b className="text-sky-300">{ag.round_3_score}</b>
                            </span>
                            <span
                              className={`font-bold ${
                                ag.conviction_delta > 0
                                  ? 'text-emerald-400'
                                  : ag.conviction_delta < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {ag.conviction_delta > 0
                                ? `+${ag.conviction_delta}`
                                : ag.conviction_delta}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dual Interactive Charts: Monte Carlo Cone + Historical Candlesticks */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* 1. Monte Carlo Trajectory Fan Cone */}
                {auditResult?.quant_math?.monte_carlo?.path_sample_cone && (
                  <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-sky-400" />
                        <span>1,000-Path Monte Carlo Cone ({auditResult.horizon_days}D)</span>
                      </span>
                      <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                        <span className="text-emerald-400">Tgt ₹{auditResult.target}</span>
                        <span className="text-rose-400">SL ₹{auditResult.stoploss}</span>
                      </div>
                    </div>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={auditResult.quant_math.monte_carlo.path_sample_cone[0].map(
                            (_, stepIdx) => {
                              const point = { step: `D${stepIdx}` };
                              auditResult.quant_math.monte_carlo.path_sample_cone.forEach(
                                (p, idx) => {
                                  point[`path_${idx}`] = p[stepIdx];
                                }
                              );
                              return point;
                            }
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#141b27" />
                          <XAxis dataKey="step" stroke="#64748b" tick={{ fontSize: 10 }} />
                          <YAxis
                            domain={['auto', 'auto']}
                            stroke="#64748b"
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#111722',
                              borderColor: '#1b2434',
                              fontSize: '11px',
                            }}
                          />
                          <ReferenceLine
                            y={auditResult.target}
                            stroke="#10b981"
                            strokeDasharray="3 3"
                          />
                          <ReferenceLine
                            y={auditResult.stoploss}
                            stroke="#f43f5e"
                            strokeDasharray="3 3"
                          />
                          {auditResult.quant_math.monte_carlo.path_sample_cone.map((_, idx) => (
                            <Area
                              key={idx}
                              type="monotone"
                              dataKey={`path_${idx}`}
                              stroke={idx % 2 === 0 ? '#38bdf8' : '#10b981'}
                              fill="transparent"
                              strokeWidth={1.2}
                              dot={false}
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 2. 30-Day Historical Price Action & Levels */}
                <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span>{ticker} 30-Day Price Trend vs Trade Levels</span>
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {candlesLoading ? 'Loading...' : `${candles.length} Bars`}
                    </span>
                  </div>
                  <div className="h-52 w-full">
                    {candles.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={candles}>
                          <defs>
                            <linearGradient id="councilPriceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#141b27" />
                          <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                          <YAxis
                            domain={['auto', 'auto']}
                            stroke="#64748b"
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#111722',
                              borderColor: '#1b2434',
                              fontSize: '11px',
                            }}
                          />
                          {auditResult?.entry && (
                            <ReferenceLine
                              y={auditResult.entry}
                              stroke="#38bdf8"
                              strokeDasharray="3 3"
                            />
                          )}
                          <Area
                            type="monotone"
                            dataKey="close"
                            name="Close Price (₹)"
                            stroke="#10b981"
                            fill="url(#councilPriceGrad)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-500">
                        Fetching historical series...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive 3-Round Inter-Agent Communication Bus */}
              <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2434] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      3-Round Inter-Agent Communication Log
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'ALL', label: `All (${allPackets.length})` },
                      { id: 1, label: 'R1 Discovery' },
                      { id: 2, label: 'R2 Peer Challenges' },
                      { id: 3, label: 'R3 Equilibrium' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setBusRoundFilter(f.id)}
                        className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors cursor-pointer ${
                          busRoundFilter === f.id
                            ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-semibold'
                            : 'bg-[#111722] border-[#1b2434] text-slate-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                    <button
                      onClick={handleStartReplay}
                      className="px-3 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold flex items-center gap-1.5 ml-1 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isReplaying ? 'Stop Replay' : 'Replay Debate'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {visiblePackets.map((pkt) => {
                    const isHighlighted = activeReplayPacket?.id === pkt.id;
                    const intentMeta = INTENT_LABELS[pkt.intent] || {
                      label: pkt.intent,
                      cls: 'bg-slate-800 text-slate-300 border-slate-700',
                    };
                    return (
                      <div
                        key={pkt.id}
                        className={`p-3 rounded-lg border transition-colors text-xs space-y-1.5 ${
                          isHighlighted
                            ? 'bg-sky-500/10 border-sky-400'
                            : 'bg-[#111722] border-[#1b2434]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                            <span className="text-slate-500">
                              Round {pkt.round} • +{pkt.timestamp_ms}ms
                            </span>
                            <b className="text-sky-300">{pkt.sender_name}</b>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                            <b className="text-emerald-300">{pkt.recipient_name}</b>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${intentMeta.cls}`}
                          >
                            {intentMeta.label}
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed text-xs">{pkt.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </main>

        {/* RIGHT PANEL: Persistent Customer Memory & FAISS Grounding */}
        <aside className="w-full lg:w-80 bg-[#0b0f17] border-t lg:border-t-0 lg:border-l border-[#1b2434] p-4 flex flex-col justify-between shrink-0 overflow-y-auto gap-5">
          <div className="space-y-4">
            <div className="space-y-1.5 border-b border-[#1b2434] pb-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Brain className="w-4 h-4" />
                  <span>Customer Memory Profile</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  PERSISTENT
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically learns your risk appetite, preferred horizon, and watchlist tickers
                across every audit session.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-[#111722] p-3 rounded border border-[#1b2434] space-y-1">
                <div className="text-[11px] text-slate-400">Learned Trading Style</div>
                <div className="text-emerald-300 font-bold">
                  {memoryProfile?.trading_style || 'Swing Breakout & Quality Delivery'}
                </div>
              </div>

              <div className="bg-[#111722] p-3 rounded border border-[#1b2434] space-y-1">
                <div className="text-[11px] text-slate-400">Risk Profile</div>
                <div className="text-white font-bold">
                  {memoryProfile?.risk_profile || 'Moderate / Balanced Growth'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#111722] p-3 rounded border border-[#1b2434] space-y-1">
                  <div className="text-[11px] text-slate-400">Max Loss Limit</div>
                  <div className="text-rose-400 font-bold font-mono text-sm">
                    {memoryProfile?.max_portfolio_loss_pct ?? 15}%
                  </div>
                </div>
                <div className="bg-[#111722] p-3 rounded border border-[#1b2434] space-y-1">
                  <div className="text-[11px] text-slate-400">Interactions</div>
                  <div className="text-sky-300 font-bold font-mono text-sm">
                    {memoryProfile?.total_interactions ?? 0}
                  </div>
                </div>
              </div>

              <div className="bg-[#111722] p-3 rounded border border-[#1b2434] space-y-1">
                <div className="text-[11px] text-slate-400">Tracked Watchlist Tickers</div>
                <div className="text-sky-300 font-mono font-semibold break-words">
                  {favoriteTickersFormatted}
                </div>
              </div>
            </div>

            {/* FAISS RAG Evidence Snippets */}
            {auditResult?.perception_rag?.rag_evidence_chunks?.length > 0 && (
              <div className="border-t border-[#1b2434] pt-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    FAISS Transcript Grounding ({auditResult.perception_rag.rag_hits_count})
                  </span>
                </div>
                <div className="space-y-2">
                  {auditResult.perception_rag.rag_evidence_chunks.slice(0, 2).map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-[#111722] p-3 rounded border border-[#1b2434] text-xs space-y-1"
                    >
                      <div className="flex justify-between text-sky-300 font-semibold gap-2">
                        <span className="truncate">{c.topic}</span>
                        <span className="font-mono shrink-0">
                          {(c.similarity * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-slate-400 line-clamp-3 leading-relaxed text-[11px]">
                        {c.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#1b2434] pt-3">
            <button
              onClick={async () => {
                await fetch('/api/user/memory/reset?user_id=demo-trader', { method: 'POST' });
                await fetchMemory();
                runMultiAgentAudit();
              }}
              className="w-full py-2 rounded bg-[#111722] hover:bg-[#1b2434] border border-[#1b2434] text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Learned Memory</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
