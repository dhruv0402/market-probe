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

/* ---------------------------------- FEED ---------------------------------- */
export function TipCard({ t, first, onAuditInCouncil }) {
  const [playing, setPlaying] = useState(false);
  const [showTheater, setShowTheater] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [candles, setCandles] = useState([]);
  const [loadingCandles, setLoadingCandles] = useState(false);

  // Position Sizing Calculator State
  const [userCapital, setUserCapital] = useState(50000);
  const [riskPerTrade, setRiskPerTrade] = useState(1500);

  const isYT = t.platform === 'YouTube' && t.video_id;
  const conv = t.ai_conviction_score ?? 50;
  const statusCls = t.status === 'HIT' ? 'pill-hit' : t.status === 'MISS' ? 'pill-miss' : 'pill-open';

  const entry = Number(t.entry_price) || 100;
  const target = Number(t.target_price) || entry * 1.08;
  const stoploss = Number(t.stoploss_price) || entry * 0.95;

  const perShareRisk = Math.max(0.1, Math.abs(entry - stoploss));
  const perShareReward = Math.max(0.1, Math.abs(target - entry));
  const suggestedQty = Math.max(1, Math.floor(riskPerTrade / perShareRisk));
  const totalCost = suggestedQty * entry;
  const expectedProfit = suggestedQty * perShareReward;
  const maxLoss = suggestedQty * perShareRisk;

  const toggleChart = () => {
    if (!showChart && candles.length === 0) {
      setLoadingCandles(true);
      api(`/stock-candles?symbol=${t.ticker}&period=1mo&interval=1d`)
        .then((d) => setCandles(d.candles || []))
        .catch(() => setCandles([]))
        .finally(() => setLoadingCandles(false));
    }
    setShowChart(!showChart);
  };

  const [copiedKite, setCopiedKite] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeBroker, setActiveBroker] = useState('ZERODHA');

  const copyKitePayload = (e) => {
    e?.stopPropagation();
    const payload = `${t.action} ${t.ticker} | Qty: ${suggestedQty} | Price: ₹${t.entry_price} | SL: ₹${t.stoploss_price} | Target: ₹${t.target_price}`;
    navigator.clipboard?.writeText(payload);
    setCopiedKite(true);
    setTimeout(() => setCopiedKite(false), 2000);
  };

  const tvSymbol = t.ticker.startsWith('^') ? 'NSE:NIFTY' : `NSE:${t.ticker}`;
  const rawSymbol = t.ticker.replace('.NS', '').replace('^', '');

  return (
    <div className="card tip">
      {isYT ? (
        <div className="tip-media" data-tour={first ? 'tip-video' : undefined}>
          {playing ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="tip-close-media"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTheater(true);
                  }}
                  title="Expand to Theater Mode"
                >
                  <Maximize2 size={13} />
                </button>
                <button
                  type="button"
                  className="tip-close-media"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlaying(false);
                  }}
                  title="Close video preview"
                >
                  <X size={15} />
                </button>
              </div>
              <iframe 
                src={`https://www.youtube.com/embed/${t.video_id}?start=${t.timestamp_seconds || 0}&autoplay=1`} 
                title={t.video_title} 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen 
              />
            </div>
          ) : (
            <div onClick={() => setPlaying(true)} style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img 
                src={t.thumbnail_url || `https://i.ytimg.com/vi/${t.video_id}/hqdefault.jpg`} 
                alt={t.video_title} 
                loading="lazy" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://img.youtube.com/vi/${t.video_id}/0.jpg`;
                }}
              />
              <div className="tip-yt">
                <Play size={10} fill="#ef4444" color="#ef4444" />
                <span>YOUTUBE AUDIT RECORD</span>
              </div>
              <button
                type="button"
                className="tip-close-media"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTheater(true);
                }}
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 5 }}
                title="Theater Mode"
              >
                <Maximize2 size={13} />
              </button>
              <div className="tip-play">
                <span><Play size={24} fill="#fff" color="#fff" style={{ marginLeft: 2 }} /></span>
              </div>
              <div className="tip-overlay">
                <div className="tip-title">{t.video_title || `${t.action} ${t.ticker} Analysis`}</div>
                <div className="tip-overlay-bottom">
                  <span className="tip-ts">
                    <Clock size={11} /> Call @ {t.timestamp_str || '00:00'}
                  </span>
                  <span style={{ fontSize: 10.5, color: '#e2e8f0', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                    {t.creator_name}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tip-nomedia" data-tour={first ? 'tip-video' : undefined}>
          <div className="row between">
            <span className="pill pill-sebi">{t.platform}</span>
            <span style={{ fontSize: 11.5, color: 'var(--dim)', fontFamily: 'var(--mono)' }}>
              {t.timestamp ? String(t.timestamp).slice(0, 10) : 'VERIFIED'}
            </span>
          </div>
          <div className="big" style={{ color: t.action === 'BUY' ? 'var(--green2)' : '#fb7185' }}>
            {t.action} {t.ticker}
          </div>
          <div className="src">
            <Activity size={14} color="var(--dim)" />
            <span>{t.broker_desk || t.telegram_channel || 'Multi-platform Social Intake'}</span>
          </div>
          {t.source_url && t.source_url !== '#' && (
            <div style={{ marginTop: 4 }}>
              <a href={t.source_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--blue)' }}>
                Inspect source bulletin <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </a>
            </div>
          )}
        </div>
      )}

      <div className="tip-body">
        <div className="row between" style={{ flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
          <div className="row" style={{ flex: '1 1 auto', minWidth: 200, gap: 10 }}>
            <div className="creator-av" style={{ background: t.is_sebi ? 'rgba(16,185,129,0.15)' : 'rgba(56,189,248,0.15)', color: t.is_sebi ? 'var(--green2)' : 'var(--blue)' }}>
              {t.creator_name ? t.creator_name[0] : 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{t.creator_name}</span>
                {t.is_sebi ? (
                  <span className="pill pill-buy" style={{ fontSize: 10, padding: '2px 7px', gap: 4 }} title={`Verified SEBI Reg No: ${t.sebi_reg_no || 'Registered'}`}>
                    <ShieldCheck size={11} /> SEBI RA {t.sebi_reg_no ? `· ${t.sebi_reg_no}` : 'REGISTERED'}
                  </span>
                ) : (
                  <span className="pill pill-miss" style={{ fontSize: 10, padding: '2px 7px', gap: 4 }} title="Unregistered Social Creator - Higher Execution Risk">
                    <AlertTriangle size={11} /> UNREGISTERED
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--dim)', marginTop: 2 }}>
                {t.platform} · {String(t.timestamp || '').slice(0, 10)}
              </div>
            </div>
          </div>
          <div className="row" style={{ flexShrink: 0, gap: 6 }}>
            <span className={`pill ${t.action === 'BUY' ? 'pill-buy' : 'pill-sell'}`} style={{ fontSize: 12, padding: '4px 8px' }}>
              {t.action} {t.ticker}
            </span>
            <span className={`pill ${statusCls}`} style={{ fontSize: 11, padding: '4px 8px' }}>
              {t.status}
            </span>
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

        {/* Action Controls: Chart & Position Sizing Toggles */}
        <div className="row" style={{ gap: 8, marginTop: 4 }}>
          <button
            type="button"
            className={`btn btn-ghost ${showChart ? 'btn-blue' : ''}`}
            onClick={toggleChart}
            style={{ flex: 1, padding: '7px 12px', fontSize: 12, justifyContent: 'center' }}
          >
            <BarChart3 size={13} /> {showChart ? 'Hide Chart' : 'Inspect Candlestick Chart'}
          </button>
          <button
            type="button"
            className={`btn btn-ghost ${showCalc ? 'btn-blue' : ''}`}
            onClick={() => setShowCalc(!showCalc)}
            style={{ flex: 1, padding: '7px 12px', fontSize: 12, justifyContent: 'center' }}
          >
            <Calculator size={13} /> {showCalc ? 'Hide Math' : 'Position Size Calculator'}
          </button>
        </div>

        {/* 1. Interactive Technical Candlestick Chart Drawer */}
        {showChart && (
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, border: '1px solid var(--line2)', marginTop: 8 }}>
            <div className="row between" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--dim)', textTransform: 'uppercase' }}>
                {t.ticker} 30-Day Technical Price Action
              </span>
              <div className="row" style={{ gap: 8, fontSize: 11, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--green2)', fontWeight: 700 }}>● Tgt: {inr(target)}</span>
                <span style={{ color: 'var(--blue)', fontWeight: 700 }}>● Entry: {inr(entry)}</span>
                <span style={{ color: '#fb7185', fontWeight: 700 }}>● SL: {inr(stoploss)}</span>
              </div>
            </div>

            {loadingCandles ? (
              <div style={{ height: 160, display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 13 }}>
                <Loader2 size={18} className="spin" /> Loading technical candlestick bars...
              </div>
            ) : candles.length > 0 ? (
              <div style={{ height: 170, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={candles} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`chartGrad_${t.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--glow-accent)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--glow-accent)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" tick={{ fill: 'var(--dim)', fontSize: 10 }} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--dim)', fontSize: 10 }} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#0b121e', border: '1px solid var(--line2)', borderRadius: 8, fontSize: 12 }}
                      formatter={(val) => [inr(val), 'Price']}
                    />
                    <Area type="monotone" dataKey="close" stroke="var(--glow-accent)" fill={`url(#chartGrad_${t.id})`} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                Live historical ticks currently synchronizing.
              </div>
            )}
          </div>
        )}

        {/* 2. Interactive Real-Money Position Sizing & Margin Calculator */}
        {showCalc && (
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, border: '1px solid var(--line2)', marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--green2)', marginBottom: 10, textTransform: 'uppercase' }}>
              ⚡ Institutional Risk & Capital Calculator
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>TOTAL CAPITAL (₹)</label>
                <input 
                  type="number" 
                  className="input" 
                  value={userCapital} 
                  onChange={(e) => setUserCapital(Number(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--dim)', display: 'block', marginBottom: 4 }}>MAX RISK BUDGET (₹)</label>
                <input 
                  type="number" 
                  className="input" 
                  value={riskPerTrade} 
                  onChange={(e) => setRiskPerTrade(Number(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: 'var(--panel2)', padding: 10, borderRadius: 8, textAlign: 'center' }}>
              <div>
                <small style={{ display: 'block', fontSize: 10, color: 'var(--dim)' }}>SUGGESTED QTY</small>
                <b style={{ fontSize: 15, color: 'var(--text)' }}>{suggestedQty} shares</b>
              </div>
              <div>
                <small style={{ display: 'block', fontSize: 10, color: 'var(--dim)' }}>TOTAL TRADE VALUE</small>
                <b style={{ fontSize: 15, color: 'var(--text)' }}>{inr(totalCost)}</b>
              </div>
              <div>
                <small style={{ display: 'block', fontSize: 10, color: 'var(--dim)' }}>PROFIT AT TARGET</small>
                <b style={{ fontSize: 15, color: 'var(--green2)' }}>+{inr(expectedProfit)}</b>
              </div>
              <div>
                <small style={{ display: 'block', fontSize: 10, color: 'var(--dim)' }}>RISK AT STOPLOSS</small>
                <b style={{ fontSize: 15, color: '#fb7185' }}>-{inr(maxLoss)}</b>
              </div>
            </div>
          </div>
        )}

        {/* Order Execution Bar: Direct TradingView Chart Link + Multi-Broker Order Ticket Modal */}
        <div className="row between" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)', flexWrap: 'wrap', gap: 8 }}>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <a
              href={`https://www.tradingview.com/chart/?symbol=${tvSymbol}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ padding: '6px 10px', fontSize: 11.5, gap: 5, textDecoration: 'none' }}
              title="Open full TradingView NSE technical chart"
            >
              <ExternalLink size={12} />
              <span>TV Chart</span>
            </a>
            {isYT && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowTheater(true)}
                style={{ padding: '6px 10px', fontSize: 11.5, gap: 4, color: '#ef4444' }}
                title="Open Theater Mode with timestamp breakdowns"
              >
                <Maximize2 size={11} />
                <span>Theater</span>
              </button>
            )}
          </div>

          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {onAuditInCouncil && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  onAuditInCouncil({
                    ticker: t.ticker,
                    action: t.action,
                    entry_price: t.entry_price,
                    target_price: t.target_price,
                    stoploss_price: t.stoploss_price,
                    creator_name: t.influencer_name,
                  })
                }
                style={{
                  padding: '6px 10px',
                  fontSize: 11.5,
                  gap: 4,
                  color: '#38bdf8',
                  borderColor: 'rgba(56, 189, 248, 0.35)',
                }}
                title="Audit this trade setup via 5-Agent Council"
              >
                <Zap size={12} />
                <span>Audit in Council</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={copyKitePayload}
              style={{ padding: '6px 10px', fontSize: 11.5, gap: 4 }}
              title="Copy formatted trade parameters"
            >
              <Copy size={11} />
              <span>{copiedKite ? '✓ Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowOrderModal(true)}
              style={{ padding: '6px 12px', fontSize: 12, gap: 5 }}
              title="Execute order across Zerodha, Groww, Upstox, or Angel One"
            >
              <span>⚡ Execute ({suggestedQty} Qty)</span>
              <ChevronDown size={12} />
            </button>
          </div>
        </div>

        {/* Multi-Broker Execution Modal (Zerodha, Groww, Upstox, Angel One) */}
        {showOrderModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center',
            padding: 16
          }} onClick={() => setShowOrderModal(false)}>
            <div style={{
              background: '#0d131f',
              border: '1px solid var(--line2)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.9)'
            }} onClick={(e) => e.stopPropagation()}>
              <div className="row between" style={{ marginBottom: 16, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span className={`pill ${t.action === 'BUY' ? 'pill-buy' : 'pill-sell'}`} style={{ fontSize: 13 }}>
                    {t.action} {t.ticker}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Institutional Multi-Broker Router</span>
                </div>
                <button type="button" className="btn-ghost" style={{ padding: 4 }} onClick={() => setShowOrderModal(false)}>
                  <X size={18} />
                </button>
              </div>

              {/* Broker Switcher Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
                {[
                  { id: 'ZERODHA', label: 'Zerodha', color: '#ff5722' },
                  { id: 'GROWW', label: 'Groww', color: '#00d09c' },
                  { id: 'UPSTOX', label: 'Upstox', color: '#6c5ce7' },
                  { id: 'ANGELONE', label: 'Angel One', color: '#eb3b5a' }
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setActiveBroker(b.id)}
                    className="btn"
                    style={{
                      padding: '8px 4px',
                      fontSize: 12,
                      fontWeight: 700,
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: activeBroker === b.id ? 'var(--panel2)' : 'transparent',
                      borderColor: activeBroker === b.id ? b.color : 'var(--line)',
                      color: activeBroker === b.id ? '#fff' : 'var(--dim)',
                      boxShadow: activeBroker === b.id ? `0 0 12px ${b.color}33` : 'none'
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Order Ticket Matrix */}
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, border: '1px solid var(--line)', marginBottom: 16 }}>
                <div className="row between" style={{ marginBottom: 8, fontSize: 12.5 }}>
                  <span style={{ color: 'var(--dim)' }}>Instrument:</span>
                  <b style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>NSE:{rawSymbol}</b>
                </div>
                <div className="row between" style={{ marginBottom: 8, fontSize: 12.5 }}>
                  <span style={{ color: 'var(--dim)' }}>Recommended Sizing:</span>
                  <b style={{ color: 'var(--blue)' }}>{suggestedQty} Shares ({inr(totalCost)})</b>
                </div>
                <div className="row between" style={{ marginBottom: 8, fontSize: 12.5 }}>
                  <span style={{ color: 'var(--dim)' }}>Target Limit:</span>
                  <b style={{ color: 'var(--green2)' }}>{inr(t.target_price)} (+{t.upside_pct || 8}%)</b>
                </div>
                <div className="row between" style={{ fontSize: 12.5 }}>
                  <span style={{ color: 'var(--dim)' }}>Strict Stop Loss:</span>
                  <b style={{ color: '#fb7185' }}>{inr(t.stoploss_price)} (-{Math.abs(t.risk_pct || 4)}%)</b>
                </div>
              </div>

              {/* Dynamic Execution Action based on selected broker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeBroker === 'ZERODHA' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <a
                      href={`https://kite.zerodha.com/marketwatch?search=${encodeURIComponent(rawSymbol)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13.5, gap: 8, textDecoration: 'none', background: '#ff5722', borderColor: '#ff5722' }}
                      onClick={copyKitePayload}
                    >
                      <ExternalLink size={14} /> Open {rawSymbol} in Zerodha Kite & Copy Order
                    </a>
                    <div className="row between" style={{ fontSize: 11, color: 'var(--dim)', padding: '0 4px' }}>
                      <span>Kite Auto-Search Link</span>
                      <a 
                        href={`https://kite.zerodha.com/chart/ext/tvc/NSE/${rawSymbol}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--blue)', textDecoration: 'underline' }}
                        onClick={copyKitePayload}
                      >
                        Alternative: Kite TV Chart
                      </a>
                    </div>
                  </div>
                )}

                {activeBroker === 'GROWW' && (
                  <a
                    href={`https://groww.in/stocks/${rawSymbol.toLowerCase()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13.5, gap: 8, textDecoration: 'none', background: '#00d09c', borderColor: '#00d09c', color: '#000' }}
                    onClick={copyKitePayload}
                  >
                    <ExternalLink size={14} /> Open in Groww & Copy Payload
                  </a>
                )}

                {activeBroker === 'UPSTOX' && (
                  <a
                    href={`https://pro.upstox.com/`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13.5, gap: 8, textDecoration: 'none', background: '#6c5ce7', borderColor: '#6c5ce7' }}
                    onClick={copyKitePayload}
                  >
                    <ExternalLink size={14} /> Open Upstox Pro & Copy Payload
                  </a>
                )}

                {activeBroker === 'ANGELONE' && (
                  <a
                    href={`https://trade.angelone.in/`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13.5, gap: 8, textDecoration: 'none', background: '#eb3b5a', borderColor: '#eb3b5a' }}
                    onClick={copyKitePayload}
                  >
                    <ExternalLink size={14} /> Open Angel One & Copy Payload
                  </a>
                )}

                <a
                  href={`https://www.tradingview.com/chart/?symbol=${tvSymbol}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', padding: '8px 16px', fontSize: 12.5, gap: 6, textDecoration: 'none' }}
                >
                  <ExternalLink size={13} /> View Real-Time TradingView Terminal
                </a>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={copyKitePayload}
                  style={{ width: '100%', justifyContent: 'center', padding: '8px 16px', fontSize: 12.5, gap: 6 }}
                >
                  <Copy size={13} /> {copiedKite ? '✓ Parameters Copied to Clipboard!' : 'Copy Formatted Order Details'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full-Screen YouTube Theater / Audit Mode Modal */}
        {showTheater && isYT && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,6,23,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 10000,
            display: 'grid',
            placeItems: 'center',
            padding: 20
          }} onClick={() => setShowTheater(false)}>
            <div style={{
              background: '#090d16',
              border: '1px solid var(--line2)',
              borderRadius: 16,
              maxWidth: 960,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 30px 60px -15px rgba(0,0,0,0.95)'
            }} onClick={(e) => e.stopPropagation()}>
              <div className="row between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <div className="row" style={{ gap: 10 }}>
                  <div className="tip-yt" style={{ position: 'static' }}>
                    <Play size={10} fill="#ef4444" color="#ef4444" />
                    <span>YOUTUBE AUDIT THEATER</span>
                  </div>
                  <b style={{ fontSize: 14, color: 'var(--text)' }}>
                    {t.ticker} Recommendation Replay
                  </b>
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: 6, borderRadius: '50%' }}
                  onClick={() => setShowTheater(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                <iframe 
                  src={`https://www.youtube.com/embed/${t.video_id}?start=${t.timestamp_seconds || 0}&autoplay=1`} 
                  title={t.video_title} 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen 
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              </div>

              <div style={{ padding: '16px 20px', background: 'var(--panel2)' }}>
                <div className="row between" style={{ marginBottom: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 16, margin: 0, color: 'var(--text)' }}>{t.video_title}</h3>
                    <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 4 }}>
                      Channel: <b style={{ color: 'var(--text)' }}>{t.creator_name}</b> · Call Timestamp: <b style={{ color: '#ef4444' }}>@{t.timestamp_str || '00:00'}</b>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <a
                      href={`https://www.youtube.com/watch?v=${t.video_id}&t=${t.timestamp_seconds || 0}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost"
                      style={{ padding: '6px 12px', fontSize: 12, gap: 5, color: '#ef4444' }}
                    >
                      <ExternalLink size={12} /> Open on YouTube
                    </a>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setShowTheater(false);
                        setShowOrderModal(true);
                      }}
                      style={{ padding: '6px 14px', fontSize: 12 }}
                    >
                      Execute Trade
                    </button>
                  </div>
                </div>

                {t.quote && (
                  <div className="quote" style={{ margin: 0, fontSize: 13.5 }}>
                    "{t.quote}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Feed({ data, loading, error, onSelectStock, onAuditInCouncil }) {
  const [q, setQ] = useState('');
  const [plat, setPlat] = useState('ALL');
  const [hiConv, setHiConv] = useState(false);
  const tips = data?.recent_tips || [];
  const s = data?.stats || {};
  const [radar, setRadar] = useState(null);
  const [radarLoading, setRadarLoading] = useState(false);

  useEffect(() => {
    setRadarLoading(true);
    api('/market-open-radar')
      .then((d) => setRadar(d))
      .catch(() => setRadar(null))
      .finally(() => setRadarLoading(false));
  }, []);

  const platforms = ['ALL', 'YouTube', 'Twitter/X', 'Telegram'];
  const shown = tips.filter((t) => {
    if (plat !== 'ALL' && t.platform !== plat) return false;
    if (hiConv && (t.ai_conviction_score || 0) < 60) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      (t.ticker || '').toLowerCase().includes(s) ||
      (t.company_name || '').toLowerCase().includes(s) ||
      (t.creator_name || t.influencer_name || '').toLowerCase().includes(s)
    );
  });

  return (
    <>
      {/* 9:15 AM MARKET OPEN TRAP & ALPHA RADAR */}
      {radar && (radar.actionable_now?.length > 0 || radar.danger_traps?.length > 0) && (
        <div className="card" style={{ padding: 20, marginBottom: 20, border: '1px solid var(--line2)', background: 'linear-gradient(145deg, rgba(16,185,129,0.06), rgba(15,23,42,0.6))' }}>
          <div className="row between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div className="row" style={{ gap: 8 }}>
              <span className="live-dot" />
              <b style={{ fontSize: 13, letterSpacing: 0.8, color: 'var(--green2)', textTransform: 'uppercase' }}>
                9:15 AM Market Open Radar & Trap Shield
              </b>
              <span className="pill pill-open" style={{ fontSize: 10 }}>DAILY ACTIVE SETUPS</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--dim)', fontFamily: 'var(--mono)' }}>
              {radar.market_regime}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* 1. Actionable Setups Near Entry */}
            <div style={{ background: 'var(--panel2)', borderRadius: 10, padding: 14, border: '1px solid rgba(16,185,129,0.25)' }}>
              <div className="row" style={{ color: 'var(--green2)', fontWeight: 800, fontSize: 12, marginBottom: 10, gap: 6 }}>
                <CheckCircle2 size={14} /> ACTIONABLE TODAY (IN SWEET SPOT ±2.5%)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {radar.actionable_now?.slice(0, 3).map((a) => (
                  <div key={a.id} className="row between" style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 6, fontSize: 12.5 }}>
                    <div>
                      <b style={{ color: 'var(--text)' }}>{a.ticker}</b>
                      <span style={{ color: 'var(--dim)', marginLeft: 6 }}>CMP: {inr(a.current_price)}</span>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ color: a.distance_from_entry_pct >= 0 ? 'var(--green2)' : 'var(--blue)', fontWeight: 700 }}>
                        {a.distance_from_entry_pct >= 0 ? `+${a.distance_from_entry_pct}%` : `${a.distance_from_entry_pct}%`} vs Entry
                      </span>
                      {onAuditInCouncil && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '3px 8px', fontSize: 10.5, color: '#38bdf8', borderColor: 'rgba(56,189,248,0.35)' }}
                          onClick={() =>
                            onAuditInCouncil({
                              ticker: a.ticker,
                              action: a.action,
                              entry_price: a.entry_price,
                              target_price: a.target_price,
                              stoploss_price: a.stoploss_price,
                              creator_name: a.creator_name,
                            })
                          }
                        >
                          <Zap size={11} /> Audit
                        </button>
                      )}
                      <a 
                        href={`https://kite.zerodha.com/chart/ext/ciq/NSE/${a.ticker}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost"
                        style={{ padding: '3px 8px', fontSize: 10.5, textDecoration: 'none' }}
                        title="Open neutral exchange price chart (research only)"
                      >
                        Inspect Chart <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Danger Traps (Breached Stop Losses) */}
            <div style={{ background: 'var(--panel2)', borderRadius: 10, padding: 14, border: '1px solid rgba(244,63,94,0.25)' }}>
              <div className="row" style={{ color: '#fb7185', fontWeight: 800, fontSize: 12, marginBottom: 10, gap: 6 }}>
                <AlertTriangle size={14} /> STOP-LOSS TRAP ALERTS (DO NOT CHASE)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {radar.danger_traps?.slice(0, 3).map((t) => (
                  <div key={t.id} className="row between" style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 6, fontSize: 12.5 }}>
                    <div>
                      <b style={{ color: '#fb7185' }}>{t.ticker}</b>
                      <span style={{ color: 'var(--dim)', marginLeft: 6 }}>{t.trap_reason}</span>
                    </div>
                    <span className="pill pill-miss" style={{ fontSize: 10 }}>INVALIDATED</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hero card">
        <div>
          <div className="eyebrow"><Sparkles size={13} /> Institutional Finfluencer Auditor</div>
          <h2>Live Verified Recommendations Feed</h2>
          <p>
            Autonomous algorithmic validation engine. Every buy and sell recommendation is timestamp-verified against live NSE data, scored with Bayesian ML conviction algorithms, and accompanied by native playback.
          </p>
        </div>
        <div className="hero-ring">
          <div className="card" style={{ padding: '14px 18px', textAlign: 'center', background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--green2)', letterSpacing: 0.6 }}>VERIFIED PRIMARY PROOF</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', marginTop: 4, fontFamily: 'var(--mono)' }}>
              {s.total_tips_tracked ? `${(( (s.verified_primary_calls || 0) / s.total_tips_tracked ) * 100).toFixed(1)}%` : '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {fmt(s.verified_primary_calls)} primary-source calls
            </div>
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
        <button className={`chip ${hiConv ? 'on' : ''}`} onClick={() => setHiConv(!hiConv)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Zap size={13} /> High Conviction (&gt;60%)
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
          <TipCard key={t.id} t={t} first={i === 0} onAuditInCouncil={onAuditInCouncil} />
        ))}
      </div>
    </>
  );
}
