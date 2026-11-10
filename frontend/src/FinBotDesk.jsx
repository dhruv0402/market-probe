import React, { useState } from 'react';
import { Bot, Send, ShieldAlert, Cpu, Sparkles, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

export default function FinBotDesk() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'FinBot Institutional Quantitative Advisor connected. Ask any portfolio risk, asset allocation, modern portfolio theory (MPT), or Indian tax-loss harvesting question.',
      node: 'gemini-3.5-flash'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/finbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, session_id: 'marketprobe-client' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to reach FinBot gateway');

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || data.response || 'No response returned.',
          node: data.source_node || data.model || 'orchestrated-router'
        }
      ]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Gateway Warning: ${err.message}. FinBot backend can be booted on :8000 via FinBot launcher.`,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', background: '#0b0f17', border: '1px solid #1a2333', borderRadius: '4px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: '#0f172a', borderBottom: '1px solid #1a2333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #0284c7', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#f8fafc', letterSpacing: '0.02em' }}>FINBOT QUANTITATIVE ADVISOR</span>
              <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '2px 6px', borderRadius: '2px', fontWeight: 600, border: '1px solid rgba(34, 197, 94, 0.3)' }}>ORCHESTRATED RAG</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Multi-Node Load Balancer • Gemini 3.5 Flash • Vector RAG • Indian SEBI Guardrails</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#070a10' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              background: m.role === 'user' ? '#1e293b' : '#0f172a',
              border: `1px solid ${m.role === 'user' ? '#334155' : m.isError ? '#ef4444' : '#1e293b'}`,
              color: '#f1f5f9',
              padding: '14px 18px',
              borderRadius: '4px',
              fontSize: '13px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              {m.text}
            </div>
            {m.node && (
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                Routing Engine: <code style={{ color: '#38bdf8' }}>{m.node}</code>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '12px' }}>
            <RefreshCw size={14} className="spin" /> Orchestrating financial intelligence...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div style={{ padding: '8px 16px', background: '#0f172a', borderTop: '1px solid #1a2333', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {[
          'roadmap to become a financial analhyst like you',
          'Calculate tax harvesting for TCS with ₹1.2L capital gains',
          'Optimize MPT portfolio for RELIANCE, TCS, INFY with 6.5% risk-free'
        ].map((prompt, i) => (
          <button
            key={i}
            onClick={() => setInput(prompt)}
            style={{ fontSize: '11px', background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '4px 10px', borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '14px', background: '#0b0f17', borderTop: '1px solid #1a2333', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask FinBot about portfolio modeling, SEBI compliance, career roadmap, or tax optimization..."
          style={{ flex: 1, background: '#131c2e', border: '1px solid #1e293b', borderRadius: '4px', padding: '10px 14px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{ background: '#0284c7', border: 'none', borderRadius: '4px', padding: '0 20px', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Send size={15} /> Send
        </button>
      </form>
    </div>
  );
}
