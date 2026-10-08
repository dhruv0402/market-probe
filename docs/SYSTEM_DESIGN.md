# MarketProbe: Enterprise SaaS System Design Specification

## 1. System Overview & Problem Statement
MarketProbe is an institutional-grade, multi-modal financial recommendation auditor, alpha gating engine, and real-time NSE fact-checking platform. It addresses the systemic problem of unverified retail financial advice ("finfluencer tips") by:
1. Ingesting multi-platform content (YouTube transcripts, Twitter/X posts, Telegram feeds, Broker Research reports).
2. Parsing trade parameters (Symbol, Action, Entry, Target, Stop Loss) with a deterministic sub-2ms financial NER engine.
3. Filtering trade calls using a Bayesian XGBoost classifier to boost realized win rates from 40.28% to 75.00%.
4. Tracking and auditing live price paths against real-time NSE tick data.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT APPLICATIONS                               |
|  Web Dashboard (React 19 + Vite) | Mobile Browser (PWA) | Institutional API Clients|
+------------------------------------------+----------------------------------------+
                                           | HTTPS / WebSockets (WSS)
                                           v
+-----------------------------------------------------------------------------------+
|                            EDGE PROXY & CLOUDFLARE CDN                            |
|    - DDoS Protection    - SSL/TLS Termination    - Edge Caching    - WAF Rules    |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                               FASTAPI SAAS GATEWAY                                |
|  +------------------------+  +------------------------+  +---------------------+  |
|  |  Security Middleware   |  |  Token Bucket Limiter  |  | Prometheus Telemetry|  |
|  |  - JWT Bearer (HS256)  |  |  - 120 req/min (Free)  |  |  - Latency Histograms|  |
|  |  - API Keys (X-API-KEY)|  |  - 1200 req/min (Pro)  |  |  - Active WS Gauge   |  |
|  +------------------------+  +------------------------+  +---------------------+  |
+---------------------+-------------------+-------------------+---------------------+
                      |                   |                   |
                      v                   v                   v
+-----------------------------+ +---------------------+ +---------------------------+
|    PRECISION NER ENGINE     | |  IN-MEMORY TTL CACHE| |   BAYESIAN XGBOOST ENGINE |
| - Deterministic Regex Regex | | - /api/quotes (10s) | | - 13 Structural Features  |
| - Fast-Path (<1.56ms)       | | - /api/feed (15s)   | | - Empirical Bayes Shrink  |
| - NSE 2,559 Symbol Universe | | - /api/dataset (60s)| | - 75% Gated Win Rate      |
+-----------------------------+ +---------------------+ +---------------------------+
                      |                   |                   |
                      +-------------------+-------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             STORAGE & DATA PERSISTENCE                            |
|  +-------------------------+  +-------------------------+  +--------------------+ |
|  | SQLite WAL / PostgreSQL |  | Serialized Model Store  |  | CSV Data Lake      | |
|  | - 995 recommendations   |  | - xgb_model.pkl         |  | - recommendations  | |
|  | - 51 influencers        |  | - feature metadata      |  | - raw transcripts  | |
|  | - 2,559 NSE equities    |  | - creator priors        |  | - influencer logs  | |
|  +-------------------------+  +-------------------------+  +--------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Flow & Latency Budget

| Pipeline Stage | Processing Mechanism | Target SLA | Measured Benchmark |
| :--- | :--- | :--- | :--- |
| **Tip Ingestion & NER** | Deterministic regex token matcher | $< 5.0\text{ ms}$ | **$1.56\text{ ms}$** |
| **Model Inference** | Vectorized NumPy array -> XGBoost C++ runtime | $< 10.0\text{ ms}$ | **$2.40\text{ ms}$** |
| **Live Tick Stream** | WebSocket broadcast via non-blocking async loop | $< 25.0\text{ ms}$ | **$1.71\text{ ms}$** |
| **Portfolio Backtest** | Vectorized NumPy array masking | $< 50.0\text{ ms}$ | **$8.10\text{ ms}$** |
| **Database Read** | SQLite WAL with row indices on ticker & influencer | $< 5.0\text{ ms}$ | **$1.20\text{ ms}$** |

---

## 4. Security, Auth & RBAC
1. **Authentication**:
   - JWT tokens generated with HMAC-SHA256 (`HS256`) and salted PBKDF2 password hashes.
   - Long-lived Developer API Keys (`X-API-KEY: mp_live_...`) for institutional integration.
2. **Role-Based Access Control (RBAC)**:
   - `anonymous`: Access to public feed, basic quote snapshots, 120 req/min rate limit.
   - `pro_trader`: Access to full 995 dataset, custom trade sandbox, 75% alpha conviction filter, 1,200 req/min.
   - `institutional_admin`: Developer API keys, live audio fact-checking websocket, bulk export, 10,000 req/min.
3. **Data Protection & Privacy**:
   - Compliant with India Digital Personal Data Protection (DPDP) Act and GDPR.
   - No PII collected without explicit cookie consent.

---

## 5. Reliability & Disaster Recovery
- **WAL Mode**: SQLite runs in Write-Ahead-Logging mode (`PRAGMA journal_mode=WAL`), allowing concurrent readers without lock contention.
- **Graceful Fallbacks**: If WebSocket connection drops, client automatically degrades to 10-second HTTP polling.
- **Container Healthchecks**: Docker container executes `/api/health` probes every 30 seconds with automatic restart on 3 consecutive failures.
