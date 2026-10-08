# MarketProbe: SaaS Architecture & Production Operations Guide

## 1. Multi-Tier Architecture & Scalability

### Tier 1: Client & Presentation
- **Framework**: React 19 + Vite 8
- **State Management**: Reactive hooks, WebSockets with auto-reconnect, and localStorage cache.
- **Responsive Breakpoints**:
  - Desktop: $\ge 1280\text{px}$ (Multi-column live workstation)
  - Tablet: $768\text{px} - 1279\text{px}$ (Stacked cards, collapsable metrics)
  - Mobile: $< 768\text{px}$ (Single-column feed, sticky bottom audit CTA, swipeable tabs)

### Tier 2: API Gateway & Application Layer
- **Framework**: FastAPI (Asynchronous Python 3.11)
- **Concurrency**: Uvicorn ASGI event loop with multithreaded quote daemon.
- **Middleware Pipeline**:
  1. `MetricsMiddleware`: Prometheus request telemetry & `X-Response-Time-Ms` header injection.
  2. `CORSMiddleware`: Strict origin verification.
  3. `TokenBucketLimiter`: IP and API-Key tiered rate limiting.
  4. `CacheLayer`: In-memory TTL cache with sub-millisecond retrieval.

### Tier 3: ML Inference & Predictive Engine
- **Algorithm**: Gradient Boosted Decision Trees (`XGBoost 2.0+`)
- **Bayesian Prior Shrinkage**:
  $$\hat{\theta}_i = \frac{n_i \cdot \bar{y}_i + m \cdot \mu_0}{n_i + m}$$
  where $n_i$ is creator call count, $\bar{y}_i$ is observed win rate, $\mu_0 = 40.28\%$ (global mean), and $m = 10$ (shrinkage weight).
- **Inference Latency**: $2.4\text{ ms}$ on single CPU core.

### Tier 4: Storage & Caching
- **Master Database**: SQLite 3 (WAL mode) with automated indexing on `recommendations(ticker, call_timestamp, outcome_status)` and `influencers(name, platform)`.
- **Cache**: Fast key-value TTL store (drop-in replaceable with Redis cluster for horizontal scaling).
- **Data Lake**: CSV exports for external compliance audits and data scientists.

---

## 2. Production Deployment & Cloud Scaffolding

### Containerization with Docker
```bash
# Build multi-stage image
docker build -t marketprobe:production .

# Run with docker-compose
docker compose up -d
```

### Environment Variables
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP port for FastAPI service | `8080` |
| `MARKETPROBE_SECRET_KEY` | JWT signature secret key | `[Generated Secure Key]` |
| `MARKETPROBE_DB_PATH` | Path to SQLite database | `data/marketprobe.db` |
| `MARKETPROBE_MODEL_PATH` | Path to trained XGBoost model | `data/xgb_model.pkl` |

---

## 3. Monitoring, Alerts & Prometheus Telemetry
- Prometheus metrics available at `GET /metrics`.
- Health check probe available at `GET /api/health`.
- Telemetry gauges tracked:
  - `marketprobe_uptime_seconds`
  - `marketprobe_requests_total`
  - `marketprobe_errors_total`
  - `marketprobe_avg_latency_ms`
  - `marketprobe_active_websockets`
