# MarketProbe: Multi-Modal Financial Recommendation Auditor, Alpha Gating Engine & Real-Time NSE Fact-Checker

MarketProbe is an enterprise-grade financial intelligence and regulatory compliance system designed to ingest, transcribe, audit, and fact-check stock recommendations from financial influencers ("finfluencers"), institutional broker desks, and social media channels (YouTube, Twitter/X, Telegram, Institutional PDFs).

---

## 🚀 Quickstart: Running on Custom / Different Ports

### Default Run (Backend: `8080`, Frontend: `5174`):
```bash
cd /Users/dhruvgourisaria/marketprobe
./start.sh
```

### Run on Any Specific Ports of Your Choice:
```bash
# Syntax: ./start.sh <backend_port> <frontend_port>
./start.sh 8001 3000
# or
./start.sh 9000 8081
```

This automatically launches:
* **FastAPI Backend**: `http://localhost:<backend_port>` (API Docs: `http://localhost:<backend_port>/docs`)
* **React Frontend**: `http://localhost:<frontend_port>`

---

## 🌟 Key Architecture & Capabilities

1. **Precision Financial NER & Fast-Path Fact-Checking**:
   - Sub-2ms deterministic regex fast-path and NLP entity extraction ($537\times$ speedup) extracting Action (`BUY`/`SELL`), Target, Stop Loss, and NSE Tickers.
2. **Bayesian ML Alpha Gating Engine (XGBoost)**:
   - Evaluates risk-to-reward ratios, historical creator win rates with empirical Bayes shrinkage, and market volatility buffers.
   - **Boosts realized trade win rate from $40.28\%$ (unfiltered) to $75.00\%$ ($\ge 60\%$ conviction filter).**
3. **High-Throughput Vectorized Portfolio Simulator**:
   - Sub-10ms vectorized Monte Carlo portfolio simulation and trade sandbox.
4. **Native Real-Time WebSockets Engine**:
   - `/ws/live-quotes` streaming real-time NSE market ticks with client fallback.
5. **Interactive Web Workstation**:
   - **Dataset Viewer (995 Audited Records)** with live filtering and 1-click CSV download.
   - **Live Audio Fact-Checker & Transcriber**.
   - **Picture-in-Picture Floating Miniplayer** with instant video timestamp seeking.
   - **Custom Trade Sandbox & Interactive Ledger**.

---

## 🧪 Running End-to-End Automated Tests
```bash
python3 test_e2e.py
```

---

## 📁 Repository Structure

```
marketprobe/
├── start.sh                       # 1-Click launcher supporting custom ports
├── test_e2e.py                    # Automated end-to-end test suite
├── requirements.txt               # Python backend dependencies
├── data/
│   ├── marketprobe.db             # Relational SQLite database (995 records, 51 creators, 2559 NSE tickers)
│   ├── marketprobe_recommendations.csv
│   ├── marketprobe_influencers.csv
│   ├── marketprobe_raw_content.csv
│   └── xgb_model.pkl              # Serialized production XGBoost model
├── src/
│   ├── backend/
│   │   └── api.py                 # FastAPI server (WebSockets, REST API, Conviction Engine)
│   ├── backtest/
│   │   └── engine.py              # Historical backtesting engine
│   ├── nlp/
│   │   ├── precision_extractor.py # Financial NER extraction logic
│   │   └── index_universe.py      # NSE sector & benchmark index mappings
│   ├── scraping/
│   │   ├── multi_platform_collector.py
│   │   ├── bulk_scale_ingestion.py
│   │   └── institutional_news_scraper.py
│   └── models/
│       └── train_realistic_ml.py  # Model training pipeline
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── MarketProbeApp.jsx     # Master UI Component (Dynamic backend port detection)
│       └── main.jsx
└── docs/
    ├── EVALUATION_METRICS.md      # Full 5-fold CV, holdout test metrics, SHAP analysis
    ├── RESEARCH_PAPER.md          # Full academic research paper
    ├── DATASET_REFERENCE.md       # Complete dataset reference guide
    └── VERIFICATION_WALKTHROUGH.md# Testing & verification guide
```
