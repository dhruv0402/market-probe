import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle, 
  Terminal, Cpu, Database, Activity, RefreshCw, UploadCloud,
  FileText, PlayCircle, BarChart2, Zap, ArrowRight, UserCheck
} from 'lucide-react';

export default function AIHedgeFundTerminal() {
  const [activeTab, setActiveTab] = useState('council'); // 'council' | 'dropzone' | 'terminal'
  const [ticker, setTicker] = useState('TATAMOTORS');
  const [action, setAction] = useState('BUY');
  const [entryPrice, setEntryPrice] = useState(940);
  const [targetPrice, setTargetPrice] = useState(1050);
  const [stoplossPrice, setStoplossPrice] = useState(890);
  const [creatorName, setCreatorName] = useState('TradeWithTrend');
  
  // Drag and drop inputs
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // States
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [memoryProfile, setMemoryProfile] = useState(null);
  const [universeCount, setUniverseCount] = useState(2458);

  const fileInputRef = useRef(null);

  // Load User Memory Profile on load
  const fetchMemory = async () => {
    try {
      const res = await fetch('/api/user/memory/profile?user_id=demo-trader');
      if (res.ok) {
        const data = await res.json();
        setMemoryProfile(data);
      }
    } catch (e) {
      console.error("Memory fetch error", e);
    }
  };

  useEffect(() => {
    fetchMemory();
    runMultiAgentAudit();
  }, []);

  // Run Council Audit
  const runMultiAgentAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/multiagent/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          action,
          entry_price: parseFloat(entryPrice) || 0,
          target_price: parseFloat(targetPrice) || 0,
          stoploss_price: parseFloat(stoplossPrice) || 0,
          creator_name: creatorName,
          user_id: 'demo-trader'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAuditResult(data);
      }
    } catch (e) {
      console.error('Audit failed', e);
    } finally {
      setIsAuditing(false);
    }
  };

  // Run Drag and Drop Ingestion Audit
  const handleDropzoneSubmit = async (e) => {
    e?.preventDefault();
    setIsAuditing(true);
    try {
      const formData = new FormData();
      if (selectedFile) formData.append('file', selectedFile);
      if (youtubeUrl) formData.append('youtube_url', youtubeUrl);
      if (rawText) formData.append('raw_text', rawText);
      formData.append('creator_name', creatorName || 'Multimodal Dropzone');
      formData.append('user_id', 'demo-trader');

      const res = await fetch('/api/audit/drop', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAuditResult(data);
        if (data.ticker) setTicker(data.ticker);
        if (data.entry) setEntryPrice(data.entry);
        if (data.target) setTargetPrice(data.target);
        if (data.stoploss) setStoplossPrice(data.stoploss);
        setUniverseCount(prev => prev + 1);
        setActiveTab('council');
      }
    } catch (err) {
      console.error('Dropzone submission failed', err);
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

  return (
    <div className="flex flex-col h-full bg-[#070a10] text-[#c9d1d9] font-sans antialiased overflow-hidden">
      {/* Top Institutional Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1117] border-b border-[#21262d]">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">MARKETPROBE</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono border border-blue-700/50">MULTI-AGENT QUANT COUNCIL</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">5 Specialized Engines • 1,000-Path Monte Carlo • Empirical Bayes • Wilson CI</div>
          </div>
        </div>

        {/* Global Metric Badges */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-800/40">
            <Database className="w-3.5 h-3.5" />
            <span>Audited Universe: <b className="text-white">{universeCount} Calls</b></span>
          </div>
          <div className="flex items-center space-x-1.5 text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-800/40">
            <Activity className="w-3.5 h-3.5" />
            <span>Engine: <b className="text-white">Redis + In-Process</b></span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-b border-[#21262d] text-xs">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('council')}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
              activeTab === 'council' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            🏛️ CIO Deliberation Council
          </button>
          <button
            onClick={() => setActiveTab('dropzone')}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors flex items-center space-x-1 ${
              activeTab === 'dropzone' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1" />
            <span>📥 Drag & Drop Multimodal Ingestion</span>
          </button>
        </div>

        {/* Dynamic Quick Tickers */}
        <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400">
          <span>Quick Select:</span>
          {['TATAMOTORS', 'RELIANCE', 'INFY', 'HDFCBANK', 'BHARTIARTL'].map((sym) => (
            <button
              key={sym}
              onClick={() => { setTicker(sym); runMultiAgentAudit(); }}
              className="px-1.5 py-0.5 rounded bg-[#21262d] hover:bg-slate-700 text-slate-300"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Controls & Input Parameters */}
        <div className="w-80 bg-[#0d1117] border-r border-[#21262d] p-3 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Setup Audit Parameters
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono">NSE Ticker</label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1.5 text-xs text-white font-mono outline-none"
                >
                  <option value="BUY">BUY (LONG)</option>
                  <option value="SELL">SELL (SHORT)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono">Creator / Desk</label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="e.g. ICICI Direct"
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1.5 text-xs text-white font-mono outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[9px] text-slate-400 uppercase font-mono">Entry (₹)</label>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-1.5 py-1.5 text-xs text-white font-mono outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase font-mono">Target (₹)</label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-1.5 py-1.5 text-xs text-emerald-400 font-mono outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase font-mono">Stop-Loss (₹)</label>
                <input
                  type="number"
                  value={stoplossPrice}
                  onChange={(e) => setStoplossPrice(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-1.5 py-1.5 text-xs text-rose-400 font-mono outline-none"
                />
              </div>
            </div>

            <button
              onClick={runMultiAgentAudit}
              disabled={isAuditing}
              className="w-full mt-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded font-mono text-xs font-semibold flex items-center justify-center space-x-1.5 shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Council Deliberating...' : 'Trigger Multi-Agent Audit'}</span>
            </button>

            {/* Customer Memory Behavioral Profile Widget */}
            <div className="mt-4 p-2.5 rounded bg-[#161b22] border border-[#30363d] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                <span className="flex items-center space-x-1 text-purple-400">
                  <UserCheck className="w-3.5 h-3.5" />
                  <b>Customer Memory Profile</b>
                </span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">Active</span>
              </div>
              <div className="text-[10px] space-y-1 font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Learned Style:</span>
                  <span className="text-white font-semibold">{memoryProfile?.risk_profile || 'AGGRESSIVE'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Stress Loss:</span>
                  <span className="text-rose-400 font-semibold">{memoryProfile?.max_portfolio_loss_pct || 25}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Favorite Tickers:</span>
                  <span className="text-cyan-300 truncate max-w-[120px]">{memoryProfile?.favorite_tickers || 'TATAMOTORS, RELIANCE'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono border-t border-[#21262d] pt-2">
            Statutory SEBI Disclaimer: Mathematical simulation for forensic verification purposes only. Not registered investment advice.
          </div>
        </div>

        {/* Center / Right Content Area */}
        <div className="flex-1 flex flex-col bg-[#070a10] overflow-y-auto p-4">
          {activeTab === 'dropzone' ? (
            /* Drag and Drop Multimodal Ingestion View */
            <div className="max-w-3xl mx-auto w-full space-y-4">
              <div className="border border-indigo-500/30 rounded-lg p-4 bg-indigo-950/10">
                <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-2">
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                  <span>Multimodal Forensic Ingestion Gateway</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bypass fragile background crawlers. Directly drop analyst research reports (PDF), YouTube links, or audio clips. 
                  MarketProbe will extract the trade geometry, commit it to the empirical ledger, and run the 5-Agent Council.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragActive ? 'border-indigo-500 bg-indigo-950/20' : 'border-[#30363d] hover:border-slate-500 bg-[#0d1117]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.mp3,.mp4"
                  className="hidden"
                  onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                />
                <FileText className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-mono text-slate-200 font-semibold">
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Drop PDF Research Report or Media File Here'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 font-mono">Supports Motilal Oswal / ICICI Direct PDFs, text files, or audio</span>
              </div>

              {/* YouTube Link Drop Input */}
              <div className="bg-[#0d1117] p-3 rounded-lg border border-[#21262d] space-y-2">
                <label className="text-[11px] font-mono text-slate-300 flex items-center space-x-1.5">
                  <PlayCircle className="w-4 h-4 text-red-400" />
                  <span>Or Drop Financial YouTube Video URL:</span>
                </label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-3 py-2 text-xs text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              {/* Raw Text Tip Drop */}
              <div className="bg-[#0d1117] p-3 rounded-lg border border-[#21262d] space-y-2">
                <label className="text-[11px] font-mono text-slate-300">Or Paste Raw WhatsApp / Telegram Recommendation:</label>
                <textarea
                  rows={3}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g. Buy TATAMOTORS around 940 rupees with strict stoploss at 910 and ambitious target of 1020..."
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-3 py-2 text-xs text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleDropzoneSubmit}
                disabled={isAuditing || (!selectedFile && !youtubeUrl && !rawText)}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <span>{isAuditing ? 'Ingesting & Auditing...' : '🚀 Ingest and Audit via Council'}</span>
              </button>
            </div>
          ) : (
            /* Multi-Agent Council Deliberation View */
            <div className="space-y-4">
              {/* Executive CIO Consensus Banner */}
              {auditResult && (
                <div className={`p-4 rounded-lg border ${
                  auditResult.council_verdict === 'HIGH_CONVICTION_EXECUTE' ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200' :
                  auditResult.council_verdict === 'INSTITUTIONAL_VETO' ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' :
                  'bg-amber-950/20 border-amber-500/40 text-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {auditResult.council_verdict === 'HIGH_CONVICTION_EXECUTE' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-rose-400" />}
                      <span className="text-sm font-bold font-mono uppercase tracking-wide">
                        CIO Verdict: {auditResult.council_verdict}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40 border border-current">
                      Conviction Score: {auditResult.composite_conviction_score} / 100
                    </div>
                  </div>
                  <p className="text-xs font-mono mt-2 text-slate-300">
                    {auditResult.executive_summary}
                  </p>
                </div>
              )}

              {/* 4 Agent Grid Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Agent 1: Quant Math */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono border-b border-[#21262d] pb-1.5">
                    <span className="font-bold text-blue-400 flex items-center space-x-1">
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Quantitative Math Agent</span>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      auditResult?.quant_math?.vote === 'BULLISH' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
                    }`}>
                      {auditResult?.quant_math?.vote || 'SIMULATING'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    {auditResult?.quant_math?.verdict_rationale}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono text-slate-400">
                    <div className="bg-[#161b22] p-1.5 rounded">
                      <div>Target Prob:</div>
                      <b className="text-emerald-400">{((auditResult?.quant_math?.monte_carlo?.p_target_first || 0) * 100).toFixed(1)}%</b>
                    </div>
                    <div className="bg-[#161b22] p-1.5 rounded">
                      <div>SL Hit Prob:</div>
                      <b className="text-rose-400">{((auditResult?.quant_math?.monte_carlo?.p_stoploss_first || 0) * 100).toFixed(1)}%</b>
                    </div>
                    <div className="bg-[#161b22] p-1.5 rounded">
                      <div>Expected Value:</div>
                      <b className="text-cyan-400">{auditResult?.quant_math?.monte_carlo?.expected_return_pct}%</b>
                    </div>
                  </div>
                </div>

                {/* Agent 2: Forensic Track Record */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono border-b border-[#21262d] pb-1.5">
                    <span className="font-bold text-amber-400 flex items-center space-x-1">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Forensic Track-Record Agent</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-700">
                      {auditResult?.forensic_audit?.vote || 'LOOKUP'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    {auditResult?.forensic_audit?.verdict_rationale}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono text-slate-400">
                    <div className="bg-[#161b22] p-1.5 rounded">
                      <div>Bayes Hit Rate:</div>
                      <b className="text-amber-400">{auditResult?.forensic_audit?.bayes_shrinkage_rate}%</b>
                    </div>
                    <div className="bg-[#161b22] p-1.5 rounded">
                      <div>Wilson 95% CI:</div>
                      <b className="text-white">[{auditResult?.forensic_audit?.wilson_95_ci?.lower}% - {auditResult?.forensic_audit?.wilson_95_ci?.upper}%]</b>
                    </div>
                    <div className="bg-[#161b22] p-1.5 rounded">
                      <div>Audited Calls:</div>
                      <b className="text-cyan-400">{auditResult?.forensic_audit?.sample_size}</b>
                    </div>
                  </div>
                </div>

                {/* Agent 3: Risk & Customer Memory */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono border-b border-[#21262d] pb-1.5">
                    <span className="font-bold text-purple-400 flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Risk & Customer Memory</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-950 text-purple-300 border border-purple-700">
                      {auditResult?.risk_memory?.vote || 'DEFENDING'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    {auditResult?.risk_memory?.verdict_rationale}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono text-slate-400">
                    <div className="bg-[#161b22] p-1.5 rounded">
                      <div>Stress Downside:</div>
                      <b className="text-rose-400">{auditResult?.risk_memory?.stress_tested_loss_pct}%</b>
                    </div>
                    <div className="bg-[#161b22] p-1.5 rounded">
                      <div>Max Allowed:</div>
                      <b className="text-white">{auditResult?.risk_memory?.user_max_loss_limit_pct}%</b>
                    </div>
                    <div className="bg-[#161b22] p-1.5 rounded">
                      <div>Safe Allocation:</div>
                      <b className="text-emerald-400">{auditResult?.risk_memory?.optimal_allocation_pct}%</b>
                    </div>
                  </div>
                </div>

                {/* Agent 4: SEBI Compliance */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono border-b border-[#21262d] pb-1.5">
                    <span className="font-bold text-emerald-400 flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Regulatory Guardrails</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      {auditResult?.sebi_guard?.vote || 'COMPLIANT'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    {auditResult?.sebi_guard?.verdict_rationale}
                  </div>
                  <div className="bg-[#161b22] p-2 rounded text-[10px] font-mono text-slate-400">
                    Statutory Status: <b>SEBI Standard Disclaimers Validated</b> • Circuit Filter: <b>Normal & Liquid</b>
                  </div>
                </div>
              </div>

              {/* Council Deliberation Trace Log */}
              <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Executive Council Dialogue Trace</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  {auditResult?.dialogue_trace?.map((trace, idx) => (
                    <div key={idx} className="flex items-start space-x-2 bg-[#161b22] p-2 rounded border border-[#21262d]">
                      <span className="text-indigo-400 font-bold shrink-0">[{trace.agent}]:</span>
                      <span className="text-slate-200">{trace.statement}</span>
                      <span className="ml-auto text-[10px] font-bold text-slate-500 shrink-0">Score: {trace.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
