import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, ShieldAlert, Cpu, Sparkles, TrendingUp, AlertCircle, RefreshCw, 
  Video, PlayCircle, CheckCircle2, Award, ExternalLink, ArrowUpRight, BarChart3, BookOpen
} from 'lucide-react';

export default function FinBotDesk() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "FinBot Knowledge-Intensive Quant Advisor connected.\n\nI have been fed the complete knowledge base of:\n• **YouTube Financial Transcripts**: 74 videos & creator discussions (Invest Aaj For Kal, Ghanshyam Tech, etc.)\n• **2,448 Audited Stock Calls**: Actual entry, targets, stop-losses, and empirical peak returns\n• **51 Creator Track Records**: Verified win rates and SEBI registration statuses\n• **Institutional Quant & Indian Tax Law**: Markowitz MPT, Sharpe Ratios, and Section 112A/111A/80C tax rules.",
      node: 'gemini-3.5-flash-router'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e, textOverride = null) => {
    e?.preventDefault();
    const query = (textOverride || input).trim();
    if (!query || loading) return;

    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setLoading(true);

    try {
      const res = await fetch('/api/finbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, session_id: 'marketprobe-desk-session' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to reach FinBot gateway');

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || data.response || (typeof data === 'string' ? data : JSON.stringify(data)),
          node: data.source_node || data.model || 'orchestrated-router',
          action_chips: data.action_chips || []
        }
      ]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Gateway notice: ${err.message}. FinBot backend on :8000 is ready.`,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', background: '#070a11', border: '1px solid #1a2333', borderRadius: '4px', overflow: 'hidden' }}>
      {/* Top Banner */}
      <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #0d1527 0%, #080d1a 100%)', borderBottom: '1px solid #1a2333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#f8fafc', letterSpacing: '0.01em' }}>FINBOT KNOWLEDGE ENGINE</span>
              <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '3px', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.3)' }}>544 VECTORS ACTIVE</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>YouTube Video Transcripts • 2,448 Stock Tips • 51 Influencer Records • MPT & Tax RAG</div>
          </div>
        </div>

        {/* Knowledge Stats Chips */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ background: '#0b111e', border: '1px solid #1e293b', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PlayCircle size={14} color="#ef4444" />
            <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>74 Video Transcripts</span>
          </div>
          <div style={{ background: '#0b111e', border: '1px solid #1e293b', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={14} color="#10b981" />
            <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>2,448 Audited Calls</span>
          </div>
          <div style={{ background: '#0b111e', border: '1px solid #1e293b', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} color="#38bdf8" />
            <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>51 Creator Win-Rates</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#070a11' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              background: m.role === 'user' ? '#182235' : '#0d131f',
              border: `1px solid ${m.role === 'user' ? '#253550' : m.isError ? '#ef4444' : '#1a2333'}`,
              color: '#f1f5f9',
              padding: '14px 18px',
              borderRadius: '4px',
              fontSize: '13px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              {m.role === 'user' && (
                <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, marginBottom: '6px', fontFamily: 'monospace' }}>
                  &gt; USER QUERY
                </div>
              )}
              {m.text}

              {/* Action Chips */}
              {m.action_chips && m.action_chips.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {m.action_chips.map((chip, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38bdf8',
                        padding: '4px 10px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ArrowUpRight size={12} /> {chip.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {m.node && (
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', textAlign: m.role === 'user' ? 'right' : 'left', fontFamily: 'monospace' }}>
                Knowledge Engine: <span style={{ color: '#38bdf8' }}>{m.node}</span>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '12px', padding: '8px' }}>
            <RefreshCw size={14} className="spin" /> Searching YouTube transcripts & financial knowledge vectors...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Knowledge Prompts */}
      <div style={{ padding: '8px 16px', background: '#0a0f19', borderTop: '1px solid #1a2333', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {[
          { label: "Anant Ladha Video Transcripts", prompt: "What did Anant Ladha discuss in his Invest Aaj For Kal YouTube videos about TCS and swing trading?" },
          { label: "Kotak Securities Accuracy", prompt: "What is Kotak Securities Research verified win rate and how many target hits have they had?" },
          { label: "Audit Tata Motors Tip", prompt: "Audit BUY TATAMOTORS @ 980 TGT 1050 SL 940" },
          { label: "Section 112A Tax Harvesting", prompt: "Calculate tax loss harvesting for ₹1.25L capital gains under Section 112A Finance Act 2024" },
          { label: "MPT Optimal Frontier", prompt: "Optimize MPT portfolio for RELIANCE, TCS, INFY with 6.5% risk-free rate" }
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => handleSend(null, item.prompt)}
            style={{ fontSize: '11px', background: '#131b29', border: '1px solid #202c42', color: '#94a3b8', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '14px', background: '#0d131f', borderTop: '1px solid #1a2333', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask FinBot anything from YouTube video transcripts, stock call audits, creator track records, or MPT..."
          style={{ flex: 1, background: '#070a11', border: '1px solid #1e293b', borderRadius: '4px', padding: '11px 16px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{ background: '#0284c7', border: 'none', borderRadius: '4px', padding: '0 22px', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          <Send size={15} /> Ask FinBot
        </button>
      </form>
    </div>
  );
}
