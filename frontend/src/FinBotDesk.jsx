import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Cpu,
  RefreshCw,
  PlayCircle,
  Award,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ShieldCheck,
  Database,
} from 'lucide-react';
import MarkdownText from './MarkdownText.jsx';

const QUICK_PROMPTS = [
  {
    label: 'Anant Ladha Video Transcripts',
    category: 'YouTube RAG',
    prompt: 'What did Anant Ladha discuss in his Invest Aaj For Kal YouTube videos about TCS and swing trading?',
  },
  {
    label: 'Kotak Securities Track Record',
    category: 'Creator Audit',
    prompt: 'What is Kotak Securities Research verified win rate and how many target hits have they had?',
  },
  {
    label: 'Top Verified Institutional Desks',
    category: 'Leaderboard',
    prompt: 'Who are the top influencers?',
  },
  {
    label: 'Audit RELIANCE Swing Setup',
    category: 'Trade Audit',
    prompt: 'Audit BUY RELIANCE @ 1378 TGT 1495 SL 1330',
  },
  {
    label: 'Section 112A Tax Harvesting',
    category: 'Tax Engine',
    prompt: 'Calculate tax loss harvesting for ₹1.25L capital gains under Section 112A Finance Act 2024',
  },
  {
    label: 'MPT Efficient Frontier',
    category: 'Portfolio Math',
    prompt: 'Optimize MPT portfolio for RELIANCE, TCS, INFY with 6.5% risk-free rate',
  },
];

export default function FinBotDesk({ onNavigateTab }) {
  const [totalRecs, setTotalRecs] = useState(2463);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text:
        '### MarketProbe FinBot Quant Advisor Online\n' +
        'Grounded across the full verified institutional knowledge graph:\n' +
        '- **YouTube Financial Transcripts**: 74 indexed creator videos & swing-trading transcripts\n' +
        '- **Audited NSE Call Ledger**: Verified entry, target, stop-loss, and tick-replayed outcomes\n' +
        '- **51 Creator & Desk Track Records**: Empirical Bayes win rates & SEBI RA verification\n' +
        '- **Quant & Indian Tax Law**: Markowitz MPT optimization and Section 111A / 112A / 80C rules',
      node: 'gemini-2.5-flash-router',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch('/api/pipeline/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.total_recommendations) setTotalRecs(d.total_recommendations);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e, textOverride = null) => {
    e?.preventDefault();
    const query = (textOverride || input).trim();
    if (!query || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setLoading(true);

    try {
      const res = await fetch('/api/finbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, session_id: 'marketprobe-desk-session' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to reach FinBot gateway');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || data.response || (typeof data === 'string' ? data : JSON.stringify(data)),
          node: data.source_node || data.model || 'orchestrated-router',
          action_chips: data.action_chips || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Gateway notice: ${err.message}. Verify the MarketProbe server on port 8080 is active.`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 h-[calc(100vh-136px)] min-h-[580px]">
      {/* Left Main Chat Desk */}
      <div className="flex flex-col bg-[#0b0f17] border border-[#1b2434] rounded-xl overflow-hidden">
        {/* Top Bar */}
        <div className="px-5 py-3.5 bg-[#0e1420] border-b border-[#1b2434] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/12 border border-sky-500/35 flex items-center justify-center text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-tight">FinBot Knowledge Engine</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  544 VECTORS LIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                FAISS Vector RAG • {totalRecs.toLocaleString('en-IN')} Audited NSE Calls • 51 Tracked Advisors
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded bg-[#06090e] border border-[#1b2434] text-slate-300 flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5 text-rose-400" /> 74 Transcripts
            </span>
            <span className="px-2.5 py-1 rounded bg-[#06090e] border border-[#1b2434] text-slate-300 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> {totalRecs.toLocaleString('en-IN')} Calls
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#06090e]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 border ${
                  m.role === 'user'
                    ? 'bg-[#121c2d] border-sky-500/35 text-slate-100'
                    : m.isError
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                    : 'bg-[#0b0f17] border-[#1b2434] text-slate-100'
                }`}
              >
                {m.role === 'user' ? (
                  <div className="text-[13px] leading-relaxed">{m.text}</div>
                ) : (
                  <MarkdownText content={m.text} />
                )}

                {m.action_chips && m.action_chips.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#1b2434] flex flex-wrap gap-2">
                    {m.action_chips.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => {
                          if (chip.type === 'NAVIGATE_TAB' && onNavigateTab) {
                            onNavigateTab(chip.tab);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/35 text-sky-300 hover:bg-sky-500/20 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ArrowUpRight className="w-3 h-3" /> {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {m.node && (
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Engine: <span className="text-sky-400">{m.node}</span>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sky-400 text-xs font-mono py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Querying FAISS vectors &amp; audited SQLite ledger...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="p-3.5 bg-[#0e1420] border-t border-[#1b2434] flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask FinBot about YouTube transcripts, creator win rates, trade audits, MPT weights, or Sec 112A tax..."
            className="flex-1 bg-[#06090e] border border-[#1b2434] focus:border-sky-500/60 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Ask FinBot
          </button>
        </form>
      </div>

      {/* Right Knowledge Context & Quick Queries Rail */}
      <aside className="bg-[#0b0f17] border border-[#1b2434] rounded-xl p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="border-b border-[#1b2434] pb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Suggested Research Queries</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Click any query to run live retrieval across transcripts, audited calls, and tax/MPT models.
          </p>
        </div>

        <div className="space-y-2">
          {QUICK_PROMPTS.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(null, item.prompt)}
              className="w-full text-left p-2.5 rounded-lg bg-[#06090e] border border-[#1b2434] hover:border-sky-500/45 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-sky-400 mb-1">
                <span>{item.category}</span>
                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="text-xs font-semibold text-slate-100">{item.label}</div>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-[#1b2434] space-y-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Connected Corpus Telemetry</span>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="bg-[#06090e] border border-[#1b2434] rounded p-2">
              <div className="text-[10px] text-slate-500">VECTORS</div>
              <div className="text-sm font-bold text-white">544</div>
            </div>
            <div className="bg-[#06090e] border border-[#1b2434] rounded p-2">
              <div className="text-[10px] text-slate-500">ADVISORS</div>
              <div className="text-sm font-bold text-emerald-400">51</div>
            </div>
          </div>
          <div className="flex items-start gap-1.5 text-[10.5px] text-slate-500 leading-snug pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>Quantitative analysis &amp; empirical verification only. Not SEBI-registered investment advice.</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
