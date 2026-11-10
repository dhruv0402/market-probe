import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, X, Sparkles, RefreshCw, Maximize2, Minimize2, 
  ChevronRight, Terminal, Shield, ArrowUpRight, Zap, Layers,
  ExternalLink, Bookmark, Calculator, Activity
} from 'lucide-react';

export default function FinBotDrawer({ isOpen, onClose, onNavigateTab }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'MarketProbe Copilot (FinBot Quant Engine) active. Ask any question regarding stock tip audits, influencer credibility, MPT portfolio weights, or Indian Section 112A tax harvesting.',
      node: 'gemini-3.5-flash-router',
      action_chips: [
        { type: 'NAVIGATE_TAB', label: 'Explore Live Feed', tab: 'FEED' },
        { type: 'NAVIGATE_TAB', label: 'Open P&L Simulator', tab: 'SIMULATOR' },
        { type: 'NAVIGATE_TAB', label: 'View Model Rigor', tab: 'EVAL' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleActionChipClick = (chip) => {
    if (chip.type === 'NAVIGATE_TAB' && onNavigateTab) {
      onNavigateTab(chip.tab);
    } else if (chip.type === 'OPTIMIZE_PORTFOLIO') {
      setInput(`Optimize MPT weights for ${chip.tickers.join(', ')} with 6.5% risk-free rate`);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/finbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, session_id: 'marketprobe-drawer' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Gateway error');

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || data.response || (typeof data === 'string' ? data : JSON.stringify(data)),
          node: data.source_node || data.model || 'multi-node-orchestrator',
          action_chips: data.action_chips || []
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Gateway notice: ${err.message}. FinBot backend on :8000 is ready to process queries.`,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: expanded ? '85vw' : '490px',
      maxWidth: '100vw',
      background: '#070a11',
      borderLeft: '1px solid #1a2333',
      boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.65)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        background: '#0d131f',
        borderBottom: '1px solid #1a2333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>FINBOT COPILOT</span>
              <span style={{ fontSize: '9px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '1px 5px', borderRadius: '2px', fontWeight: 600 }}>LIVE</span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>CMD+K • Autonomous Actions • 2,448 Calls</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={() => setExpanded(!expanded)} 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            title={expanded ? "Collapse Drawer" : "Expand Full Width"}
          >
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: '#070a11'
      }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
            <div style={{
              background: m.role === 'user' ? '#182235' : '#0d131f',
              border: `1px solid ${m.role === 'user' ? '#253550' : m.isError ? '#ef4444' : '#1a2333'}`,
              color: '#f1f5f9',
              padding: '12px 15px',
              borderRadius: '4px',
              fontSize: '12.5px',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap'
            }}>
              {m.role === 'user' && (
                <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, marginBottom: '4px', fontFamily: 'monospace' }}>
                  &gt; PROMPT
                </div>
              )}
              {m.text}

              {/* Phase 4: Action Chips */}
              {m.action_chips && m.action_chips.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {m.action_chips.map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => handleActionChipClick(chip)}
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38bdf8',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <ArrowUpRight size={11} /> {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {m.node && (
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>
                Engine: <span style={{ color: '#38bdf8' }}>{m.node}</span>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '11px', padding: '8px' }}>
            <RefreshCw size={13} className="spin" /> Executing autonomous quant cycle...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Inquiries */}
      <div style={{
        padding: '8px 12px',
        background: '#0a0f19',
        borderTop: '1px solid #1a2333',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto'
      }}>
        {[
          'Audit BUY TATAMOTORS @ 980 TGT 1050 SL 940',
          'Who are the top influencers?',
          'Add RELIANCE to my watchlist',
          'Optimize MPT for RELIANCE, TCS, INFY with 6.5% risk-free rate',
          'Calculate tax harvesting for ₹1.2L capital gains under Sec 112A'
        ].map((prompt, i) => (
          <button
            key={i}
            onClick={() => setInput(prompt)}
            style={{
              fontSize: '10.5px',
              background: '#131b29',
              border: '1px solid #202c42',
              color: '#94a3b8',
              padding: '4px 8px',
              borderRadius: '3px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {prompt.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} style={{
        padding: '12px 14px',
        background: '#0d131f',
        borderTop: '1px solid #1a2333',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot (e.g. Audit trade, MPT weights, Tax rules)..."
          style={{
            flex: 1,
            background: '#070a11',
            border: '1px solid #1e293b',
            borderRadius: '4px',
            padding: '9px 12px',
            color: '#f8fafc',
            fontSize: '12px',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            background: '#0284c7',
            border: 'none',
            borderRadius: '4px',
            padding: '0 14px',
            color: '#ffffff',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
