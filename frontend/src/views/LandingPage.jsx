import React, { useEffect, useState } from 'react';
import {
  Activity, PlayCircle, ShieldCheck, Trophy, Calculator,
  CheckCircle2, Rss, Zap, Database, TrendingUp, TrendingDown,
  Layers, Sparkles, ArrowRight, Lock, Users, Scale, Gavel,
  Mic, FileText, Radio, ShieldAlert,
} from 'lucide-react';
import { LiveTape, TerminalStatusIndicator } from './ChromeAndModals.jsx';
import { api } from '../lib/apiClient.js';

/* ---------------------------------- LANDING PAGE (v1.0) ---------------------------------- */
export default function LandingPage({ isAuthenticated = false, onOpenAuth, onEnterTerminal }) {
  const [previewTab, setPreviewTab] = useState('COUNCIL');
  const [health, setHealth] = useState(null);
  const [nseIndices, setNseIndices] = useState(null);

  useEffect(() => {
    api('/system/data-health').then(setHealth).catch(() => {});
    api('/market/indices').then(setNseIndices).catch(() => {});
  }, []);

  const totalRecs = health?.ledger?.total_recommendations ?? 2281;
  const verifiedPct = health?.ledger?.verified_primary_pct ?? 97.4;
  const anomalies = health?.ledger?.anomalies_remaining ?? 0;

  const handleTerminalAction = (destTab = 'TERMINAL') => {
    if (isAuthenticated && onEnterTerminal) {
      onEnterTerminal(destTab);
    } else {
      onOpenAuth('login');
    }
  };

  return (
    <div className="landing-shell">
      <LiveTape />

      {/* Top Header */}
      <header className="landing-nav">
        <div className="mp-logo">
          <div className="mp-logo-badge"><Activity size={22} /></div>
          <div>
            MarketProbe<span style={{ color: 'var(--green2)' }}>.</span>
            <small>QUANT COUNCIL · v1.0</small>
          </div>
        </div>

        <div className="landing-nav-links">
          <a href="#preview">Live Modules</a>
          <a href="#features">v1.0 Architecture</a>
          <a href="#metrics">Proof Metrics</a>
          <a href="#compliance">SEBI Boundary</a>
        </div>

        <div className="landing-actions">
          <TerminalStatusIndicator />
          {isAuthenticated ? (
            <button className="btn btn-primary" onClick={() => handleTerminalAction('TERMINAL')}>
              Return to Terminal <ArrowRight size={15} />
            </button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => onOpenAuth('login')}>
                Sign In
              </button>
              <button className="btn btn-primary" onClick={() => onOpenAuth('signup')}>
                Create Account <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />

        <div className="landing-badge">
          <Sparkles size={14} /> MarketProbe v1.0 · Dual-Market Forensic Equity Intelligence (NSE + SEC EDGAR)
        </div>

        <h1 className="landing-title">
          Market noise vs.<br />
          <span className="grad-text">hard empirical truth.</span>
        </h1>

        <p className="landing-subtitle">
          Audit finfluencer track records with Wilson 95% confidence intervals and SHA-256 receipts,
          convene a <b>5-Agent Quant Council</b>, run <b>Bull vs. Bear SEC/NSE filings debates</b>,
          detect <b>insider cluster buys</b>, and measure <b>CEO vocal stress</b> on earnings calls.
        </p>

        <div className="landing-cta-row">
          {isAuthenticated ? (
            <button
              className="btn btn-primary btn-lg"
              style={{ padding: '14px 28px', fontSize: 15.5 }}
              onClick={() => handleTerminalAction('TERMINAL')}
            >
              <PlayCircle size={18} /> Return to Live Terminal (v1.0)
            </button>
          ) : (
            <>
              <button
                className="btn btn-primary btn-lg"
                style={{ padding: '14px 28px', fontSize: 15.5 }}
                onClick={() => onOpenAuth('login')}
              >
                <Lock size={17} /> Sign In to Terminal (v1.0)
              </button>
              <button
                className="btn btn-ghost btn-lg"
                style={{ padding: '14px 24px', fontSize: 15.5 }}
                onClick={() => onOpenAuth('signup')}
              >
                Create Account <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>

        <div className="landing-trust">
          <span><Radio size={15} color="var(--green2)" /> 5-Agent 3-Round Communicating Bus</span>
          <span><FileText size={15} color="var(--blue)" /> Live SEC EDGAR XBRL &amp; Form 4 XML + NSE PIT</span>
          <span><ShieldCheck size={15} color="var(--amber)" /> Strict SEBI Non-Advisory Proof Standard</span>
        </div>

        {/* Interactive v1.0 4-Engine Preview Window */}
        <div className="landing-preview-window" id="preview">
          <div className="preview-window-bar">
            <div className="preview-window-dots">
              <i className="d-red" />
              <i className="d-yellow" />
              <i className="d-green" />
            </div>

            <div className="preview-tab-controls">
              <button
                type="button"
                className={`preview-tab-btn ${previewTab === 'COUNCIL' ? 'active' : ''}`}
                onClick={() => setPreviewTab('COUNCIL')}
              >
                <Scale size={13} /> 5-Agent Council
              </button>
              <button
                type="button"
                className={`preview-tab-btn ${previewTab === 'DEBATE' ? 'active' : ''}`}
                onClick={() => setPreviewTab('DEBATE')}
              >
                <Gavel size={13} /> Bull vs Bear Filings
              </button>
              <button
                type="button"
                className={`preview-tab-btn ${previewTab === 'INSIDERS' ? 'active' : ''}`}
                onClick={() => setPreviewTab('INSIDERS')}
              >
                <Users size={13} /> Insider Radar
              </button>
              <button
                type="button"
                className={`preview-tab-btn ${previewTab === 'STRESS' ? 'active' : ''}`}
                onClick={() => setPreviewTab('STRESS')}
              >
                <Mic size={13} /> Vocal Stress Lab
              </button>
            </div>

            <span className="pill pill-buy" style={{ fontSize: '11px', padding: '3px 8px' }}>
              <Activity size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              v1.0 LIVE
            </span>
          </div>

          <div className="preview-body">
            {previewTab === 'COUNCIL' && (
              <>
                <div className="card preview-glass-card" style={{ textAlign: 'left' }}>
                  <div className="row between" style={{ marginBottom: 12 }}>
                    <div className="row">
                      <div className="creator-av" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--green2)' }}>5</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>5-Agent Communicating Quant Council</div>
                        <span className="pill pill-sebi" style={{ fontSize: '10.5px', marginTop: 2 }}>
                          3-ROUND REDIS BUS · MERTON JUMP-DIFFUSION
                        </span>
                      </div>
                    </div>
                    <span className="pill pill-buy">CALIBRATED</span>
                  </div>

                  <div className="quote" style={{ fontSize: 13.5, margin: '10px 0' }}>
                    Agents 1–5 cross-examine every trade setup: FAISS RAG &amp; insider flow, Empirical Bayes creator haircut, 1,000-path stochastic barrier simulation, Section 111A/112A post-tax EV, and counterfactual target/SL restructuring.
                  </div>

                  <div className="levels" style={{ marginTop: 14 }}>
                    <div className="level">
                      <small>ORIGINAL HIT ODDS</small>
                      <b style={{ color: '#fb7185' }}>19.1%</b>
                    </div>
                    <div className="level">
                      <small>RESTRUCTURED ODDS</small>
                      <b style={{ color: 'var(--green2)' }}>52.2% <em>(+33.1%)</em></b>
                    </div>
                    <div className="level">
                      <small>HALF-KELLY CAP</small>
                      <b style={{ color: '#38bdf8' }}>2.2%</b>
                    </div>
                  </div>

                  <div className="row between" style={{ marginTop: 14 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Common Random Numbers · Deterministic Audit</span>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleTerminalAction('TERMINAL')}>
                      Open Council <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                  <div className="card preview-glass-card" style={{ padding: 15 }}>
                    <div style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 800 }}>PRIMARY PROOF STANDARD</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--green2)', marginTop: 4 }}>
                      {verifiedPct}% Verified Primary
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {totalRecs.toLocaleString('en-IN')} audited calls · {anomalies} hygiene anomalies · SHA-256 ledger
                    </div>
                  </div>

                  <div className="card preview-glass-card" style={{ padding: 15 }}>
                    <div style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 800 }}>LIVE OFFICIAL NSE BREADTH</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginTop: 4 }}>
                      {nseIndices?.nifty_50
                        ? `NIFTY 50 · ${Number(nseIndices.nifty_50.last).toLocaleString('en-IN')}`
                        : '139 NSE Sectoral Indices'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 2 }}>
                      {nseIndices?.india_vix
                        ? `INDIA VIX ${nseIndices.india_vix.last} · ${nseIndices.market_breadth?.advances || 0} Adv / ${nseIndices.market_breadth?.declines || 0} Dec`
                        : 'Direct NSE allIndices + Kite / Dhan HQ connector hooks'}
                    </div>
                  </div>

                  <div className="card preview-glass-card" style={{ padding: 15 }}>
                    <div style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 800 }}>STATISTICAL RIGOR</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--amber)', marginTop: 4 }}>
                      Empirical Bayes + Wilson 95% CI
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      Eliminates small-sample lucky-streak rankings &amp; survivorship bias
                    </div>
                  </div>
                </div>
              </>
            )}

            {previewTab === 'DEBATE' && (
              <div className="card preview-glass-card" style={{ gridColumn: 'span 2', textAlign: 'left', padding: 20 }}>
                <div className="row between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Bull vs. Bear AI Filings Debate + CIO Judge</h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                      Opposing AI counsels cite live SEC EDGAR 10-K / 20-F XBRL CompanyFacts or uploaded NSE Annual Report PDFs.
                    </p>
                  </div>
                  <span className="pill pill-sebi">LIVE SEC EDGAR XBRL</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <div className="level" style={{ borderRadius: 8, padding: 12 }}>
                    <small>INFY · 20-F XBRL (FY25)</small>
                    <b>$19.28B Rev <em style={{ color: 'var(--green2)' }}>+3.85% YoY</em></b>
                  </div>
                  <div className="level" style={{ borderRadius: 8, padding: 12 }}>
                    <small>AAPL · 10-K XBRL (FY26)</small>
                    <b>$478.83B Rev <em style={{ color: 'var(--green2)' }}>+15.06% YoY</em></b>
                  </div>
                  <div className="level" style={{ borderRadius: 8, padding: 12 }}>
                    <small>NVDA · 10-K XBRL (FY26)</small>
                    <b>$215.94B Rev <em style={{ color: 'var(--green2)' }}>+65.47% YoY</em></b>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--green2)', marginBottom: 4 }}>BULL COUNSEL</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text)' }}>
                      Cites audited OCF/Net Income conversion (1.38x), zero long-term debt, and cash reserves directly from XBRL tags.
                    </div>
                  </div>
                  <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.28)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#fb7185', marginBottom: 4 }}>BEAR COUNSEL + CIO JUDGE</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text)' }}>
                      Cross-examines margin ceiling &amp; valuation asymmetry; CIO Judge scores Evidence, Rigor, and Risk Realism (0–100) and pushes filing bias into the 5-Agent Council.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'INSIDERS' && (
              <div className="card preview-glass-card" style={{ gridColumn: 'span 2', textAlign: 'left', padding: 20 }}>
                <div className="row between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Insider Cluster Buy Radar &amp; Smart-Money Divergence</h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                      Strict open-market SEC Form 4 XML (Code P/S only, rejecting RSU grants &amp; exercises) + NSE SEBI PIT CSV importer cross-joined against finfluencer consensus.
                    </p>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleTerminalAction('INSIDERS')}>
                    Open Radar <ArrowRight size={13} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                  <div style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.32)', borderRadius: 8, padding: 12 }}>
                    <div className="row between" style={{ marginBottom: 6 }}>
                      <b>TATAMOTORS · NSE PIT</b>
                      <span className="pill" style={{ background: 'rgba(244,63,94,0.16)', color: '#fb7185', fontSize: 10.5 }}>Finfluencer Trap</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                      100% bullish retail creator calls (27 calls) while 3 corporate insiders net sold ₹8.05 Cr on the open market.
                    </div>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.32)', borderRadius: 8, padding: 12 }}>
                    <div className="row between" style={{ marginBottom: 6 }}>
                      <b>HDFCBANK · NSE PIT</b>
                      <span className="pill pill-hit" style={{ fontSize: 10.5 }}>Smart-Money Confirmed</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                      4 C-suite/KMP executives buying ₹7.81 Cr on the open market aligns with 99.4% verified analyst coverage.
                    </div>
                  </div>
                  <div style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.32)', borderRadius: 8, padding: 12 }}>
                    <div className="row between" style={{ marginBottom: 6 }}>
                      <b>INTC · SEC Form 4 XML</b>
                      <span className="pill pill-sebi" style={{ fontSize: 10.5 }}>Stealth Accumulation</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                      4 distinct insiders (3 C-Suite/Board) accumulating $13.62M with minimal retail social hype.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'STRESS' && (
              <div className="card preview-glass-card" style={{ gridColumn: 'span 2', textAlign: 'left', padding: 20 }}>
                <div className="row between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Earnings Call Vocal Stress &amp; Executive Hedging Lab</h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                      Speaker-normalized acoustic forensics (librosa F0 variance, vocal jitter, pause density) + Gemini native audio transcription + FinBERT/Hedging shift from Prepared Remarks to Analyst Q&amp;A.
                    </p>
                  </div>
                  <span className="pill" style={{ background: 'rgba(244,63,94,0.16)', color: '#fb7185' }}>LIBROSA + GEMINI AUDIO</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                  <div className="level" style={{ borderRadius: 8, padding: 12 }}>
                    <small>COMPOSITE STRESS</small>
                    <b style={{ color: '#fb7185' }}>94.5 / 100</b>
                  </div>
                  <div className="level" style={{ borderRadius: 8, padding: 12 }}>
                    <small>PITCH F0 VAR SHIFT</small>
                    <b style={{ color: 'var(--amber)' }}>+260% Q&amp;A Δ</b>
                  </div>
                  <div className="level" style={{ borderRadius: 8, padding: 12 }}>
                    <small>Q&amp;A SENTIMENT DROP</small>
                    <b>+1.00 → -0.89</b>
                  </div>
                  <div className="level" style={{ borderRadius: 8, padding: 12 }}>
                    <small>POST-CALL T+5 DRIFT</small>
                    <b style={{ color: '#fb7185' }}>-4.62%</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Numerical Metrics Bar */}
        <div className="landing-metrics-bar" id="metrics">
          <div className="metric-tile">
            <small>AUDITED CALL LEDGER</small>
            <b>{totalRecs.toLocaleString('en-IN')}</b>
            <span>{verifiedPct}% Verified Primary Proof</span>
          </div>
          <div className="metric-tile">
            <small>MULTI-AGENT ENGINE</small>
            <b>5 Agents</b>
            <span>3-Round Bus + 1,000-Path Merton</span>
          </div>
          <div className="metric-tile">
            <small>DUAL-MARKET FEEDS</small>
            <b>NSE + SEC</b>
            <span>Official Indices, XBRL &amp; Form 4</span>
          </div>
          <div className="metric-tile">
            <small>PROOF STANDARD</small>
            <b>SHA-256</b>
            <span>Wilson 95% CI · {anomalies} Anomalies</span>
          </div>
        </div>
      </section>

      {/* Core v1.0 Capabilities Grid */}
      <section className="landing-section" id="features">
        <div className="section-tag">MarketProbe v1.0 Architecture</div>
        <h2 className="section-title">Six Forensic Intelligence Engines in One Terminal</h2>
        <p className="section-desc">
          Built for disciplined market participants, quant researchers, and compliance teams who verify claims against primary-source exchange and regulatory data.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><Scale size={24} /></div>
            <h3>5-Agent Communicating Quant Council</h3>
            <p>Three deliberative rounds combining FAISS transcript RAG, Empirical Bayes creator shrinkage, 1,000-path Merton Jump-Diffusion barrier odds, CVaR/Half-Kelly sizing, and Indian Section 111A/112A post-tax EV.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><Gavel size={24} /></div>
            <h3>Bull vs. Bear AI Filings Debate</h3>
            <p>Adversarial Bull &amp; Bear counsels cross-examine live SEC EDGAR 10-K/20-F XBRL financials or uploaded NSE Annual Report PDFs, adjudicated by a CIO Judge with rubric scoring.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><Users size={24} /></div>
            <h3>Insider Cluster Buy Radar</h3>
            <p>Parses live SEC Form 4 XML (strictly open-market Code P/S) and official NSE SEBI PIT CSV disclosures, cross-joining C-suite buys/sells against finfluencer consensus to expose divergence traps.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><Mic size={24} /></div>
            <h3>Earnings Call Vocal Stress Lab</h3>
            <p>Extracts speaker-normalized acoustic biomarkers (F0 pitch variance, jitter, hesitation pauses) via librosa, transcribes audio via Gemini, scores corporate hedging, and tracks T+1/T+5 drift.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><Trophy size={24} /></div>
            <h3>Empirical Track-Record Ledger</h3>
            <p>Ranks creators and brokerage desks using Empirical Bayes shrinkage and Wilson 95% confidence intervals, with immutable stated entry prices and SHA-256 proof inspection modals.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><Calculator size={24} /></div>
            <h3>FinBot Copilot, MPT &amp; Tax Lab</h3>
            <p>Persistent-memory quant assistant (⌘K), Markowitz SLSQP Efficient Frontier optimizer, Section 112A tax-loss harvesting calculator, portfolio replay simulator, and sub-2ms NLP fact-checker.</p>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="landing-section" id="compliance">
        <div className="section-tag">Proof Standard &amp; SEBI Governance</div>
        <h2 className="section-title">Social Market Noise vs. Empirical Proof</h2>
        <p className="section-desc">
          Strictly engineered as an empirical performance-auditing, primary-source verification, and quantitative simulation platform — never personalized buy/sell advisory.
        </p>

        <div className="comparison-grid">
          <div className="comp-card trad">
            <h3 style={{ color: 'var(--red)', marginTop: 0 }}>Unverified Social &amp; Tip Culture</h3>
            <ul style={{ paddingLeft: 20, color: 'var(--muted)', lineHeight: 1.8, fontSize: 15 }}>
              <li>Deleted posts and cherry-picked winners without stop-loss accounting</li>
              <li>Retail hype pushing buys while corporate insiders quietly distribute</li>
              <li>Unexamined earnings-call hedging and unverified financial claims</li>
              <li>No statistical confidence intervals or primary-source traceability</li>
            </ul>
          </div>

          <div className="comp-card probe">
            <h3 style={{ color: 'var(--green2)', marginTop: 0 }}>MarketProbe v1.0 Verification Engine</h3>
            <ul style={{ paddingLeft: 20, color: 'var(--text)', lineHeight: 1.8, fontSize: 15 }}>
              <li>SHA-256 proof receipts with immutable stated entry prices &amp; source links</li>
              <li>Empirical Bayes + Wilson 95% CI leaderboards with synthetic data purged</li>
              <li>Direct cross-checks against SEC EDGAR XBRL, Form 4 XML &amp; NSE SEBI PIT</li>
              <li>4-stage CI/CD automated testing &amp; data hygiene enforcement on every push</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="landing-section" style={{ textAlign: 'center', marginTop: 80 }}>
        <div
          className="card"
          style={{
            padding: '52px 36px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.16) 0%, rgba(11,15,23,0.92) 70%)',
            border: '1px solid rgba(16,185,129,0.32)',
          }}
        >
          <div style={{ fontSize: 11.5, fontFamily: 'var(--mono)', color: 'var(--green2)', fontWeight: 700, marginBottom: 10 }}>
            MARKETPROBE v1.0 RELEASE
          </div>
          <h2 style={{ fontSize: 34, fontWeight: 900, margin: '0 0 14px' }}>
            Verify market claims against primary-source truth.
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 16.5, maxWidth: 620, margin: '0 auto 28px' }}>
            Launch the full v1.0 terminal to inspect the 5-Agent Quant Council, Bull vs. Bear Filings Debate, Insider Cluster Radar, and Earnings Vocal Stress Lab.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <button className="btn btn-primary btn-lg" onClick={() => handleTerminalAction('TERMINAL')}>
                <PlayCircle size={17} /> Return to Live Terminal (v1.0)
              </button>
            ) : (
              <>
                <button className="btn btn-primary btn-lg" onClick={() => onOpenAuth('login')}>
                  <Lock size={17} /> Sign In to Terminal (v1.0)
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => onOpenAuth('signup')}>
                  Create Free Account <ArrowRight size={17} />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer with SEBI Non-Advisory Disclosure */}
      <footer className="landing-footer">
        <div className="landing-footer-inner" style={{ flexDirection: 'column', gap: 14, alignItems: 'stretch' }}>
          <div className="row between" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="row" style={{ gap: 10 }}>
              <div className="mp-logo-badge" style={{ width: 32, height: 32 }}><Activity size={16} /></div>
              <span style={{ fontWeight: 800, fontSize: 15 }}>MarketProbe v1.0</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--green2)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 7px', borderRadius: 4 }}>
                STABLE RELEASE
              </span>
            </div>

            <div style={{ color: 'var(--dim)', fontSize: 12.5 }}>
              © 2026 MarketProbe. Empirical Performance Auditing &amp; Quantitative Forensics Infrastructure.
            </div>

            <div className="row" style={{ gap: 12 }}>
              <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: '6px 12px' }} onClick={() => onOpenAuth('login')}>
                Sign In
              </button>
              <button className="btn btn-primary" style={{ fontSize: 12.5, padding: '6px 12px' }} onClick={() => (isAuthenticated ? handleTerminalAction('TERMINAL') : onOpenAuth('signup'))}>
                {isAuthenticated ? 'Open Terminal' : 'Create Account'}
              </button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, fontSize: 11.5, color: '#64748b', lineHeight: 1.55, textAlign: 'left' }}>
            <b style={{ color: '#94a3b8' }}>SEBI Non-Advisory Disclosure:</b> MarketProbe is strictly an empirical performance-auditing, primary-source verification, and quantitative simulation platform. It is <b style={{ color: '#cbd5e1' }}>not</b> a SEBI-registered Investment Adviser (IA) or Research Analyst (RA) and does not provide personalized buy/sell recommendations.
          </div>
        </div>
      </footer>
    </div>
  );
}
