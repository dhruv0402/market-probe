import React, { useState } from 'react';
import {
  Activity, PlayCircle, LogOut, Search, ShieldCheck, Trophy,
  Calculator, CheckCircle2, BookOpen, Rss, Play, Loader2,
  ExternalLink, Zap, Database, TrendingUp, TrendingDown,
  Layers, ChevronRight, BarChart3, AlertTriangle, Sparkles,
  Bell, Download, ArrowRight, Lock, Key, Users, Check, X, Shield, Globe,
  Sun, Moon, Palette, Bookmark, CreditCard, Star, Maximize2, Clock, Copy, ChevronDown,
  Share2, Terminal
} from 'lucide-react';
import { LiveTape } from './ChromeAndModals.jsx';

/* ---------------------------------- LANDING PAGE ---------------------------------- */
export default function LandingPage({ onOpenAuth, onLaunchDemo, theme, setTheme, glow, setGlow }) {
  const [previewTab, setPreviewTab] = useState('CALL');

  return (
    <div className="landing-shell">
      {/* Top Header */}
      <header className="landing-nav">
        <div className="mp-logo">
          <div className="mp-logo-badge"><Activity size={22} /></div>
          <div>
            MarketProbe<span style={{ color: 'var(--green2)' }}>.</span>
            <small>INSTITUTIONAL AUDIT ENGINE</small>
          </div>
        </div>

        <div className="landing-nav-links">
          <a href="#features">Architecture</a>
          <a href="#metrics">Verified Track Records</a>
          <a href="#compliance">SEBI Compliance</a>
          <a href="#api">API & Webhooks</a>
        </div>

        <div className="landing-actions">
          <TerminalStatusIndicator />
          <button className="btn btn-ghost" onClick={() => onOpenAuth('login')}>
            Sign In
          </button>
          <button className="btn btn-primary" onClick={() => onOpenAuth('signup')}>
            Get Started Free <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />

        <div className="landing-badge">
          <Sparkles size={14} /> Autonomous Indian Finfluencer & Broker Audit Terminal
        </div>

        <h1 className="landing-title">
          Stop trusting stock tips.<br />
          <span className="grad-text">Verify alpha against tick data.</span>
        </h1>

        <p className="landing-subtitle">
          MarketProbe continuously crawls, transcribes, and algorithmically grades 995+ recommendations from YouTube & X against sub-second NSE ticks. Real-time Bayesian win rates, stop-loss protection, and regulatory compliance.
        </p>

        <div className="landing-cta-row">
          <button className="btn btn-primary btn-lg" style={{ padding: '14px 28px', fontSize: 16 }} onClick={() => onOpenAuth('signup')}>
            Start Free Terminal <ArrowRight size={18} />
          </button>
          <button className="btn btn-ghost btn-lg" style={{ padding: '14px 24px', fontSize: 16 }} onClick={onLaunchDemo}>
            <PlayCircle size={18} color="var(--green2)" /> Launch Live Interactive Tour
          </button>
        </div>

        <div className="landing-trust">
          <span><ShieldCheck size={16} color="var(--green2)" /> SEBI RA Regulatory Indexing</span>
          <span><Zap size={16} color="var(--blue)" /> Sub-second NSE Tick Verification</span>
          <span><Lock size={16} color="var(--amber)" /> Zero Hallucination Video Timestamps</span>
        </div>

        {/* Live Interactive Terminal Preview Window */}
        <div className="landing-preview-window">
          <div className="preview-window-bar">
            <div className="preview-window-dots">
              <i className="d-red" />
              <i className="d-yellow" />
              <i className="d-green" />
            </div>
            
            {/* Interactive Preview Tabs */}
            <div className="preview-tab-controls">
              <button 
                type="button" 
                className={`preview-tab-btn ${previewTab === 'CALL' ? 'active' : ''}`}
                onClick={() => setPreviewTab('CALL')}
              >
                <Rss size={13} /> Audited Rec
              </button>
              <button 
                type="button" 
                className={`preview-tab-btn ${previewTab === 'RANKINGS' ? 'active' : ''}`}
                onClick={() => setPreviewTab('RANKINGS')}
              >
                <Trophy size={13} /> Creator Win-Rates
              </button>
              <button 
                type="button" 
                className={`preview-tab-btn ${previewTab === 'CHECKER' ? 'active' : ''}`}
                onClick={() => setPreviewTab('CHECKER')}
              >
                <CheckCircle2 size={13} /> Instant NLP Checker
              </button>
            </div>

            <span className="pill pill-buy" style={{ fontSize: '11px', padding: '3px 8px' }}>
              <Activity size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> 
              NSE TICK ACTIVE
            </span>
          </div>

          <div className="preview-body">
            {previewTab === 'CALL' && (
              <>
                {/* Left Card: Sample Audited Call */}
                <div className="card preview-glass-card" style={{ textAlign: 'left' }}>
                  <div className="row between" style={{ marginBottom: 12 }}>
                    <div className="row">
                      <div className="creator-av" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--green2)' }}>M</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>Motilal Oswal Financial Services</div>
                        <span className="pill pill-sebi" style={{ fontSize: '10.5px', marginTop: 2 }}>SEBI REG: INH000000412</span>
                      </div>
                    </div>
                    <span className="pill pill-hit">HIT (TARGET ACHIEVED)</span>
                  </div>

                  <div className="quote" style={{ fontSize: 14, margin: '10px 0' }}>
                    "Initiating tactical buy on LT.NS at ₹4,017 with target ₹4,426 on infra order momentum. Stop loss firmly at ₹3,782."
                  </div>

                  <div className="levels" style={{ marginTop: 14 }}>
                    <div className="level">
                      <small>ENTRY</small>
                      <b>₹4,017</b>
                    </div>
                    <div className="level">
                      <small>TARGET</small>
                      <b style={{ color: 'var(--green2)' }}>₹4,426 <em>(+10.2%)</em></b>
                    </div>
                    <div className="level">
                      <small>STOP LOSS</small>
                      <b style={{ color: 'var(--red)' }}>₹3,782 <em>(-5.8%)</em></b>
                    </div>
                  </div>

                  <div className="conv" style={{ marginTop: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>Bayesian Conviction Metric</span>
                    <span className="num" style={{ fontWeight: 800, color: 'var(--green2)' }}>71.9% (GRADE A)</span>
                  </div>
                </div>

                {/* Right Card: Real-time Live Signal Highlights */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                  <div className="card preview-glass-card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 800 }}>ALPHA GATING ENGINE</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--green2)', marginTop: 4 }}>75.4% Win Rate</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>When conviction score exceeds 60.0%</div>
                  </div>

                  <div className="card preview-glass-card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 800 }}>TOTAL TRACKED CALLS</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginTop: 4 }}>995 Recommendations</div>
                    <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 2 }}>Across 51 YouTube channels & Telegram desks</div>
                  </div>

                  <div className="card preview-glass-card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 800 }}>COMPLIANCE STATUS</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--amber)', marginTop: 4 }}>64% Unregistered Finfluencers</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Operating without SEBI Research Analyst license</div>
                  </div>
                </div>
              </>
            )}

            {previewTab === 'RANKINGS' && (
              <div className="card preview-glass-card" style={{ gridColumn: 'span 2', textAlign: 'left', padding: 20 }}>
                <div className="row between" style={{ marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Audited Finfluencer Leaderboard</h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Ranked by verified exchange tick win-rate (survivorship bias removed).</p>
                  </div>
                  <span className="pill pill-sebi">LIVE REGISTRY</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="mp">
                    <thead>
                      <tr>
                        <th>Advisor</th>
                        <th>Status</th>
                        <th>Audited Recs</th>
                        <th>Win Rate</th>
                        <th>Risk / Reward</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><b>Motilal Oswal Financial Services</b></td>
                        <td><span className="pill pill-sebi">SEBI Reg</span></td>
                        <td className="num">142</td>
                        <td className="num" style={{ color: 'var(--green2)', fontWeight: 800 }}>64.8%</td>
                        <td className="num">2.4 : 1</td>
                      </tr>
                      <tr>
                        <td><b>ICICI Direct Research</b></td>
                        <td><span className="pill pill-sebi">SEBI Reg</span></td>
                        <td className="num">118</td>
                        <td className="num" style={{ color: 'var(--green2)', fontWeight: 800 }}>61.2%</td>
                        <td className="num">2.1 : 1</td>
                      </tr>
                      <tr>
                        <td><b>Abhishek Kar</b></td>
                        <td><span className="pill" style={{ background: 'rgba(244,63,94,0.1)', color: '#fb7185' }}>Unregistered</span></td>
                        <td className="num">86</td>
                        <td className="num" style={{ color: '#fb7185', fontWeight: 800 }}>38.4%</td>
                        <td className="num">1.3 : 1</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {previewTab === 'CHECKER' && (
              <div className="card preview-glass-card" style={{ gridColumn: 'span 2', textAlign: 'left', padding: 22 }}>
                <div className="row between" style={{ marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Sub-2ms Financial Tip Parser</h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Paste raw social text — extract symbols, levels, and check historical win rate.</p>
                  </div>
                  <span className="pill pill-buy">AI NLP READY</span>
                </div>
                <div style={{ background: 'var(--panel2)', padding: 14, borderRadius: 10, border: '1px solid var(--line2)', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 700, marginBottom: 4 }}>SAMPLE PARSED INPUT:</div>
                  <div style={{ fontStyle: 'italic', fontSize: 14, color: 'var(--text)' }}>
                    "TATAMOTORS breaking out above 970 with target 1080 and SL at 930. Heavy delivery volumes seen today!"
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <div className="level" style={{ borderRadius: 8 }}>
                    <small>TICKER</small>
                    <b>TATAMOTORS.NS</b>
                  </div>
                  <div className="level" style={{ borderRadius: 8 }}>
                    <small>ENTRY</small>
                    <b>₹970.00</b>
                  </div>
                  <div className="level" style={{ borderRadius: 8 }}>
                    <small>TARGET</small>
                    <b style={{ color: 'var(--green2)' }}>₹1,080.00 (+11.3%)</b>
                  </div>
                  <div className="level" style={{ borderRadius: 8 }}>
                    <small>CONVICTION</small>
                    <b style={{ color: 'var(--green2)' }}>72.0% (APPROVED)</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Numerical Metrics Bar */}
        <div className="landing-metrics-bar" id="metrics">
          <div className="metric-tile">
            <small>AUDITED CALLS</small>
            <b>995+</b>
            <span>Direct from transcripts</span>
          </div>
          <div className="metric-tile">
            <small>TRACKED CREATORS</small>
            <b>51 Desks</b>
            <span>SEBI & Solo Finfluencers</span>
          </div>
          <div className="metric-tile">
            <small>BAYESIAN ALPHA</small>
            <b>+34.8%</b>
            <span>Conviction improvement</span>
          </div>
          <div className="metric-tile">
            <small>SUB-SECOND TICKS</small>
            <b>100% NSE</b>
            <span>Exact execution matching</span>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="landing-section" id="features">
        <div className="section-tag">System Capabilities</div>
        <h2 className="section-title">Institutional Grade Tech Architecture</h2>
        <p className="section-desc">
          Designed for hedge funds, retail investors, and compliance regulators seeking transparent truth behind public financial commentary.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><Database size={24} /></div>
            <h3>Autonomous Video Audio Mining</h3>
            <p>Whisper & custom acoustic NLP extract exact stock names, entry levels, targets, and stop losses straight from video streams.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><Calculator size={24} /></div>
            <h3>Historical Tick Verification</h3>
            <p>Every call is simulated against real NSE candlestick ticks to ascertain whether targets or stop losses were mathematically triggered first.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><Trophy size={24} /></div>
            <h3>Empirical Creator Rankings</h3>
            <p>Eliminate survivorship bias. Discover which creators generate authentic returns versus those delivering catastrophic drawdowns.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><Bell size={24} /></div>
            <h3>High-Conviction Alpha Alerts</h3>
            <p>Filter calls in real-time by Bayesian probability thresholds. 1-click dispatch payloads for instant Telegram and webhook alerts.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><CheckCircle2 size={24} /></div>
            <h3>Instant NLP Fact-Checker</h3>
            <p>Paste any unsolicited tip from WhatsApp, Telegram, or Twitter to extract risk geometry and inspect creator accuracy instantly.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><Download size={24} /></div>
            <h3>SEBI Compliance Audit CSVs</h3>
            <p>Export full timestamped audit logs for regulatory oversight, fiduciary verification, and institutional risk management.</p>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="landing-section" id="compliance">
        <div className="section-tag">Market Differentiation</div>
        <h2 className="section-title">Blind Social Trading vs. MarketProbe</h2>
        <p className="section-desc">
          How quantitative verification changes the odds for Indian equity market participants.
        </p>

        <div className="comparison-grid">
          <div className="comp-card trad">
            <h3 style={{ color: 'var(--red)', marginTop: 0 }}>Unverified Finfluencer Culture</h3>
            <ul style={{ paddingLeft: 20, color: 'var(--muted)', lineHeight: 1.8, fontSize: 15 }}>
              <li>Deleted tweets & hidden video histories after stop-out losses</li>
              <li>Hype buzzwords ("100x rocket", "sure-shot multibagger") without stops</li>
              <li>Retail traders enter at the top of pump cycles</li>
              <li>Zero regulatory traceability or SEBI registration disclosures</li>
            </ul>
          </div>

          <div className="comp-card probe">
            <h3 style={{ color: 'var(--green2)', marginTop: 0 }}>MarketProbe Quantitative Audit</h3>
            <ul style={{ paddingLeft: 20, color: 'var(--text)', lineHeight: 1.8, fontSize: 15 }}>
              <li>Immutable timestamped YouTube and X audit trail that cannot be deleted</li>
              <li>Sub-second mathematical check: did target or stop loss hit first?</li>
              <li>Machine-learning Bayesian gating filters out 75%+ unprofitable calls</li>
              <li>1-click regulatory CSV audits for SEBI compliance and institutional diligence</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="landing-section" style={{ textAlign: 'center', marginTop: 100 }}>
        <div className="card" style={{ padding: '60px 40px', background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.2) 0%, rgba(15,23,42,0.8) 70%)', border: '1px solid rgba(16,185,129,0.35)' }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, margin: '0 0 16px' }}>Ready to trade on verified intelligence?</h2>
          <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: 600, margin: '0 auto 32px' }}>
            Join analysts and disciplined traders using MarketProbe to audit market commentators and protect portfolio capital.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => onOpenAuth('signup')}>
              Sign Up with Google or GitHub <ArrowRight size={17} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={onLaunchDemo}>
              <PlayCircle size={17} /> Explore Interactive Terminal Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="row" style={{ gap: 10 }}>
            <div className="mp-logo-badge" style={{ width: 34, height: 34 }}><Activity size={17} /></div>
            <span style={{ fontWeight: 800, fontSize: 16 }}>MarketProbe Technologies India</span>
          </div>

          <div style={{ color: 'var(--dim)', fontSize: 13.5 }}>
            © 2026 MarketProbe. Quantitative Finfluencer Auditing & Regulatory Intelligence Infrastructure.
          </div>

          <div className="row" style={{ gap: 18 }}>
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => onOpenAuth('login')}>
              Institutional Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
