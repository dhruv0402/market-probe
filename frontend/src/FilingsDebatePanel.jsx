import React, { useState, useEffect, useRef } from 'react';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  FileText,
  UploadCloud,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Gavel,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const QUICK_TICKERS = [
  { sym: 'INFY', tag: 'NSE + 20-F ADR' },
  { sym: 'HDFCBANK', tag: 'NSE + 20-F ADR' },
  { sym: 'ICICIBANK', tag: 'NSE + 20-F ADR' },
  { sym: 'AAPL', tag: 'US 10-K' },
  { sym: 'NVDA', tag: 'US 10-K' },
  { sym: 'MSFT', tag: 'US 10-K' },
  { sym: 'RELIANCE', tag: 'NSE PDF/Corpus' },
];

export default function FilingsDebatePanel({ initialTicker = 'INFY', onPushToCouncil }) {
  const defaultSym =
    initialTicker && ['INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'AAPL', 'NVDA', 'MSFT', 'TSLA', 'META'].includes(initialTicker.toUpperCase())
      ? initialTicker.toUpperCase()
      : 'INFY';
  const [ticker, setTicker] = useState(defaultSym);
  const [horizonDays, setHorizonDays] = useState(30);
  const [pdfFile, setPdfFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [debate, setDebate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const loadPreview = async (sym) => {
    const clean = (sym || '').trim().toUpperCase();
    if (!clean) return;
    setPreviewLoading(true);
    try {
      const r = await fetch(`/api/debate/filings/preview?ticker=${encodeURIComponent(clean)}`);
      if (r.ok) {
        setPreview(await r.json());
      }
    } catch {
      // non-fatal preview fetch
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    loadPreview(ticker);
  }, []);

  const runDebate = async (overrideTicker) => {
    const targetSym = (overrideTicker || ticker || 'INFY').trim().toUpperCase();
    if (!targetSym) return;
    setTicker(targetSym);
    setLoading(true);
    setError(null);
    try {
      let resp;
      if (pdfFile) {
        const fd = new FormData();
        fd.append('ticker', targetSym);
        fd.append('horizon_days', String(horizonDays));
        fd.append('filing_pdf', pdfFile);
        resp = await fetch('/api/debate/filings', { method: 'POST', body: fd });
      } else {
        resp = await fetch('/api/debate/filings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: targetSym, horizon_days: horizonDays }),
        });
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setDebate(data);
      setPreview({
        ticker: data.ticker,
        company_name: data.company_name,
        cik: data.cik,
        source_mode: data.source_mode,
        edgar_available: data.edgar_available,
        edgar_browse_url: data.edgar_browse_url,
        nse_disclosure_url: data.nse_disclosure_url,
        latest_primary_filing: data.latest_primary_filing,
        filings: data.filings,
        xbrl_snapshot: data.xbrl_snapshot,
      });
    } catch (e) {
      setError(`Debate execution failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const activeMeta = debate || preview;
  const xbrl = activeMeta?.xbrl_snapshot || {};
  const judge = debate?.cio_judge;

  const rubricChartData = judge
    ? [
        {
          criterion: 'Evidence',
          Bull: judge.bull_scores?.evidence_grounding ?? 0,
          Bear: judge.bear_scores?.evidence_grounding ?? 0,
        },
        {
          criterion: 'Rigor',
          Bull: judge.bull_scores?.financial_rigor ?? 0,
          Bear: judge.bear_scores?.financial_rigor ?? 0,
        },
        {
          criterion: 'Risk Realism',
          Bull: judge.bull_scores?.risk_realism ?? 0,
          Bear: judge.bear_scores?.risk_realism ?? 0,
        },
      ]
    : [];

  const winnerBadge = (winner) => {
    if (winner === 'BULL_WIN')
      return { label: 'BULL COUNSEL PREVAILS', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' };
    if (winner === 'BEAR_WIN')
      return { label: 'BEAR COUNSEL PREVAILS', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40' };
    return { label: 'SPLIT DECISION', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' };
  };

  return (
    <div className="p-4 lg:p-5 space-y-4 overflow-y-auto max-w-[1440px] mx-auto w-full">
      {/* Header & Controls Bar */}
      <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Bull vs. Bear Adversarial Filings Debate &amp; CIO Judge
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                SEC EDGAR XBRL + NSE PDF
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Two opposing AI counsels cross-examine audited 10-K / 20-F XBRL disclosures or uploaded NSE Annual Reports, adjudicated by an independent CIO Judge.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && runDebate()}
              placeholder="Ticker (INFY, AAPL...)"
              className="bg-[#111722] border border-[#1b2434] text-white text-xs font-mono px-3 py-2 rounded w-36 focus:outline-none focus:border-emerald-500/60"
            />
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="bg-[#111722] border border-[#1b2434] text-slate-200 text-xs px-2.5 py-2 rounded"
            >
              <option value={30}>30D Horizon</option>
              <option value={90}>90D Horizon</option>
              <option value={180}>180D Horizon</option>
            </select>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded bg-[#111722] border border-[#1b2434] hover:border-sky-500/50 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
              <span>{pdfFile ? pdfFile.name.slice(0, 18) : 'Attach NSE PDF'}</span>
            </button>
            {pdfFile && (
              <button
                type="button"
                onClick={() => setPdfFile(null)}
                className="text-[11px] text-rose-400 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => runDebate()}
              disabled={loading}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Debating Filings...' : 'Launch Bull vs Bear'}</span>
            </button>
          </div>
        </div>

        {/* Quick-Select Ticker Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#141b27]">
          <span className="text-[11px] text-slate-500 mr-1">Quick Filings:</span>
          {QUICK_TICKERS.map((q) => (
            <button
              key={q.sym}
              type="button"
              onClick={() => {
                setTicker(q.sym);
                loadPreview(q.sym);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                ticker === q.sym
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                  : 'bg-[#111722] border-[#1b2434] text-slate-400 hover:text-white'
              }`}
            >
              {q.sym} <span className="text-[9.5px] opacity-65 ml-0.5">{q.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-2.5 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audited XBRL Financial Strip */}
      <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {activeMeta?.company_name || `${ticker} Filings Snapshot`}
            </span>
            {activeMeta?.cik && (
              <span className="text-[10.5px] font-mono text-slate-400 bg-[#111722] border border-[#1b2434] px-2 py-0.5 rounded">
                CIK {activeMeta.cik}
              </span>
            )}
            {activeMeta?.latest_primary_filing && (
              <span className="text-[10.5px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                {activeMeta.latest_primary_filing.form} · {activeMeta.latest_primary_filing.filing_date}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            {activeMeta?.latest_primary_filing?.url && (
              <a
                href={activeMeta.latest_primary_filing.url}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Primary Filing</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {activeMeta?.edgar_browse_url && (
              <a
                href={activeMeta.edgar_browse_url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                <span>SEC EDGAR</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {!activeMeta?.edgar_available && activeMeta?.nse_disclosure_url && (
              <a
                href={activeMeta.nse_disclosure_url}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>NSE Disclosures</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {previewLoading && !xbrl.revenue_formatted ? (
          <div className="text-xs text-slate-500 py-2">Querying SEC EDGAR XBRL CompanyFacts...</div>
        ) : activeMeta?.edgar_available && xbrl.revenue_formatted ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            <div className="bg-[#111722] border border-[#1b2434] rounded p-2.5">
              <div className="text-[10.5px] text-slate-400">Audited Revenue</div>
              <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
                {xbrl.revenue_formatted}
              </div>
              <div
                className={`text-[11px] font-mono tabular-nums ${
                  (xbrl.revenue_yoy_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {xbrl.revenue_yoy_pct != null ? `${xbrl.revenue_yoy_pct > 0 ? '+' : ''}${xbrl.revenue_yoy_pct}% YoY` : 'FY Reported'}
              </div>
            </div>
            <div className="bg-[#111722] border border-[#1b2434] rounded p-2.5">
              <div className="text-[10.5px] text-slate-400">Net Income &amp; Margin</div>
              <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
                {xbrl.net_income_formatted || '—'}
              </div>
              <div className="text-[11px] font-mono text-sky-300 tabular-nums">
                Net Margin: {xbrl.net_margin_pct != null ? `${xbrl.net_margin_pct}%` : '—'}
              </div>
            </div>
            <div className="bg-[#111722] border border-[#1b2434] rounded p-2.5">
              <div className="text-[10.5px] text-slate-400">Operating Cash Flow</div>
              <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
                {xbrl.operating_cash_flow_formatted || '—'}
              </div>
              <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                OCF / NI: {xbrl.ocf_to_net_income_ratio != null ? `${xbrl.ocf_to_net_income_ratio}x` : '—'}
              </div>
            </div>
            <div className="bg-[#111722] border border-[#1b2434] rounded p-2.5">
              <div className="text-[10.5px] text-slate-400">Cash &amp; Equivalents</div>
              <div className="text-sm font-bold font-mono text-emerald-300 tabular-nums mt-0.5">
                {xbrl.cash_formatted || '—'}
              </div>
              <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                Period: {xbrl.period_end || 'Latest'}
              </div>
            </div>
            <div className="bg-[#111722] border border-[#1b2434] rounded p-2.5">
              <div className="text-[10.5px] text-slate-400">Long-Term Debt</div>
              <div className="text-sm font-bold font-mono text-amber-300 tabular-nums mt-0.5">
                {xbrl.debt_formatted || '—'}
              </div>
              <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                Cash / Debt: {xbrl.cash_to_debt_ratio != null ? `${xbrl.cash_to_debt_ratio}x` : '—'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 bg-[#111722] border border-[#1b2434] rounded p-3 flex flex-wrap items-center justify-between gap-2">
            <span>
              <b className="text-slate-200">{ticker}</b> is an NSE-only equity without an active US ADR CIK. Upload an Annual Report / Concall PDF or launch the debate grounded in MarketProbe&apos;s verified FAISS corpus.
            </span>
          </div>
        )}
      </div>

      {/* Empty Prompt State before Debate Runs */}
      {!debate && !loading && (
        <div className="bg-[#0b0f17] border border-dashed border-[#1b2434] rounded-lg p-8 text-center space-y-3">
          <Scale className="w-8 h-8 text-emerald-400 mx-auto" />
          <div className="text-sm font-bold text-white">
            Ready to Adjudicate {ticker} Corporate Filings
          </div>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Click <b className="text-emerald-300">Launch Bull vs Bear</b> to pit Bull Counsel against Bear Counsel across audited XBRL metrics and primary filing text, scored by the CIO Judge on Evidence Grounding, Financial Rigor, and Risk Realism.
          </p>
          <button
            type="button"
            onClick={() => runDebate(ticker)}
            className="px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run Live Bull vs. Bear Debate on {ticker}</span>
          </button>
        </div>
      )}

      {/* Split-Screen Adversarial Debate Arena */}
      {debate && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* BULL COUNSEL COLUMN */}
            <div className="bg-[#0b0f17] border border-emerald-500/25 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1b2434] pb-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Bull Counsel · Fundamental Growth Thesis
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {debate.bull_counsel?.arguments?.length || 0} Cited Claims
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed bg-[#111722] border border-[#1b2434] rounded p-2.5">
                {debate.bull_counsel?.thesis_summary}
              </p>
              <div className="space-y-2.5">
                {(debate.bull_counsel?.arguments || []).map((arg) => (
                  <div key={arg.id} className="bg-[#111722] border border-[#1b2434] rounded-md p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {arg.id}
                        </span>
                        <span>{arg.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 shrink-0 tabular-nums">
                        {arg.strength_score}/100
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{arg.claim}</p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/25">
                        {arg.filing_ref}
                      </span>
                      {arg.metric_evidence && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0b0f17] text-emerald-300 border border-[#1b2434]">
                          {arg.metric_evidence}
                        </span>
                      )}
                    </div>
                    {arg.quote && (
                      <div className="text-[11px] text-slate-400 italic border-l-2 border-emerald-500/40 pl-2 mt-1">
                        &ldquo;{arg.quote}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bull Rebuttal Round */}
              {(debate.bull_counsel?.rebuttals || []).length > 0 && (
                <div className="pt-2 border-t border-[#1b2434] space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    Round 3 · Bull Rebuttals to Bear Risk Points
                  </div>
                  {debate.bull_counsel.rebuttals.map((rb, i) => (
                    <div key={i} className="bg-emerald-500/5 border border-emerald-500/20 rounded p-2.5 text-xs text-slate-300">
                      <span className="font-mono text-[10px] text-emerald-400 mr-1.5">
                        Re: {rb.target_bear_id}
                      </span>
                      {rb.rebuttal}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BEAR COUNSEL COLUMN */}
            <div className="bg-[#0b0f17] border border-rose-500/25 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1b2434] pb-2.5">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Bear Counsel · Forensic Risk Cross-Exam
                  </span>
                </div>
                <span className="text-[11px] font-mono text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">
                  {debate.bear_counsel?.arguments?.length || 0} Risk Vectors
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed bg-[#111722] border border-[#1b2434] rounded p-2.5">
                {debate.bear_counsel?.thesis_summary}
              </p>
              <div className="space-y-2.5">
                {(debate.bear_counsel?.arguments || []).map((arg) => (
                  <div key={arg.id} className="bg-[#111722] border border-[#1b2434] rounded-md p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          {arg.id}
                        </span>
                        <span>{arg.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-rose-400 shrink-0 tabular-nums">
                        {arg.severity_score}/100
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{arg.claim}</p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {arg.rebuts_bull_point && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
                          Counters {arg.rebuts_bull_point}
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/25">
                        {arg.filing_ref}
                      </span>
                      {arg.metric_evidence && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0b0f17] text-rose-300 border border-[#1b2434]">
                          {arg.metric_evidence}
                        </span>
                      )}
                    </div>
                    {arg.quote && (
                      <div className="text-[11px] text-slate-400 italic border-l-2 border-rose-500/40 pl-2 mt-1">
                        &ldquo;{arg.quote}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CIO DEBATE JUDGE SCORECARD */}
          {judge && (
            <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2434] pb-3">
                <div className="flex items-center gap-2.5">
                  <Gavel className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    CIO Independent Judge Scorecard
                  </span>
                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                      winnerBadge(judge.winner).cls
                    }`}
                  >
                    {winnerBadge(judge.winner).label}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#111722] border border-[#1b2434] text-slate-200 tabular-nums">
                    Council Filing Tilt:{' '}
                    <b
                      className={
                        judge.filing_conviction_delta > 0
                          ? 'text-emerald-400'
                          : judge.filing_conviction_delta < 0
                          ? 'text-rose-400'
                          : 'text-amber-300'
                      }
                    >
                      {judge.filing_conviction_delta > 0 ? '+' : ''}
                      {judge.filing_conviction_delta} pts
                    </b>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-mono text-slate-500">
                    {(debate.llm_nodes_used || []).join(' · ')} ({debate.latency_ms}ms)
                  </span>
                  {onPushToCouncil && (
                    <button
                      type="button"
                      onClick={() =>
                        onPushToCouncil({
                          ticker: debate.ticker,
                          directive: `Incorporate CIO Filings Debate verdict (${judge.winner}, filing tilt ${
                            judge.filing_conviction_delta > 0 ? '+' : ''
                          }${judge.filing_conviction_delta} pts): ${judge.key_deciding_factor || judge.verdict_headline}`,
                        })
                      }
                      className="px-3.5 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Push Filing Bias to 5-Agent Council</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-5 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rubricChartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#141b27" />
                      <XAxis dataKey="criterion" interval={0} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10.5 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111722',
                          borderColor: '#1b2434',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Bull" name="Bull Counsel" fill="#10b981" barSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey="Bear" name="Bear Counsel" fill="#f43f5e" barSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:col-span-7 space-y-2.5">
                  <div className="text-sm font-bold text-white">{judge.verdict_headline}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{judge.institutional_memo}</p>
                  {judge.key_deciding_factor && (
                    <div className="bg-[#111722] border border-[#1b2434] rounded p-2.5 text-xs text-slate-300">
                      <span className="text-sky-400 font-semibold mr-1.5">Key Deciding Filing Factor:</span>
                      {judge.key_deciding_factor}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{debate.sebi_disclaimer}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
