import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  UploadCloud,
  Activity,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  FileAudio,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  MessageSquareWarning,
  History,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const REGIME_STYLES = {
  ELEVATED_DEFENSIVE_STRESS: {
    label: 'Elevated Defensive Stress',
    cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  },
  MODERATE_QA_TENSION: {
    label: 'Moderate Q&A Tension',
    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  },
  COMPOSED_HIGH_CLARITY: {
    label: 'Composed High Clarity',
    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  },
};

export default function VocalStressPanel({ onSendSignalToCouncil }) {
  const [ticker, setTicker] = useState('INFY');
  const [earningsDate, setEarningsDate] = useState('2026-01-16');
  const [qaSplitSec, setQaSplitSec] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [samples, setSamples] = useState([]);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const loadHistory = async () => {
    try {
      const r = await fetch('/api/audio/stress-history?limit=12');
      if (r.ok) {
        const d = await r.json();
        setSamples(d.samples || []);
        setHistory(d.history || []);
      }
    } catch {
      // ignore
    }
  };

  const runSample = async (sampleId) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/audio/stress-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sample_id: sampleId }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setResult(d);
      setTicker(d.ticker);
      await loadHistory();
    } catch (e) {
      setError(`Vocal stress analysis failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    runSample('infy_q3_concall');
  }, []);

  const runCustomAudit = async () => {
    if (!audioFile && !transcriptText.trim()) {
      setError('Upload a .wav / .mp3 / .m4a earnings call clip or paste a Q&A transcript first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let resp;
      if (audioFile) {
        const fd = new FormData();
        fd.append('ticker', ticker || 'INFY');
        fd.append('earnings_date', earningsDate || '');
        if (qaSplitSec) fd.append('qa_split_sec', qaSplitSec);
        if (transcriptText.trim()) fd.append('transcript_text', transcriptText.trim());
        fd.append('audio_file', audioFile);
        resp = await fetch('/api/audio/stress-audit', { method: 'POST', body: fd });
      } else {
        resp = await fetch('/api/audio/stress-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker: ticker || 'INFY',
            earnings_date: earningsDate || null,
            transcript_text: transcriptText.trim(),
          }),
        });
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setResult(await resp.json());
      await loadHistory();
    } catch (e) {
      setError(`Analysis error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const regimeMeta = REGIME_STYLES[result?.stress_regime] || REGIME_STYLES.MODERATE_QA_TENSION;
  const deltas = result?.acoustic_biomarkers?.deltas || {};
  const ling = result?.linguistic_forensics || {};
  const drift = result?.post_call_drift || {};
  const timeline = result?.timeline || [];
  const qaBoundaryPt = timeline.find((p) => p.phase === 'Q&A');

  return (
    <div className="space-y-4">
      {/* Top Sample & Audio Upload Card */}
      <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Earnings Call Vocal Stress &amp; Executive Hedging Lab
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                LIBROSA F0/JITTER + GEMINI TRANSCRIBE + FINBERT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Measures speaker-normalized acoustic shift (pitch F0 variance, vocal jitter, hesitation pause density) and linguistic hedging between Prepared Remarks and Analyst Q&amp;A.
            </p>
          </div>
        </div>

        {/* Quick-Load Sample Profiles */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#141b27]">
          <span className="text-[11px] text-slate-500 mr-1">Verifiable Concall Samples:</span>
          {[
            { sample_id: 'infy_q3_concall', ticker: 'INFY', short: 'Q3 FY26 Concall' },
            { sample_id: 'reliance_o2c_briefing', ticker: 'RELIANCE', short: 'O2C & Retail Briefing' },
            { sample_id: 'nvda_datacenter_qa', ticker: 'NVDA', short: 'Data Center Q&A' },
          ].map((s) => (
            <button
              key={s.sample_id}
              type="button"
              disabled={loading}
              onClick={() => runSample(s.sample_id)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono border cursor-pointer ${
                result?.ticker === s.ticker && result?.input_mode === 'SAMPLE_VERIFIED_SIGNAL'
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-semibold'
                  : 'bg-[#111722] border-[#1b2434] text-slate-300 hover:text-white'
              }`}
            >
              {s.ticker} · {s.short}
            </button>
          ))}
        </div>

        {/* Custom Audio Upload / Transcript Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-2">
          <div className="lg:col-span-5 bg-[#111722] border border-dashed border-[#243044] rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <FileAudio className="w-3.5 h-3.5 text-sky-400" />
                <span>Upload Earnings Audio (.wav, .mp3, .m4a)</span>
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".wav,.mp3,.m4a,.mp4,.ogg,.webm"
                className="hidden"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-2.5 py-1 rounded bg-[#0b0f17] border border-[#1b2434] hover:border-sky-500/50 text-sky-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <UploadCloud className="w-3 h-3" />
                <span>{audioFile ? 'Change File' : 'Choose Audio'}</span>
              </button>
            </div>
            {audioFile && (
              <div className="text-[11px] font-mono text-emerald-300 truncate">
                Selected: {audioFile.name} ({(audioFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Ticker"
                className="bg-[#0b0f17] border border-[#1b2434] rounded px-2 py-1.5 text-xs font-mono text-white"
              />
              <input
                type="date"
                value={earningsDate}
                onChange={(e) => setEarningsDate(e.target.value)}
                className="bg-[#0b0f17] border border-[#1b2434] rounded px-2 py-1.5 text-xs font-mono text-slate-200"
              />
              <input
                type="number"
                value={qaSplitSec}
                onChange={(e) => setQaSplitSec(e.target.value)}
                placeholder="Q&A sec"
                className="bg-[#0b0f17] border border-[#1b2434] rounded px-2 py-1.5 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <textarea
              rows={3}
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Optional: paste Prepared Remarks + [QA_START] + Analyst Q&A transcript (or leave blank when uploading audio — Gemini Flash will transcribe automatically)."
              className="w-full h-full bg-[#111722] border border-[#1b2434] rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          <div className="lg:col-span-2 flex flex-col justify-between gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={runCustomAudit}
              className="w-full flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer py-2.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing...' : 'Run Forensics'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded px-3 py-2 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Dashboard */}
      {result && (
        <>
          {/* Composite Biomarkers Strip */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
            <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3">
              <div className="text-[10.5px] text-slate-400">Composite Stress</div>
              <div className="text-xl font-bold font-mono text-white tabular-nums mt-0.5">
                {result.composite_stress_score}
                <span className="text-xs text-slate-500">/100</span>
              </div>
              <span className={`inline-block mt-1 text-[9.5px] font-mono px-1.5 py-0.5 rounded border ${regimeMeta.cls}`}>
                {regimeMeta.label}
              </span>
            </div>
            <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3">
              <div className="text-[10.5px] text-slate-400">Pitch F0 Var Shift</div>
              <div className="text-lg font-bold font-mono text-amber-300 tabular-nums mt-0.5">
                {deltas.f0_variance_delta_pct != null
                  ? `${deltas.f0_variance_delta_pct > 0 ? '+' : ''}${deltas.f0_variance_delta_pct}%`
                  : '—'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Q&amp;A vs Prepared</div>
            </div>
            <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3">
              <div className="text-[10.5px] text-slate-400">Vocal Jitter Delta</div>
              <div className="text-lg font-bold font-mono text-rose-300 tabular-nums mt-0.5">
                {deltas.jitter_delta_pct != null
                  ? `${deltas.jitter_delta_pct > 0 ? '+' : ''}${deltas.jitter_delta_pct}%`
                  : '—'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Pitch Perturbation</div>
            </div>
            <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3">
              <div className="text-[10.5px] text-slate-400">Hesitation Pause Shift</div>
              <div className="text-lg font-bold font-mono text-sky-300 tabular-nums mt-0.5">
                {deltas.pause_hesitation_delta_pct != null
                  ? `${deltas.pause_hesitation_delta_pct > 0 ? '+' : ''}${deltas.pause_hesitation_delta_pct}%`
                  : '—'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Silence Density</div>
            </div>
            <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3">
              <div className="text-[10.5px] text-slate-400">Q&amp;A Sentiment Drop</div>
              <div className="text-lg font-bold font-mono text-white tabular-nums mt-0.5">
                {ling.prepared_polarity != null ? `${ling.prepared_polarity} → ${ling.qa_polarity}` : '—'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{result.sentiment_engine}</div>
            </div>
            <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3">
              <div className="text-[10.5px] text-slate-400">Post-Call Drift (T+5)</div>
              <div
                className={`text-lg font-bold font-mono tabular-nums mt-0.5 flex items-center gap-1 ${
                  (drift.t_plus_5_return_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {drift.t_plus_5_return_pct != null ? (
                  <>
                    {drift.t_plus_5_return_pct >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                      {drift.t_plus_5_return_pct > 0 ? '+' : ''}
                      {drift.t_plus_5_return_pct}%
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500 text-sm">Pending</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                T+1: {drift.t_plus_1_return_pct != null ? `${drift.t_plus_1_return_pct > 0 ? '+' : ''}${drift.t_plus_1_return_pct}%` : '—'}
              </div>
            </div>
          </div>

          {/* Prepared vs Q&A Timeline Chart + Evasive Excerpts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>
                    {result.call_title} — Prepared Remarks vs. Analyst Q&amp;A Stress Curve
                  </span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {result.duration_sec ? `${result.duration_sec}s · Q&A @ ${result.qa_split_sec}s` : 'Transcript Mode'}
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline} margin={{ top: 20, right: 14, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="vocalStressGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.38} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#141b27" />
                    <XAxis
                      dataKey="time_sec"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`}
                      stroke="#64748b"
                      tick={{ fontSize: 10.5 }}
                    />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10.5 }} />
                    <Tooltip
                      labelFormatter={(sec) => `Time: ${Number(sec).toFixed(1)}s`}
                      contentStyle={{
                        backgroundColor: '#111722',
                        borderColor: '#1b2434',
                        fontSize: '11px',
                      }}
                    />
                    {result.qa_split_sec > 0 && (
                      <ReferenceLine
                        x={result.qa_split_sec}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        label={{ value: 'Q&A Start', fill: '#f59e0b', fontSize: 10.5, position: 'top' }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="vocal_stress"
                      name="Vocal Stress Index (0-100)"
                      stroke="#f43f5e"
                      fill="url(#vocalStressGrad)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#0b0f17] border border-[#1b2434] rounded-lg p-4 flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <MessageSquareWarning className="w-4 h-4" />
                    <span>Detected Evasive / Hedging Excerpts ({ling.hedging_hits_count ?? 0})</span>
                  </span>
                  <span className="text-[10.5px] font-mono text-slate-400">
                    Density: {ling.hedging_density_per_100w ?? 0}/100w
                  </span>
                </div>

                {(ling.evasive_excerpts || []).length > 0 ? (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {ling.evasive_excerpts.map((ex, i) => (
                      <div key={i} className="bg-[#111722] border border-[#1b2434] rounded p-2.5 space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {(ex.all_phrases || [ex.phrase]).map((ph, j) => (
                            <span
                              key={j}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            >
                              {ph}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11.5px] text-slate-300 leading-relaxed">&ldquo;{ex.excerpt}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 bg-[#111722] border border-[#1b2434] rounded p-3">
                    No high-evasion corporate hedging idioms detected in this transcript segment.
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-[#141b27]">
                {onSendSignalToCouncil && (
                  <button
                    type="button"
                    onClick={() =>
                      onSendSignalToCouncil({
                        ticker: result.ticker,
                        directive: `Incorporate Earnings Call Vocal Stress Audit (${result.composite_stress_score}/100, ${result.stress_regime}, Q&A sentiment ${ling.prepared_polarity} -> ${ling.qa_polarity}, ${ling.hedging_hits_count} hedging flags) into Council risk sizing.`,
                      })
                    }
                    className="w-full py-2 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Send Vocal Forensics Signal to 5-Agent Council</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{result.sebi_disclaimer}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Persisted Stress History */}
      {history.length > 0 && (
        <div className="bg-[#0b0f17] border border-[#1b2434] rounded-lg p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Persisted Stress-vs-Drift Audit Log ({history.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11.5px] border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-[#1b2434] font-mono text-[10.5px]">
                  <th className="py-1.5 px-2">Ticker</th>
                  <th className="py-1.5 px-2">Call</th>
                  <th className="py-1.5 px-2">Stress Score</th>
                  <th className="py-1.5 px-2">Acoustic / Ling</th>
                  <th className="py-1.5 px-2">T+1 / T+5 Drift</th>
                  <th className="py-1.5 px-2">Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141b27]">
                {history.slice(0, 6).map((row) => (
                  <tr key={row.id} className="text-slate-300">
                    <td className="py-1.5 px-2 font-mono font-bold text-white">{row.ticker}</td>
                    <td className="py-1.5 px-2 truncate max-w-[240px]">{row.call_title}</td>
                    <td className="py-1.5 px-2 font-mono font-bold tabular-nums">{row.composite_stress_score}/100</td>
                    <td className="py-1.5 px-2 font-mono text-slate-400 tabular-nums">
                      {row.acoustic_shift_score} / {row.sentiment_drop_score}
                    </td>
                    <td className="py-1.5 px-2 font-mono tabular-nums">
                      {row.t_plus_1_return_pct != null ? `${row.t_plus_1_return_pct > 0 ? '+' : ''}${row.t_plus_1_return_pct}%` : '—'} /{' '}
                      {row.t_plus_5_return_pct != null ? `${row.t_plus_5_return_pct > 0 ? '+' : ''}${row.t_plus_5_return_pct}%` : '—'}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-[10px] text-slate-500">{row.transcription_node}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
