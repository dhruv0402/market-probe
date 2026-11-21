import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Radar,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';

function fmtNotional(val, currency = 'USD') {
  if (val == null) return '—';
  const abs = Math.abs(Number(val));
  const sign = val < 0 ? '-' : '';
  if (currency === 'INR') {
    if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)} L`;
    return `${sign}₹${abs.toLocaleString('en-IN')}`;
  }
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

const DIV_STYLES = {
  FINFLUENCER_TRAP: {
    cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    border: 'border-rose-500/35',
  },
  SMART_MONEY_CONFIRMED: {
    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    border: 'border-emerald-500/35',
  },
  STEALTH_ACCUMULATION: {
    cls: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
    border: 'border-sky-500/35',
  },
  INSIDER_DISTRIBUTION: {
    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    border: 'border-amber-500/35',
  },
  NEUTRAL_FLOW: {
    cls: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
    border: 'border-[#1b2434]',
  },
};

export default function InsiderClusterRadar({ onAuditInCouncil }) {
  const [market, setMarket] = useState('ALL');
  const [windowDays, setWindowDays] = useState(30);
  const [minInsiders, setMinInsiders] = useState(2);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [syncBanner, setSyncBanner] = useState(null);
  const [expandedTicker, setExpandedTicker] = useState(null);
  const csvInputRef = useRef(null);

  const handleImportPitCsv = async (file) => {
    if (!file) return;
    setImportingCsv(true);
    setSyncBanner(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/insiders/import-sebi-pit', { method: 'POST', body: fd });
      if (r.ok) {
        const res = await r.json();
        setSyncBanner(
          `NSE SEBI PIT CSV import complete: parsed ${res.open_market_parsed || 0} open-market trades (${res.newly_inserted || 0} new, ${res.skipped_non_market || 0} non-market/ESOPs excluded).`
        );
        await loadClusters(market, windowDays, minInsiders);
      }
    } catch {
      setSyncBanner('Failed to parse NSE SEBI PIT CSV file.');
    } finally {
      setImportingCsv(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const loadClusters = async (mkt = market, win = windowDays, minIn = minInsiders) => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/insiders/clusters?market=${encodeURIComponent(mkt)}&window_days=${win}&min_insiders=${minIn}`
      );
      if (r.ok) {
        setData(await r.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters(market, windowDays, minInsiders);
  }, [market, windowDays, minInsiders]);

  const handleSyncSec = async () => {
    setSyncing(true);
    setSyncBanner(null);
    try {
      const r = await fetch('/api/insiders/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickers: ['AAPL', 'NVDA', 'MSFT', 'META', 'INTC', 'AMD'],
          max_filings_per_ticker: 6,
        }),
      });
      if (r.ok) {
        const res = await r.json();
        setSyncBanner(
          `Live SEC Form 4 XML sync complete: scanned ${res.tickers_scanned?.length || 0} issuers, parsed ${res.total_open_market_parsed || 0} open-market Code P/S filings (${res.newly_inserted || 0} new).`
        );
        await loadClusters(market, windowDays, minInsiders);
      }
    } catch {
      setSyncBanner('SEC EDGAR sync could not reach data.sec.gov — showing persisted local ledger.');
    } finally {
      setSyncing(false);
    }
  };

  const summary = data?.summary || {};
  const clusters = data?.clusters || [];
  const alerts = data?.divergence_alerts || [];
  const recentTx = data?.recent_transactions || [];

  return (
    <div className="space-y-4">
      {/* Page Header & Controls */}
      <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Insider Cluster Buy Radar &amp; Smart-Money Divergence
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                SEC FORM 4 XML (CODE P/S) + SEBI PIT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Filters strictly to open-market executive buys &amp; sales (excluding RSU awards/option exercises) and cross-joins against MarketProbe&apos;s verified finfluencer call ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleImportPitCsv(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              disabled={importingCsv}
              className="px-3 py-2 rounded bg-[#111722] border border-[#1b2434] hover:border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Upload CF-Insider-Trading-equities-*.csv downloaded from NSE India"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{importingCsv ? 'Importing PIT CSV...' : 'Import NSE PIT CSV'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncSec}
              disabled={syncing}
              className="px-3.5 py-2 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing Live Form 4 XML...' : 'Sync Live SEC Form 4'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#141b27]">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Markets' },
              { id: 'IN_SEBI_PIT', label: 'India SEBI PIT' },
              { id: 'US_SEC', label: 'US SEC Form 4' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMarket(m.id)}
                className={`px-3 py-1 rounded text-xs font-semibold border cursor-pointer ${
                  market === m.id
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#111722] border-[#1b2434] text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Window:</span>
            {[14, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setWindowDays(d)}
                className={`px-2.5 py-1 rounded font-mono border cursor-pointer ${
                  windowDays === d
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                    : 'bg-[#111722] border-[#1b2434] text-slate-400 hover:text-white'
                }`}
              >
                {d}D
              </button>
            ))}
            <select
              value={minInsiders}
              onChange={(e) => setMinInsiders(Number(e.target.value))}
              className="bg-[#111722] border border-[#1b2434] text-slate-200 text-xs px-2.5 py-1 rounded ml-1"
            >
              <option value={2}>Min 2 Buyers</option>
              <option value={3}>Min 3 Buyers</option>
            </select>
          </div>
        </div>

        {syncBanner && (
          <div className="bg-sky-500/10 border border-sky-500/30 rounded px-3 py-2 text-xs text-sky-200">
            {syncBanner}
          </div>
        )}
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3">
          <div className="text-[11px] text-slate-400">Active Buy Clusters</div>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
            {summary.active_buy_clusters ?? 0}
          </div>
        </div>
        <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3">
          <div className="text-[11px] text-slate-400">Finfluencer Traps</div>
          <div className="text-xl font-bold font-mono text-rose-400 tabular-nums mt-0.5">
            {summary.finfluencer_traps ?? 0}
          </div>
        </div>
        <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3">
          <div className="text-[11px] text-slate-400">Smart-Money Confirmed</div>
          <div className="text-xl font-bold font-mono text-emerald-300 tabular-nums mt-0.5">
            {summary.smart_money_confirmed ?? 0}
          </div>
        </div>
        <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3">
          <div className="text-[11px] text-slate-400">Stealth Accumulation</div>
          <div className="text-xl font-bold font-mono text-sky-300 tabular-nums mt-0.5">
            {summary.stealth_accumulation ?? 0}
          </div>
        </div>
        <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3">
          <div className="text-[11px] text-slate-400">Open-Market Filings ({windowDays}D)</div>
          <div className="text-xl font-bold font-mono text-white tabular-nums mt-0.5">
            {summary.total_transactions_in_window ?? 0}
          </div>
        </div>
      </div>

      {/* Smart-Money vs. Finfluencer Divergence Alert Strip */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Smart-Money vs. Finfluencer Divergence Alerts</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 6).map((item) => {
              const st = DIV_STYLES[item.divergence?.code] || DIV_STYLES.NEUTRAL_FLOW;
              const finf = item.finfluencer_consensus || {};
              return (
                <div
                  key={`${item.market}-${item.ticker}`}
                  className={`bg-[#0b0f17] border ${st.border} rounded-lg p-3.5 flex flex-col justify-between gap-2.5`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-white">{item.ticker}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#111722] text-slate-400 border border-[#1b2434]">
                          {item.market === 'IN_SEBI_PIT' ? 'NSE PIT' : 'SEC F4'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${st.cls}`}>
                        {item.divergence?.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.divergence?.detail}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#141b27] text-[11px]">
                    <div className="font-mono text-slate-400 tabular-nums">
                      Net:{' '}
                      <b className={item.net_insider_value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {fmtNotional(item.net_insider_value, item.currency)}
                      </b>
                      {finf.total_calls > 0 && (
                        <span className="ml-2 text-sky-300">
                          · {finf.bullish_pct}% Crowd ({finf.total_calls})
                        </span>
                      )}
                    </div>
                    {onAuditInCouncil && (
                      <button
                        type="button"
                        onClick={() =>
                          onAuditInCouncil({
                            ticker: item.ticker,
                            action: item.net_insider_value >= 0 ? 'BUY' : 'SELL',
                            creator_name: 'Insider Cluster Radar',
                          })
                        }
                        className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Audit</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expandable Multi-Executive Cluster Buy Table */}
      <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1b2434] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Multi-Executive Open-Market Cluster Buys ({clusters.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            C-Suite 2x Weighted · Click any row to inspect individual filings
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Scanning insider cluster filings...</div>
        ) : clusters.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No multi-executive buy clusters match the active filter. Try expanding the window to 90D or clicking Sync Live SEC Form 4.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#111722] text-slate-400 border-b border-[#1b2434] text-[11px] uppercase font-mono">
                  <th className="py-2.5 px-3">Equity</th>
                  <th className="py-2.5 px-3">Insiders</th>
                  <th className="py-2.5 px-3">Buy Notional</th>
                  <th className="py-2.5 px-3">Cluster Score</th>
                  <th className="py-2.5 px-3">Finfluencer Consensus</th>
                  <th className="py-2.5 px-3">Divergence Verdict</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141b27]">
                {clusters.map((c) => {
                  const isOpen = expandedTicker === c.ticker;
                  const st = DIV_STYLES[c.divergence?.code] || DIV_STYLES.NEUTRAL_FLOW;
                  const finf = c.finfluencer_consensus || {};
                  return (
                    <React.Fragment key={`${c.market}-${c.ticker}`}>
                      <tr
                        onClick={() => setExpandedTicker(isOpen ? null : c.ticker)}
                        className="hover:bg-[#111722]/70 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {isOpen ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <div>
                              <div className="font-bold font-mono text-white">{c.ticker}</div>
                              <div className="text-[10.5px] text-slate-400">
                                {c.company_name} ·{' '}
                                <span className="text-sky-400">
                                  {c.market === 'IN_SEBI_PIT' ? 'SEBI PIT' : 'SEC Form 4'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-emerald-300 tabular-nums">
                            {c.distinct_buyers} Buyers
                          </div>
                          <div className="text-[10.5px] text-slate-400">
                            {c.csuite_buyers_count} C-Suite / Promoter
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-white tabular-nums">
                          {fmtNotional(c.total_buy_value, c.currency)}
                          <div className="text-[10px] text-slate-500 font-normal">
                            Latest: {c.latest_transaction_date}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[#1b2434] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400"
                                style={{ width: `${c.cluster_conviction_score}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-emerald-300 tabular-nums">
                              {c.cluster_conviction_score}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums">
                          {finf.total_calls > 0 ? (
                            <div>
                              <span className="text-sky-300 font-bold">{finf.bullish_pct}% BUY</span>
                              <span className="text-slate-500 ml-1">({finf.total_calls} calls)</span>
                            </div>
                          ) : (
                            <span className="text-slate-500">Low Retail Coverage</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10.5px] font-mono px-2 py-0.5 rounded border ${st.cls}`}>
                            {c.divergence?.label}
                          </span>
                        </td>
                        <td
                          className="py-3 px-3 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-2">
                            {c.latest_filing_url && (
                              <a
                                href={c.latest_filing_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-sky-300 p-1"
                                title="View Primary Filing"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {onAuditInCouncil && (
                              <button
                                type="button"
                                onClick={() =>
                                  onAuditInCouncil({
                                    ticker: c.ticker,
                                    action: 'BUY',
                                    creator_name: 'Insider Cluster Radar',
                                  })
                                }
                                className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25 text-[11px] font-semibold cursor-pointer"
                              >
                                Audit in Council
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-[#080c13]">
                          <td colSpan={7} className="p-3.5 border-t border-[#141b27]">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                              Individual Verified Insider Disclosures — {c.ticker}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {(c.transactions || []).map((tx, idx) => (
                                <div
                                  key={idx}
                                  className="bg-[#111722] border border-[#1b2434] rounded p-2.5 flex items-center justify-between gap-2 text-[11.5px]"
                                >
                                  <div>
                                    <div className="font-semibold text-white flex items-center gap-1.5">
                                      {tx.transaction_code === 'P' ? (
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                                      )}
                                      <span>{tx.insider_name}</span>
                                    </div>
                                    <div className="text-[10.5px] text-slate-400">
                                      {tx.insider_role} · {tx.transaction_date}
                                    </div>
                                  </div>
                                  <div className="text-right font-mono tabular-nums">
                                    <div
                                      className={
                                        tx.transaction_code === 'P'
                                          ? 'text-emerald-300 font-bold'
                                          : 'text-rose-300 font-bold'
                                      }
                                    >
                                      {tx.transaction_code === 'P' ? 'OPEN BUY' : 'OPEN SALE'} ·{' '}
                                      {fmtNotional(tx.total_value, tx.currency)}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {Number(tx.shares).toLocaleString()} sh @ {tx.price}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Open-Market Form 4 / SEBI PIT Tape */}
      <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Recent Open-Market Filings Ledger (Code P &amp; S Only)
          </span>
          <span className="text-[10.5px] font-mono text-slate-500">
            Showing {Math.min(12, recentTx.length)} of {recentTx.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {recentTx.slice(0, 12).map((tx, i) => (
            <div
              key={i}
              className="bg-[#111722] border border-[#1b2434] rounded p-2.5 flex items-center justify-between gap-2 text-[11px]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-white">{tx.ticker}</span>
                  <span
                    className={`font-mono text-[9.5px] px-1.5 py-0.5 rounded ${
                      tx.transaction_code === 'P'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {tx.transaction_code === 'P' ? 'BUY (P)' : 'SELL (S)'}
                  </span>
                </div>
                <div className="text-slate-300 truncate mt-0.5">{tx.insider_name}</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {tx.insider_role} · {tx.transaction_date}
                </div>
              </div>
              <div className="text-right font-mono tabular-nums shrink-0">
                <div className="text-white font-bold">{fmtNotional(tx.total_value, tx.currency)}</div>
                {tx.filing_url && (
                  <a
                    href={tx.filing_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-sky-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Filing</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{data?.sebi_disclaimer}</span>
        </div>
      </div>
    </div>
  );
}
