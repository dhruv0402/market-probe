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
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const INTENT_STYLES = {
  SIGNAL_BROADCAST: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  PEER_CHALLENGE: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  PARAMETER_RECALIBRATION: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  COUNTERFACTUAL_PROPOSAL: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  RISK_CONSTRAINT_INJECTION: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  EQUILIBRIUM_SYNTHESIS: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
};

const VOTE_STYLES = {
  BULLISH: 'chip-bullish',
  APPROVED: 'chip-bullish',
  COMPLIANT: 'chip-bullish',
  HIGH_CONVICTION_EXECUTE: 'chip-bullish',
  COUNCIL_RESTRUCTURED_BUY: 'chip-bullish',
  CREDIBLE: 'chip-bullish',
  BEARISH_VETO: 'chip-bearish',
  RISK_VETO: 'chip-bearish',
  INSTITUTIONAL_VETO: 'chip-bearish',
  SEBI_WARNING: 'chip-bearish',
  UNRELIABLE_FLAG: 'chip-bearish',
  AVERAGE: 'chip-amber',
  NEUTRAL: 'chip-amber',
  DIVERGENT_SIGNAL: 'chip-amber',
  UNVERIFIED_DESK: 'chip-amber',
  MODERATE_SPECULATIVE: 'chip-amber',
  DEFENSIVE_HOLD: 'chip-amber',
};

export default function AIHedgeFundTerminal() {
  const [activeNav, setActiveNav] = useState('council'); // 'council' | 'dropzone'
  const [ticker, setTicker] = useState('RELIANCE');
  const [action, setAction] = useState('BUY');
  const [entryPrice, setEntryPrice] = useState(2980);
  const [targetPrice, setTargetPrice] = useState(3240);
  const [stoplossPrice, setStoplossPrice] = useState(2890);
  const [creatorName, setCreatorName] = useState('Motilal Oswal');
  const [horizonDays, setHorizonDays] = useState(30);
  const [userDirective, setUserDirective] = useState('');

  // Multimodal dropzone inputs
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Runtime states
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditResult, setAuditResult] = useState(null);
  const [memoryProfile, setMemoryProfile] = useState(null);
  const [universeCount, setUniverseCount] = useState(2458);

  // Inter-agent bus filter & live replay state
  const [busRoundFilter, setBusRoundFilter] = useState('ALL'); // 'ALL' | 1 | 2 | 3
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

  useEffect(() => {
    fetchMemory();
    runMultiAgentAudit();
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, []);

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

    const payload = {
      ticker: overrides.ticker ?? ticker,
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
        overrides.user_directive !== undefined
          ? overrides.user_directive
          : '',
    };

    try {
      const res = await fetch('/api/multiagent/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Council endpoint returned HTTP ${res.status}`);
      }
      const data = await res.json();
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

  const handleDirectiveSubmit = (e) => {
    e?.preventDefault();
    if (!userDirective.trim() || isAuditing) return;
    const text = userDirective.trim();
    setUserDirective('');
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
    }, 300);
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
      if (data.ticker) setTicker(data.ticker);
      if (data.entry) setEntryPrice(data.entry);
      if (data.target) setTargetPrice(data.target);
      if (data.stoploss) setStoplossPrice(data.stoploss);
      setUniverseCount((prev) => prev + 1);
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

  return (
    <div className="bg-[#06090e] text-[#e0e2eb] antialiased font-mono text-[11px] min-h-[calc(100vh-116px)] lg:h-[calc(100vh-116px)] flex flex-col overflow-hidden">
      {/* 1. SUB-WORKSTATION TELEMETRY BAR */}
      <header className="bg-[#0b0f17] border-b border-[#1b2434] flex flex-wrap justify-between items-center w-full px-4 py-2 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#10b981]" />
            <span className="font-bold tracking-tight text-[#f0f6fc] text-xs uppercase">
              5-Agent Communicating Quant Council
            </span>
            <span className="bg-[#111722] text-[#38bdf8] border border-[#1b2434] px-2 py-0.5 text-[10px] rounded">
              3-ROUND BUS
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-4 text-[10px] text-[#8b949e] pl-3 border-l border-[#1b2434]">
            <span className="flex items-center gap-1.5 text-[#10b981]">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>
                {auditResult?.message_bus?.redis_synced
                  ? 'REDIS PUB/SUB LIVE'
                  : 'IN-MEMORY BUS'}
              </span>
            </span>
            <span>
              Packets:{' '}
              <b className="text-[#f0f6fc] tabular-nums">
                {auditResult?.message_bus?.total_packets_exchanged ?? 0}
              </b>
            </span>
            <span>
              Convergence:{' '}
              <b className="text-[#38bdf8] tabular-nums">
                {auditResult?.message_bus?.consensus_convergence_pct ?? 0}%
              </b>
            </span>
            <span>
              Dispersion:{' '}
              <b className="text-[#f59e0b] tabular-nums">
                {auditResult?.message_bus?.round_1_dispersion ?? 0} →{' '}
                {auditResult?.message_bus?.round_3_dispersion ?? 0}
              </b>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-[10px]">
          <div className="flex items-center gap-1.5 bg-[#111722] border border-[#1b2434] px-2.5 py-1 rounded text-[#38bdf8]">
            <Database className="w-3 h-3" />
            <span>Calls Ledger:</span>
            <b className="text-[#f0f6fc] tabular-nums">{universeCount}</b>
          </div>
          <button
            onClick={() => runMultiAgentAudit()}
            disabled={isAuditing}
            className="btn-quant-primary flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'DELIBERATING...' : 'RUN 3-ROUND AUDIT'}</span>
          </button>
        </div>
      </header>

      {/* 2. THREE-COLUMN COCKPIT WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: Navigation & Setup Parameters */}
        <aside className="w-full lg:w-72 bg-[#0b0f17] border-b lg:border-b-0 lg:border-r border-[#1b2434] p-3.5 flex flex-col justify-between shrink-0 overflow-y-auto gap-4">
          <div className="space-y-4">
            {/* Workspace Switcher */}
            <div className="space-y-1.5">
              <div className="text-[9px] uppercase tracking-wider text-[#8b949e] font-bold">
                Workspace Mode
              </div>
              <button
                onClick={() => setActiveNav('council')}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left text-[11px] border transition-colors ${
                  activeNav === 'council'
                    ? 'bg-[#111722] text-[#10b981] border-[#10b981]/40 font-semibold'
                    : 'bg-transparent text-[#8b949e] border-transparent hover:bg-[#111722]/60 hover:text-[#f0f6fc]'
                }`}
              >
                <Scale className="w-3.5 h-3.5 shrink-0" />
                <span>CIO Deliberation Bus</span>
              </button>
              <button
                onClick={() => setActiveNav('dropzone')}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left text-[11px] border transition-colors ${
                  activeNav === 'dropzone'
                    ? 'bg-[#111722] text-[#38bdf8] border-[#38bdf8]/40 font-semibold'
                    : 'bg-transparent text-[#8b949e] border-transparent hover:bg-[#111722]/60 hover:text-[#f0f6fc]'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                <span>Multimodal Dropzone</span>
              </button>
            </div>

            {/* Trade Parameters Form */}
            <div className="border-t border-[#1b2434] pt-3 space-y-2.5">
              <div className="text-[9px] uppercase tracking-wider text-[#8b949e] font-bold">
                Setup Audit Parameters
              </div>

              <div>
                <label className="block text-[9px] text-[#8b949e] uppercase mb-1">
                  NSE Ticker
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  className="quant-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-[#8b949e] uppercase mb-1">
                    Action
                  </label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="quant-input w-full"
                  >
                    <option value="BUY">BUY (LONG)</option>
                    <option value="SELL">SELL (SHORT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-[#8b949e] uppercase mb-1">
                    Horizon (Days)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="365"
                    value={horizonDays}
                    onChange={(e) => setHorizonDays(e.target.value)}
                    className="quant-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-[#8b949e] uppercase mb-1">
                  Creator / Brokerage Desk
                </label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="quant-input w-full"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[8px] text-[#8b949e] uppercase mb-1">
                    Entry (₹)
                  </label>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="quant-input w-full text-center"
                  />
                </div>
                <div>
                  <label className="block text-[8px] text-[#8b949e] uppercase mb-1">
                    Target (₹)
                  </label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="quant-input w-full text-center text-[#10b981]"
                  />
                </div>
                <div>
                  <label className="block text-[8px] text-[#8b949e] uppercase mb-1">
                    Stop (₹)
                  </label>
                  <input
                    type="number"
                    value={stoplossPrice}
                    onChange={(e) => setStoplossPrice(e.target.value)}
                    className="quant-input w-full text-center text-[#f43f5e]"
                  />
                </div>
              </div>

              {/* Preset Tickers */}
              <div className="pt-1">
                <div className="text-[8px] text-[#8b949e] uppercase mb-1.5">
                  Quick Audit Presets
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { sym: 'RELIANCE', e: 2980, t: 3240, s: 2890 },
                    { sym: 'TATAMOTORS', e: 940, t: 1050, s: 890 },
                    { sym: 'INFY', e: 1840, t: 2020, s: 1750 },
                    { sym: 'HDFCBANK', e: 1750, t: 1940, s: 1660 },
                    { sym: 'LT', e: 3650, t: 4020, s: 3480 },
                  ].map((item) => (
                    <button
                      key={item.sym}
                      onClick={() => {
                        setTicker(item.sym);
                        setEntryPrice(item.e);
                        setTargetPrice(item.t);
                        setStoplossPrice(item.s);
                        runMultiAgentAudit({
                          ticker: item.sym,
                          entry_price: item.e,
                          target_price: item.t,
                          stoploss_price: item.s,
                        });
                      }}
                      className={`btn-quant-tool ${
                        ticker === item.sym
                          ? 'border-[#38bdf8] text-[#38bdf8]'
                          : ''
                      }`}
                    >
                      {item.sym}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1b2434] pt-2.5 text-[9px] text-[#545d68] space-y-0.5">
            <div>PROTOCOL: 5-AGENT BIDIRECTIONAL BUS</div>
            <div>ENGINE: MERTON GBM + EMPIRICAL BAYES + CVaR</div>
          </div>
        </aside>

        {/* CENTER COLUMN: Main Multi-Agent Deliberation Stage */}
        <main className="flex-1 bg-[#06090e] overflow-y-auto p-4 space-y-4">
          {activeNav === 'dropzone' ? (
            /* MULTIMODAL DRAG-AND-DROP INGESTION VIEW */
            <div className="max-w-3xl mx-auto w-full space-y-4">
              <div className="bg-[#0b0f17] border border-[#1b2434] rounded p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-[#38bdf8]" />
                      <span>Multimodal Forensic Ingestion Gateway</span>
                    </h2>
                    <p className="text-[11px] text-[#8b949e] mt-1 leading-relaxed">
                      Directly drop brokerage research PDFs, paste YouTube URLs, or enter raw
                      WhatsApp/Telegram tips. Perception Agent parses barriers, commits the call to SQLite,
                      and triggers full 5-agent cross-examination.
                    </p>
                  </div>
                  <span className="chip-bullish shrink-0">AUTO-INDEXING</span>
                </div>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-[#38bdf8] bg-[#38bdf8]/10'
                    : 'border-[#1b2434] hover:border-[#38bdf8]/50 bg-[#0b0f17]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.mp3,.mp4"
                  className="hidden"
                  onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                />
                <FileText className="w-8 h-8 text-[#38bdf8] mb-2" />
                <span className="text-xs font-bold text-[#f0f6fc]">
                  {selectedFile
                    ? `Selected File: ${selectedFile.name}`
                    : 'Drop PDF Research Report or Media File Here'}
                </span>
                <span className="text-[10px] text-[#8b949e] mt-1">
                  Supports institutional brokerage PDFs, text transcripts, or audio notes
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#0b0f17] border border-[#1b2434] p-3 rounded space-y-1.5">
                  <label className="text-[9px] text-[#8b949e] uppercase font-bold flex items-center gap-1.5">
                    <PlayCircle className="w-3.5 h-3.5 text-[#f43f5e]" />
                    <span>YouTube Video URL</span>
                  </label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="quant-input w-full"
                  />
                </div>

                <div className="bg-[#0b0f17] border border-[#1b2434] p-3 rounded space-y-1.5">
                  <label className="text-[9px] text-[#8b949e] uppercase font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Raw Telegram / Broker Call Text</span>
                  </label>
                  <input
                    type="text"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Buy RELIANCE around 2980 target 3240 SL 2890..."
                    className="quant-input w-full"
                  />
                </div>
              </div>

              <button
                onClick={handleDropzoneSubmit}
                disabled={isAuditing || (!selectedFile && !youtubeUrl && !rawText)}
                className="btn-quant-primary w-full py-2.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {isAuditing
                    ? 'INGESTING & DELIBERATING...'
                    : 'COMMIT SOURCE & RUN 5-AGENT AUDIT'}
                </span>
              </button>
            </div>
          ) : (
            /* 5-AGENT COMMUNICATING DELIBERATION WORKSPACE */
            <>
              {/* Direct Council Interrogation Directive Bar */}
              <form
                onSubmit={handleDirectiveSubmit}
                className="bg-[#0b0f17] border border-[#1b2434] rounded p-2.5 flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5 text-[#38bdf8] shrink-0 ml-1" />
                <input
                  type="text"
                  value={userDirective}
                  onChange={(e) => setUserDirective(e.target.value)}
                  placeholder="Send live directive to Council (e.g. 'What if horizon is 60 days?' or 'Switch to conservative capital preservation max 5% loss')..."
                  className="bg-transparent border-0 outline-none text-[#f0f6fc] text-[11px] flex-1 placeholder:text-[#545d68]"
                />
                <button
                  type="submit"
                  disabled={isAuditing || !userDirective.trim()}
                  className="btn-quant-tool text-[#38bdf8] border-[#38bdf8]/40 flex items-center gap-1.5 py-1 px-2.5 disabled:opacity-40"
                >
                  <Send className="w-3 h-3" />
                  <span>Challenge Council</span>
                </button>
              </form>

              {auditError && (
                <div className="bg-[#f43f5e]/10 border border-[#f43f5e]/40 text-[#fb7185] px-3 py-2 rounded text-[11px]">
                  Error: {auditError}
                </div>
              )}

              {/* Grand CIO Consensus Banner */}
              {auditResult && (
                <div
                  className={`p-3.5 rounded border ${
                    auditResult.council_verdict === 'HIGH_CONVICTION_EXECUTE'
                      ? 'bg-[#10b981]/10 border-[#10b981]/40'
                      : auditResult.council_verdict === 'INSTITUTIONAL_VETO'
                      ? 'bg-[#f43f5e]/10 border-[#f43f5e]/40'
                      : 'bg-[#f59e0b]/10 border-[#f59e0b]/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {auditResult.council_verdict === 'HIGH_CONVICTION_EXECUTE' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-[#f43f5e]" />
                      )}
                      <span className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc]">
                        CIO GOVERNOR DECREE: {auditResult.council_verdict}
                      </span>
                      <span className="text-[10px] text-[#8b949e]">
                        ({auditResult.ticker} • {auditResult.action} • {auditResult.horizon_days || horizonDays}D)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-[#06090e] border border-[#1b2434] text-[#f0f6fc] text-[10px] font-bold tabular-nums">
                        CONVICTION: {auditResult.composite_conviction_score} / 100
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#cbd5e1] mt-2 leading-relaxed">
                    {auditResult.executive_summary}
                  </p>
                </div>
              )}

              {/* 5-AGENT ROSTER & ROUND 1 -> ROUND 3 TRAJECTORY BAR */}
              {auditResult?.agents_roster && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-[#8b949e] font-bold">
                    <span>5-Agent Council Roster & Round 1 → Round 3 Conviction Convergence</span>
                    <span>Peer-to-Peer Recalibration Active</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
                    {auditResult.agents_roster.map((ag) => {
                      const isActiveSender = activeReplayPacket?.sender === ag.agent_id;
                      const isActiveRecipient =
                        activeReplayPacket?.recipient === ag.agent_id ||
                        activeReplayPacket?.recipient === 'BROADCAST_ALL';
                      const deltaPositive = ag.conviction_delta > 0;
                      const deltaNegative = ag.conviction_delta < 0;

                      return (
                        <div
                          key={ag.agent_id}
                          className={`bg-[#0b0f17] rounded p-2.5 border transition-all space-y-1.5 ${
                            isActiveSender
                              ? 'border-[#38bdf8] ring-1 ring-[#38bdf8]/40'
                              : isActiveRecipient
                              ? 'border-[#10b981]/60'
                              : 'border-[#1b2434]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-[#f0f6fc] truncate">
                              {ag.name}
                            </span>
                            <span className={VOTE_STYLES[ag.vote] || 'chip-amber'}>
                              {ag.vote}
                            </span>
                          </div>
                          <div className="text-[9px] text-[#8b949e] truncate">{ag.role}</div>
                          <div className="flex items-center justify-between bg-[#111722] px-2 py-1 rounded border border-[#141b27] text-[10px] tabular-nums">
                            <span className="text-[#8b949e]">
                              R1 <b className="text-[#f0f6fc]">{ag.round_1_score}</b> → R3{' '}
                              <b className="text-[#38bdf8]">{ag.round_3_score}</b>
                            </span>
                            <span
                              className={`font-bold ${
                                deltaPositive
                                  ? 'text-[#10b981]'
                                  : deltaNegative
                                  ? 'text-[#f43f5e]'
                                  : 'text-[#8b949e]'
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

              {/* COUNTERFACTUAL TRADE RESTRUCTURING CARD */}
              {cfData && (
                <div className="bg-[#0b0f17] border border-[#1b2434] rounded p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2434] pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#f0f6fc]">
                        Counterfactual Trade Restructuring (Quant + Risk Negotiation)
                      </span>
                    </div>
                    <button
                      onClick={handleApplyCounterfactual}
                      className="btn-quant-primary flex items-center gap-1.5"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Apply Council Restructured Setup</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                    {/* Original Setup */}
                    <div className="bg-[#111722] border border-[#1b2434] rounded p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b949e] font-bold uppercase">
                          Original Submitted Call
                        </span>
                        <span className={VOTE_STYLES[auditResult?.council_verdict] || 'chip-bearish'}>
                          Score: {auditResult?.composite_conviction_score}/100
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 tabular-nums pt-1">
                        <div>
                          <div className="text-[9px] text-[#8b949e]">Target / Stop</div>
                          <b className="text-[#f0f6fc]">
                            ₹{cfData.original_metrics.target} / ₹{cfData.original_metrics.stoploss}
                          </b>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#8b949e]">P(Hit Target 1st)</div>
                          <b className="text-[#f43f5e]">
                            {(cfData.original_metrics.p_target_first * 100).toFixed(1)}%
                          </b>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#8b949e]">Post-Tax EV / Alloc</div>
                          <b className="text-[#f59e0b]">
                            {auditResult?.risk_memory?.post_tax_ev_pct}% /{' '}
                            {auditResult?.risk_memory?.optimal_allocation_pct}%
                          </b>
                        </div>
                      </div>
                    </div>

                    {/* Council Restructured Setup */}
                    <div className="bg-[#111722] border border-[#10b981]/35 rounded p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#10b981] font-bold uppercase">
                          Council-Negotiated Equilibrium
                        </span>
                        <span className="chip-bullish">
                          {cfData.restructured_verdict} ({cfData.restructured_conviction_score}/100)
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 tabular-nums pt-1">
                        <div>
                          <div className="text-[9px] text-[#8b949e]">Optimal Target / SL</div>
                          <b className="text-[#10b981]">
                            ₹{cfData.restructured_metrics.target} / ₹
                            {cfData.restructured_metrics.stoploss}
                          </b>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#8b949e]">P(Hit Target 1st)</div>
                          <b className="text-[#38bdf8]">
                            {(cfData.restructured_metrics.p_target_first * 100).toFixed(1)}% (
                            {cfData.improvement_hit_prob_pct >= 0 ? '+' : ''}
                            {cfData.improvement_hit_prob_pct}%)
                          </b>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#8b949e]">Post-Tax EV / Kelly</div>
                          <b className="text-[#10b981]">
                            {cfData.restructured_post_tax_ev_pct}% /{' '}
                            {cfData.restructured_allocation_pct}%
                          </b>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INTERACTIVE MULTI-ROUND INTER-AGENT MESSAGE BUS */}
              <div className="bg-[#0b0f17] border border-[#1b2434] rounded p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2434] pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#f0f6fc]">
                      Live Inter-Agent Communication Bus (3 Rounds)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'ALL', label: `All (${allPackets.length})` },
                      { id: 1, label: 'R1: Discovery' },
                      { id: 2, label: 'R2: Peer Challenges' },
                      { id: 3, label: 'R3: Equilibrium' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setBusRoundFilter(f.id)}
                        className={`btn-quant-tool ${
                          busRoundFilter === f.id
                            ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10'
                            : ''
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                    <button
                      onClick={handleStartReplay}
                      className="btn-quant-tool border-[#10b981]/40 text-[#10b981] flex items-center gap-1 ml-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>{isReplaying ? 'Stop Replay' : 'Replay Debate Live'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {visiblePackets.map((pkt) => {
                    const isHighlighted = activeReplayPacket?.id === pkt.id;
                    return (
                      <div
                        key={pkt.id}
                        className={`p-2 rounded border transition-colors text-[10px] space-y-1 ${
                          isHighlighted
                            ? 'bg-[#38bdf8]/10 border-[#38bdf8]'
                            : 'bg-[#111722] border-[#141b27]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#545d68] tabular-nums">
                              [{pkt.id} • R{pkt.round} • +{pkt.timestamp_ms}ms]
                            </span>
                            <b className="text-[#38bdf8]">{pkt.sender_name}</b>
                            <ArrowRight className="w-3 h-3 text-[#545d68]" />
                            <b className="text-[#10b981]">{pkt.recipient_name}</b>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                              INTENT_STYLES[pkt.intent] ||
                              'bg-[#0b0f17] text-[#8b949e] border-[#1b2434]'
                            }`}
                          >
                            {pkt.intent}
                          </span>
                        </div>
                        <div className="text-[#e0e2eb] leading-relaxed">{pkt.content}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* QUANTITATIVE & EMPIRICAL DETAIL CARDS + MONTE CARLO CONE */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {/* Monte Carlo Trajectory Fan Chart */}
                {auditResult?.quant_math?.monte_carlo?.path_sample_cone && (
                  <div className="bg-[#0b0f17] border border-[#1b2434] rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#f0f6fc] text-[10px] uppercase flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>1,000-Path Merton Jump-Diffusion Cone</span>
                      </span>
                      <div className="flex items-center gap-3 text-[9px] tabular-nums">
                        <span className="text-[#10b981]">Target: ₹{auditResult.target}</span>
                        <span className="text-[#f43f5e]">Stop: ₹{auditResult.stoploss}</span>
                      </div>
                    </div>
                    <div className="h-44 w-full">
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
                          <XAxis dataKey="step" stroke="#545d68" tick={{ fontSize: 9 }} />
                          <YAxis
                            domain={['auto', 'auto']}
                            stroke="#545d68"
                            tick={{ fontSize: 9 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#111722',
                              borderColor: '#1b2434',
                              fontSize: '10px',
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
                              strokeWidth={1}
                              dot={false}
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Deep Agent Telemetry Summary */}
                <div className="bg-[#0b0f17] border border-[#1b2434] rounded p-3 space-y-2.5">
                  <div className="font-bold text-[#f0f6fc] text-[10px] uppercase flex items-center gap-1.5 border-b border-[#1b2434] pb-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span>Empirical Calibration & Tail-Risk Matrix</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] tabular-nums">
                    <div className="bg-[#111722] p-2 rounded border border-[#141b27]">
                      <div className="text-[9px] text-[#8b949e]">Posterior Drift μ</div>
                      <b className="text-[#38bdf8]">
                        {auditResult?.quant_math?.drift_annualized ?? 0}%
                      </b>
                      <div className="text-[8px] text-[#545d68]">
                        Bayes Δ: {auditResult?.quant_math?.bayes_drift_adjustment ?? 0}%
                      </div>
                    </div>
                    <div className="bg-[#111722] p-2 rounded border border-[#141b27]">
                      <div className="text-[9px] text-[#8b949e]">Bayes Hit Rate</div>
                      <b className="text-[#f59e0b]">
                        {auditResult?.forensic_audit?.bayes_shrinkage_rate ?? 0}%
                      </b>
                      <div className="text-[8px] text-[#545d68]">
                        Brier: {auditResult?.forensic_audit?.brier_score ?? '0.25'}
                      </div>
                    </div>
                    <div className="bg-[#111722] p-2 rounded border border-[#141b27]">
                      <div className="text-[9px] text-[#8b949e]">Wilson 95% CI</div>
                      <b className="text-[#f0f6fc]">
                        [{auditResult?.forensic_audit?.wilson_95_ci?.lower ?? 0}% –{' '}
                        {auditResult?.forensic_audit?.wilson_95_ci?.upper ?? 0}%]
                      </b>
                    </div>
                    <div className="bg-[#111722] p-2 rounded border border-[#141b27]">
                      <div className="text-[9px] text-[#8b949e]">Historical CVaR (95%)</div>
                      <b className="text-[#f43f5e]">
                        -{auditResult?.quant_math?.tail_risk?.cvar_95_pct ?? 0}%
                      </b>
                    </div>
                    <div className="bg-[#111722] p-2 rounded border border-[#141b27]">
                      <div className="text-[9px] text-[#8b949e]">Herd BUY Bias</div>
                      <b className="text-[#10b981]">
                        {auditResult?.perception_rag?.herd_bullish_pct ?? 50}%
                      </b>
                    </div>
                    <div className="bg-[#111722] p-2 rounded border border-[#141b27]">
                      <div className="text-[9px] text-[#8b949e]">Sec 111A Post-Tax EV</div>
                      <b className="text-[#38bdf8]">
                        {auditResult?.risk_memory?.post_tax_ev_pct ?? 0}%
                      </b>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* RIGHT COLUMN: Persistent Customer Memory & FAISS RAG Context */}
        <aside className="w-full lg:w-72 bg-[#0b0f17] border-t lg:border-t-0 lg:border-l border-[#1b2434] p-3.5 flex flex-col justify-between shrink-0 overflow-y-auto gap-4">
          <div className="space-y-4">
            {/* Customer Memory Header */}
            <div className="space-y-2 border-b border-[#1b2434] pb-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#38bdf8] flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Persistent Customer Memory</span>
                </span>
                <span className="chip-bullish">ACTIVE</span>
              </div>
              <p className="text-[9px] text-[#8b949e] leading-relaxed">
                Cross-session behavioral memory automatically calibrates Risk & Position Sizing
                agents to your risk ceiling.
              </p>
            </div>

            <div className="space-y-2 text-[10px]">
              <div className="bg-[#111722] p-2.5 rounded border border-[#1b2434] space-y-0.5">
                <div className="text-[8px] text-[#8b949e] uppercase">Learned Trading Style</div>
                <div className="text-[#10b981] font-bold">
                  {memoryProfile?.trading_style || 'Swing Breakout & Quality Delivery'}
                </div>
              </div>

              <div className="bg-[#111722] p-2.5 rounded border border-[#1b2434] space-y-0.5">
                <div className="text-[8px] text-[#8b949e] uppercase">Risk Profile</div>
                <div className="text-[#f0f6fc] font-bold">
                  {memoryProfile?.risk_profile || 'Moderate / Balanced Growth'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#111722] p-2.5 rounded border border-[#1b2434] space-y-0.5">
                  <div className="text-[8px] text-[#8b949e] uppercase">Max Loss Budget</div>
                  <div className="text-[#f43f5e] font-bold tabular-nums">
                    {memoryProfile?.max_portfolio_loss_pct ?? 15}%
                  </div>
                </div>
                <div className="bg-[#111722] p-2.5 rounded border border-[#1b2434] space-y-0.5">
                  <div className="text-[8px] text-[#8b949e] uppercase">Interactions</div>
                  <div className="text-[#38bdf8] font-bold tabular-nums">
                    {memoryProfile?.total_interactions ?? 0}
                  </div>
                </div>
              </div>

              <div className="bg-[#111722] p-2.5 rounded border border-[#1b2434] space-y-0.5">
                <div className="text-[8px] text-[#8b949e] uppercase">Tracked Watchlist</div>
                <div className="text-[#38bdf8] font-bold break-words">
                  {favoriteTickersFormatted}
                </div>
              </div>
            </div>

            {/* FAISS RAG Evidence Snippets */}
            {auditResult?.perception_rag?.rag_evidence_chunks?.length > 0 && (
              <div className="border-t border-[#1b2434] pt-3 space-y-2">
                <div className="text-[9px] uppercase tracking-wider text-[#8b949e] font-bold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>FAISS RAG Grounding ({auditResult.perception_rag.rag_hits_count})</span>
                </div>
                <div className="space-y-1.5">
                  {auditResult.perception_rag.rag_evidence_chunks.slice(0, 2).map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-[#111722] p-2 rounded border border-[#141b27] text-[9px] space-y-1"
                    >
                      <div className="flex justify-between text-[#38bdf8] font-bold">
                        <span className="truncate">{c.topic}</span>
                        <span className="tabular-nums shrink-0 ml-1">
                          {(c.similarity * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-[#8b949e] line-clamp-3 leading-snug">{c.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#1b2434] pt-2.5">
            <button
              onClick={async () => {
                await fetch('/api/user/memory/reset?user_id=demo-trader', { method: 'POST' });
                await fetchMemory();
                runMultiAgentAudit();
              }}
              className="btn-quant-tool w-full py-1.5 flex items-center justify-center gap-1.5 text-[#8b949e] hover:text-[#f43f5e]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET LEARNED MEMORY</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
