import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

export default function AIHedgeFundTerminal() {
  const [activeNav, setActiveNav] = useState('council'); // 'council' | 'dropzone' | 'feed' | 'leaderboard'
  const [ticker, setTicker] = useState('RELIANCE');
  const [action, setAction] = useState('BUY');
  const [entryPrice, setEntryPrice] = useState(2980);
  const [targetPrice, setTargetPrice] = useState(3240);
  const [stoplossPrice, setStoplossPrice] = useState(2890);
  const [creatorName, setCreatorName] = useState('Motilal Oswal');
  
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
        setActiveNav('council');
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
    <div className="bg-[#070a10] text-[#e0e2eb] antialiased select-none font-mono text-[11px] h-screen flex flex-col overflow-hidden">
      
      {/* 1. TOP SHELL: Obsidian Quant TopNavBar */}
      <header className="bg-[#070a10] text-[#10b981] border-b border-[#21262d] flex justify-between items-center w-full px-3 h-8 z-50 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold tracking-tight text-[#f0f6fc] text-xs">MarketProbe Quant Cockpit</span>
            <span className="bg-[#161b22] text-[#10b981] border border-[#21262d] px-1 py-0.2 text-[9px] font-mono rounded">v4.2 PRO</span>
          </div>

          <nav className="hidden xl:flex items-center space-x-3 ml-4">
            <span className="text-[#10b981] border-b border-[#10b981] pb-0.5 text-[10px] flex items-center space-x-1 cursor-pointer">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse inline-block"></span>
              <span>42 Active Models</span>
            </span>
            <span className="text-[#8b949e] hover:text-[#f0f6fc] text-[10px] cursor-pointer">Node: 12ms</span>
            <span className="text-[#8b949e] hover:text-[#f0f6fc] text-[10px] cursor-pointer">NSE Live Colo</span>
            <span className="text-[#8b949e] hover:text-[#f0f6fc] text-[10px] cursor-pointer">Redis L2 Synced</span>
          </nav>
        </div>

        {/* Live Running NSE Ticker Tape */}
        <div className="hidden lg:flex overflow-hidden mx-3 max-w-xl h-5 border-x border-[#21262d]/50 px-3 items-center text-[10px]">
          <div className="flex whitespace-nowrap space-x-4">
            <span className="flex items-center space-x-1"><span className="text-[#f0f6fc] font-semibold">NIFTY 50</span> <span className="text-[#8b949e]">24,842.60</span> <span className="text-[#10b981]">+0.48%</span></span>
            <span className="flex items-center space-x-1"><span className="text-[#f0f6fc] font-semibold">BANKNIFTY</span> <span className="text-[#8b949e]">52,190.15</span> <span className="text-[#10b981]">+0.32%</span></span>
            <span className="flex items-center space-x-1"><span className="text-[#f0f6fc] font-semibold">RELIANCE</span> <span className="text-[#8b949e]">2,984.10</span> <span className="text-[#10b981]">+1.25%</span></span>
            <span className="flex items-center space-x-1"><span className="text-[#f0f6fc] font-semibold">HDFCBANK</span> <span className="text-[#8b949e]">1,642.80</span> <span className="text-[#f43f5e]">-0.18%</span></span>
            <span className="flex items-center space-x-1"><span className="text-[#f0f6fc] font-semibold">INFY</span> <span className="text-[#8b949e]">1,892.40</span> <span className="text-[#10b981]">+2.10%</span></span>
          </div>
        </div>

        {/* Action Controls & Metric */}
        <div className="flex items-center space-x-3 text-[10px]">
          <div className="flex items-center space-x-1 bg-[#161b22] border border-[#21262d] px-2 py-0.5 rounded text-[#38bdf8]">
            <span>Calls Ledger:</span>
            <b className="text-white font-mono">{universeCount}</b>
          </div>
          <button 
            onClick={runMultiAgentAudit} 
            disabled={isAuditing}
            className="bg-[#10b981] hover:bg-[#10b981]/90 text-[#070a10] px-2.5 py-0.5 rounded font-bold font-mono transition-all flex items-center space-x-1"
          >
            <span>{isAuditing ? 'CALCULATING...' : 'AUDIT NOW'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN COCKPIT BODY (Three-Column Layout) */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT COMPACT SIDEBAR: Nav & Setup Parameters */}
        <aside className="w-64 bg-[#0d1117] border-r border-[#21262d] flex flex-col justify-between p-2.5 z-40 shrink-0 overflow-y-auto">
          <div className="space-y-3">
            {/* View Mode Switcher */}
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-[#8b949e] font-bold">Workspace View</span>
              <button
                onClick={() => setActiveNav('council')}
                className={`flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-all ${
                  activeNav === 'council' ? 'bg-[#161b22] text-[#10b981] border border-[#10b981]/30 font-semibold' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                <span>CIO Multi-Agent Council</span>
              </button>
              <button
                onClick={() => setActiveNav('dropzone')}
                className={`flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-all ${
                  activeNav === 'dropzone' ? 'bg-[#161b22] text-[#38bdf8] border border-[#38bdf8]/30 font-semibold' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
                <span>📥 Dropzone Multimodal Ingest</span>
              </button>
            </div>

            {/* Quick Setup Inputs */}
            <div className="border-t border-[#21262d] pt-2 space-y-2">
              <span className="text-[9px] uppercase tracking-wider text-[#8b949e] font-bold">Trade Parameters</span>
              
              <div>
                <label className="text-[9px] text-[#8b949e] uppercase">Ticker</label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  className="w-full bg-[#070a10] border border-[#21262d] rounded px-2 py-1 text-white text-[11px] font-mono focus:border-[#38bdf8] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9px] text-[#8b949e] uppercase">Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full bg-[#070a10] border border-[#21262d] rounded px-1.5 py-1 text-white text-[10px] outline-none"
                  >
                    <option value="BUY">BUY (LONG)</option>
                    <option value="SELL">SELL (SHORT)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-[#8b949e] uppercase">Source Desk</label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    className="w-full bg-[#070a10] border border-[#21262d] rounded px-1.5 py-1 text-white text-[10px] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <div>
                  <label className="text-[8px] text-[#8b949e] uppercase">Entry ₹</label>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full bg-[#070a10] border border-[#21262d] rounded px-1 py-1 text-white text-[10px] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-[#8b949e] uppercase">Target ₹</label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full bg-[#070a10] border border-[#21262d] rounded px-1 py-1 text-[#10b981] text-[10px] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-[#8b949e] uppercase">Stop ₹</label>
                  <input
                    type="number"
                    value={stoplossPrice}
                    onChange={(e) => setStoplossPrice(e.target.value)}
                    className="w-full bg-[#070a10] border border-[#21262d] rounded px-1 py-1 text-[#f43f5e] text-[10px] outline-none"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-1">
                <span className="text-[8px] text-[#8b949e] uppercase">Quick Tickers:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['RELIANCE', 'TATAMOTORS', 'INFY', 'HDFCBANK', 'LT'].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setTicker(s); runMultiAgentAudit(); }}
                      className="px-1.5 py-0.5 rounded bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] text-[9px]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Node health footer */}
          <div className="border-t border-[#21262d] pt-2 text-[9px] text-[#8b949e] space-y-0.5">
            <div>NODE: EXEC-01 (MUMBAI COLO)</div>
            <div>LATENCY: 12ms | REDIS: LIVE</div>
          </div>
        </aside>

        {/* CENTER STAGE: Main Quant Cockpit */}
        <main className="flex-1 flex flex-col bg-[#070a10] overflow-y-auto p-3 space-y-3">
          
          {activeNav === 'dropzone' ? (
            /* MULTIMODAL DRAG-AND-DROP INGESTION COCKPIT */
            <div className="max-w-4xl mx-auto w-full space-y-3">
              <div className="bg-[#0d1117] border border-[#21262d] rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-bold text-white uppercase tracking-wide">
                      📥 Multimodal Ingestion Gateway (Zero-Scraper Architecture)
                    </h2>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">
                      Directly drop research PDFs (Motilal Oswal, ICICI Direct), YouTube video URLs, or WhatsApp callouts.
                      The agent extracts the levels, verifies mathematical EV, and logs the call into the empirical database.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 rounded text-[9px] font-bold">
                    AUTO-INDEXING ACTIVE
                  </span>
                </div>
              </div>

              {/* Drag Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive ? 'border-[#38bdf8] bg-[#38bdf8]/10' : 'border-[#21262d] hover:border-[#8b949e] bg-[#0d1117]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.mp3,.mp4"
                  className="hidden"
                  onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                />
                <span className="material-symbols-outlined text-[#38bdf8] text-3xl mb-1">upload_file</span>
                <span className="text-xs font-bold text-white">
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Drop PDF Research Report or Media File Here'}
                </span>
                <span className="text-[9px] text-[#8b949e] mt-1">
                  Supports institutional brokerage PDFs, raw text, and audio recordings
                </span>
              </div>

              {/* URL and Text Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0d1117] border border-[#21262d] p-2.5 rounded space-y-1">
                  <label className="text-[9px] text-[#8b949e] uppercase font-bold">Paste YouTube Video URL:</label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-[#070a10] border border-[#21262d] rounded px-2 py-1 text-white text-[10px] outline-none focus:border-[#38bdf8]"
                  />
                </div>

                <div className="bg-[#0d1117] border border-[#21262d] p-2.5 rounded space-y-1">
                  <label className="text-[9px] text-[#8b949e] uppercase font-bold">Or Paste Raw WhatsApp/Telegram Tip:</label>
                  <input
                    type="text"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="e.g. Buy RELIANCE at 2980 target 3240 sl 2890..."
                    className="w-full bg-[#070a10] border border-[#21262d] rounded px-2 py-1 text-white text-[10px] outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              <button
                onClick={handleDropzoneSubmit}
                disabled={isAuditing || (!selectedFile && !youtubeUrl && !rawText)}
                className="w-full py-2 bg-[#10b981] hover:bg-[#10b981]/90 disabled:opacity-40 text-[#070a10] font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center space-x-1"
              >
                <span>{isAuditing ? 'INGESTING & RUNNING 5-AGENT COUNCIL...' : '🚀 COMMIT TO DATABASE & AUDIT'}</span>
              </button>
            </div>
          ) : (
            /* CIO MULTI-AGENT COUNCIL DASHBOARD */
            <>
              {/* Grand CIO Verdict Banner */}
              {auditResult && (
                <div className={`p-3 rounded border ${
                  auditResult.council_verdict === 'HIGH_CONVICTION_EXECUTE' ? 'bg-[#10b981]/10 border-[#10b981]/40 text-[#10b981]' :
                  auditResult.council_verdict === 'INSTITUTIONAL_VETO' ? 'bg-[#f43f5e]/10 border-[#f43f5e]/40 text-[#f43f5e]' :
                  'bg-[#f59e0b]/10 border-[#f59e0b]/40 text-[#f59e0b]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-lg">
                        {auditResult.council_verdict === 'HIGH_CONVICTION_EXECUTE' ? 'verified' : 'gavel'}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        CIO COUNCIL CONSENSUS: {auditResult.council_verdict}
                      </span>
                    </div>
                    <div className="px-2 py-0.5 rounded bg-[#070a10] border border-current text-[10px] font-bold">
                      CONVICTION SCORE: {auditResult.composite_conviction_score} / 100
                    </div>
                  </div>
                  <div className="text-[10px] text-[#e0e2eb] mt-1.5 leading-relaxed">
                    {auditResult.executive_summary}
                  </div>
                </div>
              )}

              {/* 4 Agent Deliberation Cards Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* 1. Quant Math Agent */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-1">
                    <span className="font-bold text-[#38bdf8] flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[13px]">calculate</span>
                      <span>QUANTITATIVE MATH AGENT</span>
                    </span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                      auditResult?.quant_math?.vote === 'BULLISH' ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40' : 'bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/40'
                    }`}>
                      {auditResult?.quant_math?.vote || 'SIMULATING'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#c9d1d9] leading-tight">
                    {auditResult?.quant_math?.verdict_rationale}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-0.5 text-[9px]">
                    <div className="bg-[#161b22] p-1 rounded">
                      <div className="text-[#8b949e]">Target Hit Prob:</div>
                      <b className="text-[#10b981]">{((auditResult?.quant_math?.monte_carlo?.p_target_first || 0) * 100).toFixed(1)}%</b>
                    </div>
                    <div className="bg-[#161b22] p-1 rounded">
                      <div className="text-[#8b949e]">SL Hit Prob:</div>
                      <b className="text-[#f43f5e]">{((auditResult?.quant_math?.monte_carlo?.p_stoploss_first || 0) * 100).toFixed(1)}%</b>
                    </div>
                    <div className="bg-[#161b22] p-1 rounded">
                      <div className="text-[#8b949e]">Expected Value:</div>
                      <b className="text-[#38bdf8]">{auditResult?.quant_math?.monte_carlo?.expected_return_pct}%</b>
                    </div>
                  </div>
                </div>

                {/* 2. Forensic Track-Record Agent */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-1">
                    <span className="font-bold text-[#f59e0b] flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[13px]">policy</span>
                      <span>FORENSIC TRACK-RECORD AGENT</span>
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40">
                      {auditResult?.forensic_audit?.vote || 'AUDITING'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#c9d1d9] leading-tight">
                    {auditResult?.forensic_audit?.verdict_rationale}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-0.5 text-[9px]">
                    <div className="bg-[#161b22] p-1 rounded">
                      <div className="text-[#8b949e]">Bayes Win-Rate:</div>
                      <b className="text-[#f59e0b]">{auditResult?.forensic_audit?.bayes_shrinkage_rate}%</b>
                    </div>
                    <div className="bg-[#161b22] p-1 rounded">
                      <div className="text-[#8b949e]">Wilson 95% CI:</div>
                      <b className="text-white">[{auditResult?.forensic_audit?.wilson_95_ci?.lower}% - {auditResult?.forensic_audit?.wilson_95_ci?.upper}%]</b>
                    </div>
                    <div className="bg-[#161b22] p-1 rounded">
                      <div className="text-[#8b949e]">Audited Sample:</div>
                      <b className="text-[#38bdf8]">{auditResult?.forensic_audit?.sample_size} calls</b>
                    </div>
                  </div>
                </div>

                {/* 3. Risk & Customer Memory Agent */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-1">
                    <span className="font-bold text-[#a855f7] flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[13px]">shield</span>
                      <span>RISK & CUSTOMER MEMORY AGENT</span>
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/40">
                      {auditResult?.risk_memory?.vote || 'DEFENDING'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#c9d1d9] leading-tight">
                    {auditResult?.risk_memory?.verdict_rationale}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-0.5 text-[9px]">
                    <div className="bg-[#161b22] p-1 rounded">
                      <div className="text-[#8b949e]">Stress CVaR (95%):</div>
                      <b className="text-[#f43f5e]">{auditResult?.risk_memory?.stress_tested_loss_pct}%</b>
                    </div>
                    <div className="bg-[#161b22] p-1 rounded">
                      <div className="text-[#8b949e]">Max Loss Budget:</div>
                      <b className="text-white">{auditResult?.risk_memory?.user_max_loss_limit_pct}%</b>
                    </div>
                    <div className="bg-[#161b22] p-1 rounded">
                      <div className="text-[#8b949e]">Safe Half-Kelly:</div>
                      <b className="text-[#10b981]">{auditResult?.risk_memory?.optimal_allocation_pct}%</b>
                    </div>
                  </div>
                </div>

                {/* 4. SEBI Regulatory & Circuit Guard */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-1">
                    <span className="font-bold text-[#10b981] flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[13px]">gavel</span>
                      <span>SEBI & CIRCUIT GUARD</span>
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                      {auditResult?.sebi_guard?.vote || 'COMPLIANT'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#c9d1d9] leading-tight">
                    {auditResult?.sebi_guard?.verdict_rationale}
                  </div>
                  <div className="bg-[#161b22] p-1.5 rounded text-[9px] text-[#8b949e]">
                    Circuit Filter: <b className="text-[#10b981]">Normal 20% Band</b> • Statutory Disclaimers: <b className="text-white">Active</b>
                  </div>
                </div>
              </div>

              {/* 30-Day Monte Carlo Volatility Cone Fan Chart */}
              {auditResult?.quant_math?.monte_carlo?.path_sample_cone && (
                <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="material-symbols-outlined text-[#38bdf8] text-[14px]">show_chart</span>
                      <span className="font-bold text-white text-[10px] uppercase">
                        1,000-Path Monte Carlo Geometric Brownian Motion Trajectories (30-Day Horizon)
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[9px]">
                      <span className="text-[#10b981] font-bold">Target: ₹{auditResult.target}</span>
                      <span className="text-[#f43f5e] font-bold">StopLoss: ₹{auditResult.stoploss}</span>
                    </div>
                  </div>
                  <div className="h-44 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={auditResult.quant_math.monte_carlo.path_sample_cone[0].map((_, stepIdx) => {
                          const point = { step: `D${stepIdx}` };
                          auditResult.quant_math.monte_carlo.path_sample_cone.forEach((p, idx) => {
                            point[`path_${idx}`] = p[stepIdx];
                          });
                          return point;
                        })}
                      >
                        <XAxis dataKey="step" stroke="#484f58" tick={{ fontSize: 8 }} />
                        <YAxis domain={['auto', 'auto']} stroke="#484f58" tick={{ fontSize: 8 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '9px' }} />
                        <ReferenceLine y={auditResult.target} stroke="#10b981" strokeDasharray="3 3" />
                        <ReferenceLine y={auditResult.stoploss} stroke="#f43f5e" strokeDasharray="3 3" />
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

              {/* Council Dialogue Trace */}
              <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 space-y-1.5">
                <span className="font-bold text-[#8b949e] text-[9px] uppercase tracking-wider flex items-center space-x-1">
                  <span className="material-symbols-outlined text-[12px]">terminal</span>
                  <span>COUNCIL DELIBERATION STREAM</span>
                </span>
                <div className="space-y-1 text-[10px]">
                  {auditResult?.dialogue_trace?.map((trace, idx) => (
                    <div key={idx} className="flex items-start space-x-2 bg-[#161b22] px-2 py-1 rounded border border-[#21262d]/60">
                      <span className="text-[#38bdf8] font-bold shrink-0">[{trace.agent}]:</span>
                      <span className="text-[#e0e2eb]">{trace.statement}</span>
                      <span className="ml-auto text-[9px] font-mono text-[#8b949e] shrink-0">Score: {trace.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>

        {/* RIGHT DRAWER: Persistent Customer Memory Card */}
        <aside className="w-64 bg-[#0d1117] border-l border-[#21262d] p-2.5 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-3">
            <div className="border-b border-[#21262d] pb-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#a855f7] flex items-center space-x-1">
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                  <span>CUSTOMER MEMORY</span>
                </span>
                <span className="bg-[#a855f7]/20 text-[#a855f7] px-1.5 py-0.2 rounded text-[8px] font-bold">LEARNING</span>
              </div>
              <p className="text-[9px] text-[#8b949e] mt-1 leading-tight">
                Tracks your risk tolerance, trading style, and ticker bias automatically across sessions.
              </p>
            </div>

            <div className="space-y-2 text-[10px]">
              <div className="bg-[#161b22] p-2 rounded border border-[#21262d] space-y-1">
                <div className="text-[8px] text-[#8b949e] uppercase">Learned Trading Style</div>
                <div className="text-[#10b981] font-bold">{memoryProfile?.trading_style || 'SWING BREAKOUT'}</div>
              </div>

              <div className="bg-[#161b22] p-2 rounded border border-[#21262d] space-y-1">
                <div className="text-[8px] text-[#8b949e] uppercase">Risk Profile</div>
                <div className="text-white font-bold">{memoryProfile?.risk_profile || 'AGGRESSIVE'}</div>
              </div>

              <div className="bg-[#161b22] p-2 rounded border border-[#21262d] space-y-1">
                <div className="text-[8px] text-[#8b949e] uppercase">Max Loss Budget</div>
                <div className="text-[#f43f5e] font-bold">{memoryProfile?.max_portfolio_loss_pct || 25}% per trade</div>
              </div>

              <div className="bg-[#161b22] p-2 rounded border border-[#21262d] space-y-1">
                <div className="text-[8px] text-[#8b949e] uppercase">Tracked Watchlist</div>
                <div className="text-[#38bdf8] font-bold truncate">{memoryProfile?.favorite_tickers || 'RELIANCE, TATAMOTORS, INFY'}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#21262d] pt-2">
            <button
              onClick={async () => {
                await fetch('/api/user/memory/reset?user_id=demo-trader', { method: 'POST' });
                fetchMemory();
              }}
              className="w-full py-1 bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-[#f43f5e] rounded text-[9px] font-bold transition-all border border-[#21262d]"
            >
              RESET LEARNED MEMORY
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
