# MarketProbe v1.0 — Forensic Equity Auditing & Multi-Agent Quant Terminal

**MarketProbe v1.0** is an empirical performance-auditing, primary-source verification, and multi-agent quantitative forensics terminal spanning **NSE (India)** and **SEC EDGAR (US / Indian ADRs)**.

> **SEBI Non-Advisory Disclosure:** MarketProbe is strictly an empirical performance-auditing, primary-source verification, and quantitative simulation platform. It is **not** a SEBI-registered Investment Adviser (IA) or Research Analyst (RA) and does not provide personalized buy/sell advice.

---

## Core v1.0 Architecture & Modules

1. **5-Agent Communicating Quant Council (`3-Round Redis / In-Memory Bus`)**
   - **Agent 1 (Perception & RAG):** 544-vector FAISS transcript grounding, SEBI RA registry check, crowd consensus, and live Insider Flow / Smart-Money Divergence telemetry.
   - **Agent 2 (Forensic Empirical Bayes):** Shrinkage-adjusted creator win rates, Wilson 95% confidence intervals, and Brier calibration haircuts.
   - **Agent 3 (Stochastic Quant Math):** 1,000-path Merton Jump-Diffusion first-passage barrier simulation with Common Random Numbers determinism and counterfactual target/stop-loss restructuring.
   - **Agent 4 (Risk, Tax & Memory):** 95% CVaR tail risk, Half-Kelly sizing, Indian Section 111A/112A capital gains modeling, and persistent user risk profile memory.
   - **Agent 5 (CIO Meta-Governor):** Synthesizes 3-round agent consensus and calibrated risk scenarios.
2. **Bull vs. Bear AI Filings Debate + CIO Judge**
   - Live SEC EDGAR `10-K` / `20-F` XBRL CompanyFacts (`us-gaap` & `ifrs-full` latest fiscal year) + NSE Annual Report PDF upload.
   - Bull Counsel → Bear Counsel cross-examination → Bull Rebuttal → CIO Judge rubric scorecard (`Evidence Grounding`, `Financial Rigor`, `Risk Realism`) with 1-click push into the 5-Agent Council.
3. **Insider Cluster Buy Radar & Smart-Money Divergence**
   - Live SEC Form 4 XML ingestion strictly filtering to open-market buys (`P`) and sales (`S`) (rejecting RSU grants, tax withholdings, and option exercises) + official **NSE SEBI PIT CSV importer**.
   - Cross-joins multi-executive cluster buys/sales against MarketProbe's verified call ledger (`SMART_MONEY_CONFIRMED`, `FINFLUENCER_TRAP`, `STEALTH_ACCUMULATION`).
4. **Earnings Call Vocal Stress & Executive Hedging Lab**
   - Frame-level acoustic biomarker extraction (`ffmpeg` + `librosa`: pitch `F0` variance, vocal jitter, RMS tremor, hesitation pause density) comparing **Analyst Q&A vs. Prepared Remarks** baseline.
   - Gemini native audio transcription, financial sentiment polarity drop, corporate hedging idiom extraction, and non-blocking `T+1`/`T+5` post-call stock drift tracking.
5. **Empirical Track-Record Ledger, FinBot Copilot & Live NSE Sector Breadth**
   - **`2,281` audited records** (`97.4%` Verified Primary, `0` synthetic rows, `0` hygiene anomalies) with immutable stated entry prices and **SHA-256 proof receipts**.
   - Live official **NSE `allIndices`** sectoral breadth + INDIA VIX, plus plug-and-play **Dhan HQ v2** and **Zerodha Kite Connect v3** live quote connectors.
   - FinBot Quant Copilot (`⌘K`), Markowitz SLSQP Efficient Frontier, Section 112A Tax-Loss Harvesting Lab, Portfolio Replay Simulator, and sub-2ms NLP Fact-Checker.

---

## Quickstart (Unified Single Port `8080`)

```bash
cp .env.example .env
# Add your GEMINI_API_KEY and MARKETPROBE_SECRET_KEY in .env

pip install -r requirements.txt
cd frontend && npm ci && npm run build && cd ..

python3 -m uvicorn src.backend.api:app --host 0.0.0.0 --port 8080
```

Open **http://localhost:8080** (API docs at `http://localhost:8080/docs`).

---

## Testing, CI/CD & Production Deployment

- **Automated Test Suite (`29` tests):**
  ```bash
  PYTHONPATH=. pytest tests/ -v
  ```
- **4-Stage GitHub Actions CI/CD (`.github/workflows/ci.yml`):**
  1. Backend `pytest` + automated `hygiene_supervisor` gate (`0` anomalies, `0` synthetic rows)
  2. React/Vite production SPA build
  3. Multi-stage `Dockerfile` build verification (`node:20-alpine` + `python:3.11-slim` + `ffmpeg` + `libsndfile1`)
  4. CI-gated Render deploy hook (`RENDER_DEPLOY_HOOK_URL`) + post-deploy `/api/health` verification
- **Daily Market-Close Data Sync (`.github/workflows/daily-crawler.yml`):**
  - Runs Mon–Fri at 3:45 PM IST (`10:15 UTC`) via `src/ingestion/scheduled_daily_sync.py`.
- **Cloud Blueprint (`render.yaml`):**
  - Provisions Docker web service (`:8080`), managed **PostgreSQL** (`DATABASE_URL` via `src/backend/db_adapter.py`), and managed **Redis** (`REDIS_URL`).
