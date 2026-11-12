import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, ShieldAlert, Cpu, Sparkles, TrendingUp, TrendingDown,
  AlertCircle, RefreshCw, PlayCircle, BarChart3, Search, ArrowUpRight,
  Sliders, ShieldCheck, Crosshair, Zap, FileText, CornerDownLeft, Eye, Award,
  Brain, UserCheck, Heart, User, RotateCcw
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function AIHedgeFundTerminal() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState('TATAMOTORS');
  const [candleData, setCandleData] = useState([]);
  const [auditResult, setAuditResult] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [history, setHistory] = useState([
    {
      timestamp: '09:15:02',
      type: 'SYSTEM_BOOT',
      text: 'Institutional Risk Engine initialized. Connected to 2,559 NSE equites universe, 2,448 historical calls, 74 YouTube audio transcripts, and Persistent Customer Memory.',
      engine: 'kernel'
    }
  ]);
  const [quickTips, setQuickTips] = useState([]);
  const logEndRef = useRef(null);

  // Fetch customer memory profile
  const fetchMemoryProfile = () => {
    fetch('/api/user/memory/profile?user_id=demo-trader')
      .then(res => res.json())
      .then(data => setUserProfile(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchMemoryProfile();
  }, []);

  // Fetch live candles for active symbol
  useEffect(() => {
    fetch(`/api/stock-candles?symbol=${activeSymbol}&period=1mo&interval=1d`)
      .then(res => res.json())
      .then(data => {
        if (data && data.candles) {
          setCandleData(data.candles);
        }
      })
      .catch(() => {});
  }, [activeSymbol]);

  // Fetch recent tips for quick click
  useEffect(() => {
    fetch('/api/home-feed')
      .then(res => res.json())
      .then(data => {
        if (data && data.recent_tips) {
          setQuickTips(data.recent_tips.slice(0, 6));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleAudit = async (customPrompt = null) => {
    const textToRun = (customPrompt || query).trim();
    if (!textToRun || loading) return;

    setQuery('');
    setLoading(true);

    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    setHistory(prev => [
      ...prev,
      {
        timestamp: timeStr,
        type: 'INPUT_DISPATCH',
        text: textToRun,
        engine: 'trader'
      }
    ]);

    try {
      const res = await fetch('/api/finbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToRun, session_id: 'hedge-fund-terminal', user_id: 'demo-trader' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Execution failed');

      setAuditResult(data);
      if (data.customer_profile) {
        setUserProfile(data.customer_profile);
      }
      if (data.ticker) {
        setActiveSymbol(data.ticker.replace('.NS', ''));
      }

      setHistory(prev => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          type: 'QUANT_VERDICT',
          data: data,
          text: data.reply || data.response || JSON.stringify(data),
          engine: data.source_node || 'gemini-3.5-flash-primary',
          action_chips: data.action_chips || []
        }
      ]);
    } catch (err) {
      setHistory(prev => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          type: 'ERROR',
          text: `Gatekeeper Alert: ${err.message}`,
          engine: 'safety'
        }
      ]);
    } finally {
      setLoading(false);
      fetchMemoryProfile();
    }
  };

  const handleResetMemory = async () => {
    await fetch('/api/user/memory/reset?user_id=demo-trader', { method: 'POST' });
    fetchMemoryProfile();
  };

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 420px',
      gap: '16px',
      height: 'calc(100vh - 125px)',
      minHeight: '680px',
      fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace"
    }}>
      {/* LEFT PANE: Active Quant Chart & Execution Terminal */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Top Active Ticker Monitor */}
        <div style={{
          background: 'linear-gradient(145deg, #0f1728 0%, #080d18 100%)',
          border: '1px solid #1a273e',
          borderRadius: '4px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                NSE: {activeSymbol}
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 6px', borderRadius: '2px', fontWeight: 700 }}>
                CANDLESTICK TICKER
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              1-Month Daily Candlestick Stream • Automatic NER Context Target
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['TATAMOTORS', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY'].map(sym => (
              <button
                key={sym}
                onClick={() => setActiveSymbol(sym)}
                style={{
                  background: activeSymbol === sym ? 'rgba(56, 189, 248, 0.2)' : '#070a11',
                  border: `1px solid ${activeSymbol === sym ? '#38bdf8' : '#1e293b'}`,
                  color: activeSymbol === sym ? '#f8fafc' : '#94a3b8',
                  padding: '4px 10px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Lightweight Candlestick / Area Chart View */}
        <div style={{
          background: '#070a11',
          border: '1px solid #1a273e',
          borderRadius: '4px',
          padding: '12px',
          height: '240px',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: '12px', left: '16px', fontSize: '10px', color: '#64748b', zIndex: 1 }}>
            HISTORICAL OHLC CLOSE VOLATILITY
          </div>
          {candleData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={candleData}>
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={['auto', 'auto']} stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} orientation="right" />
                <Tooltip contentStyle={{ background: '#0b111e', border: '1px solid #1e293b', fontSize: '11px', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="close" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#chartGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '12px' }}>
              Fetching real-time exchange candles for {activeSymbol}...
            </div>
          )}
        </div>

        {/* Console Log Feed */}
        <div style={{
          flex: 1,
          background: '#05070c',
          border: '1px solid #1a273e',
          borderRadius: '4px',
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {history.map((h, i) => (
            <div key={i} style={{ borderBottom: '1px solid #0f1726', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>[{h.timestamp}]</span>
                <span style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '2px',
                  fontWeight: 700,
                  background: h.type === 'INPUT_DISPATCH' ? '#1e293b' : h.type === 'QUANT_VERDICT' ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
                  color: h.type === 'INPUT_DISPATCH' ? '#e2e8f0' : h.type === 'QUANT_VERDICT' ? '#38bdf8' : '#10b981'
                }}>
                  {h.type}
                </span>
                <span style={{ fontSize: '10px', color: '#38bdf8' }}>via {h.engine}</span>
              </div>

              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {h.text}
              </div>

              {h.action_chips && h.action_chips.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {h.action_chips.map((c, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => {
                        if (c.tickers) handleAudit(`Optimize portfolio for ${c.tickers.join(', ')} with 6.5% risk free rate`);
                        else if (c.ticker) setActiveSymbol(c.ticker.replace('.NS', ''));
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ArrowUpRight size={11} /> {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '11px' }}>
              <RefreshCw size={13} className="spin" /> Executing multi-step Bayesian conviction trace & YouTube transcript cross-check...
            </div>
          )}
          <div ref={logEndRef} />
        </div>

        {/* Command Line Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleAudit(); }} style={{
          display: 'flex',
          gap: '8px',
          background: '#0b111e',
          border: '1px solid #1a273e',
          borderRadius: '4px',
          padding: '10px 14px'
        }}>
          <span style={{ color: '#38bdf8', fontWeight: 800 }}>&gt;</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type command, stock tip, or preference (e.g. 'I am an aggressive swing trader on Reliance')..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '12px',
              fontFamily: 'inherit'
            }}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            style={{
              background: '#0284c7',
              border: 'none',
              borderRadius: '3px',
              padding: '0 16px',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            EXECUTE <CornerDownLeft size={12} />
          </button>
        </form>
      </div>

      {/* RIGHT PANE: Customer Memory Profile & Live Radar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        height: '100%',
        overflowY: 'auto'
      }}>
        {/* Customer Memory & Behavioral Profile Card */}
        <div style={{
          background: 'linear-gradient(145deg, #0e1526 0%, #080d19 100%)',
          border: '1px solid #1a2b4a',
          borderRadius: '4px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Brain size={16} color="#38bdf8" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                CUSTOMER BEHAVIORAL MEMORY
              </span>
            </div>
            <button
              onClick={handleResetMemory}
              title="Reset Customer Memory"
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
            >
              <RotateCcw size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ background: '#05070c', border: '1px solid #141c2c', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontSize: '9px', color: '#64748b' }}>IDENTIFIED RISK PROFILE</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                {userProfile?.risk_profile || 'Moderate / Balanced Growth'}
              </div>
            </div>

            <div style={{ background: '#05070c', border: '1px solid #141c2c', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontSize: '9px', color: '#64748b' }}>PREFERRED TRADING STYLE</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                {userProfile?.trading_style || 'Swing Breakout & Quality Delivery'}
              </div>
            </div>

            <div style={{ background: '#05070c', border: '1px solid #141c2c', padding: '10px', borderRadius: '3px' }}>
              <div style={{ fontSize: '9px', color: '#64748b' }}>LEARNED FAVORITE TICKERS</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                {(userProfile?.favorite_tickers || ['TATAMOTORS', 'RELIANCE', 'TCS']).map(t => (
                  <span
                    key={t}
                    onClick={() => setActiveSymbol(t)}
                    style={{
                      fontSize: '10px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Tips Ingestion Feed */}
        <div style={{
          flex: 1,
          background: '#0a0f1a',
          border: '1px solid #1a273e',
          borderRadius: '4px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
              RECENT INGESTED CALLS
            </span>
            <span style={{ fontSize: '9px', color: '#64748b' }}>CLICK TO AUDIT</span>
          </div>

          {quickTips.map((tip, idx) => (
            <div
              key={idx}
              onClick={() => handleAudit(`Audit trade: ${tip.action} ${tip.ticker} @ ${tip.entry_price} TGT ${tip.target_price} SL ${tip.stoploss_price} by ${tip.creator || 'Desk'}`)}
              style={{
                background: '#05070c',
                border: '1px solid #141c2c',
                padding: '10px',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'border 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#141c2c'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>{tip.ticker}</span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: tip.action === 'BUY' ? '#10b981' : '#ef4444',
                  background: tip.action === 'BUY' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  padding: '1px 5px',
                  borderRadius: '2px'
                }}>
                  {tip.action}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                Entry: ₹{tip.entry_price} • Tgt: ₹{tip.target_price} • SL: ₹{tip.stoploss_price}
              </div>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>
                Creator: {tip.creator || 'Research Analyst'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
