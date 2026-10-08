# MarketProbe: System Evaluation Metrics & Benchmark Report

This document presents the empirical evaluation metrics for **MarketProbe**—a multi-platform financial recommendation auditor, machine learning outcome classifier, and real-time market fact-checking engine.

---

## 1. Multi-Platform Coverage & Data Ingestion

| Platform / Source | Raw Posts/Videos Ingested | Verified Recommendations Extracted | Target HITs | Stoploss MISSes | In-Progress (OPEN) | Baseline Win Rate (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **YouTube** | 38 | **464** | 156 | 239 | 69 | **39.49%** |
| **Twitter / X FinTwit** | 18 | **247** | 72 | 131 | 44 | **35.47%** |
| **Telegram Channels** | 11 | **161** | 60 | 75 | 26 | **44.44%** |
| **Broker / Institutional Research** | 7 | **123** | 53 | 57 | 13 | **48.18%** |
| **Total System Scope** | **74** | **995** | **341** | **502** | **152** | **40.45%** |

> [!NOTE]
> - **Extraction Completeness**: 100% of validated recommendations possess complete tuples: `(Ticker, Action, Entry Price, Target Price, Stop Loss, Risk-Reward Ratio, Timestamp / Source URL)`.
> - **Regulatory Status**: Institutional Research Desks and SEBI-registered advisors achieved higher baseline win rates (**48.18%**) compared to general social media creators (**35.47% – 39.49%**).

---

## 2. Machine Learning Predictive Benchmark

We evaluated four machine learning classifiers on pre-trade features (features available *before* the trade outcome is known) to predict whether a recommendation will hit its stated profit target (**HIT = 1**) or stop loss (**MISS = 0**).

### A. 5-Fold Stratified Cross-Validation

| Model Architecture | CV Accuracy (%) | CV F1-Score (%) | CV ROC-AUC |
| :--- | :---: | :---: | :---: |
| **XGBoost Classifier** | $63.10 \pm 4.87\%$ | $46.90 \pm 7.65\%$ | **$0.6841 \pm 0.0443$** |
| **LightGBM Classifier** | **$64.65 \pm 4.94\%$** | **$49.66 \pm 6.71\%$** | **$0.6819 \pm 0.0519$** |
| **Random Forest (150 trees)** | $62.63 \pm 2.18\%$ | $32.82 \pm 6.40\%$ | $0.6406 \pm 0.0467$ |
| **Logistic Regression (Baseline)** | $60.38 \pm 1.36\%$ | $12.24 \pm 6.29\%$ | $0.5743 \pm 0.0506$ |

### B. Holdout Test Set Evaluation (25% Unseen Sample, $N = 211$)

| Model | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) | Specificity (%) | ROC-AUC | PR-AUC | Brier Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **LightGBM** | **61.61%** | 52.86% | **43.53%** | **47.74%** | 73.81% | **0.6424** | 0.5447 | 0.2308 |
| **XGBoost** | **61.61%** | **53.12%** | 40.00% | 45.64% | 76.19% | 0.6411 | **0.5521** | **0.2303** |
| **Random Forest** | 61.14% | 55.56% | 17.65% | 26.79% | 90.48% | 0.6043 | 0.5079 | 0.2313 |
| **Logistic Regression** | 59.72% | 50.00% | 2.35% | 4.49% | **98.41%** | 0.5815 | 0.5217 | 0.2353 |

```
Confusion Matrix (XGBoost on Holdout Test Set):
                   Predicted MISS (0)    Predicted HIT (1)
Actual MISS (0):          96 (TN)               30 (FP)        -> Specificity: 76.19%
Actual HIT  (1):          51 (FN)               34 (TP)        -> Precision:   53.12%
```

---

## 3. Explainability & Feature Importance (SHAP)

Using **TreeExplainer SHAP** analysis on the XGBoost model, we measured the relative contribution of each pre-trade signal in determining outcome probability:

| Feature Name | SHAP Mean Absolute Impact | Relative Importance (%) | Economic Interpretation |
| :--- | :---: | :---: | :--- |
| `quote_len` | **0.4431** | **33.10%** | Length and depth of fundamental/technical rationale stated in the post/video |
| `log_subscribers` | **0.2964** | **22.14%** | Influencer audience scale (liquidity impact / market footprint) |
| `stated_risk_pct` | **0.2672** | **19.96%** | Stop loss distance from entry (tighter stop losses trigger premature exits) |
| `stated_rr_ratio` | **0.1651** | **12.33%** | Stated Risk-to-Reward Ratio ($\text{Reward} / \text{Risk}$) |
| `stated_reward_pct` | **0.1589** | **11.87%** | Target upside magnitude |
| `has_buy_signal` | **0.0081** | **0.60%** | Directional bias indicator |

---

## 4. Financial Performance & Risk-Reward Ledger

| Platform | Total Audited Calls | Avg Entry (₹) | Avg Stated Target Upside | Avg Stated Risk (Stoploss) | Avg Stated R:R Ratio |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Broker Research** | 110 | ₹1,001.28 | +6.89% | -3.61% | **1.98 : 1** |
| **Telegram** | 135 | ₹991.66 | +7.00% | -3.75% | **1.94 : 1** |
| **Twitter / X** | 203 | ₹991.89 | +7.68% | -4.18% | **1.90 : 1** |
| **YouTube** | 395 | ₹1,000.85 | +7.83% | -4.02% | **2.00 : 1** |

---

## 5. System Latency & Throughput Benchmark

All benchmarks measured across multiple runs under standard concurrency loads:

| System Component / Endpoint | Mean Latency (ms) | p95 Latency (ms) | Throughput (Requests/sec) |
| :--- | :---: | :---: | :---: |
| **Live Quotes API (1m Realtime NSE Stream)** | **1.73 ms** | 2.09 ms | **577.1 rps** |
| **Leaderboard Query (51 Creators)** | **3.19 ms** | 3.49 ms | **313.6 rps** |
| **Portfolio Simulator Engine (Cohort Backtest)** | **5.44 ms – 7.43 ms** | 7.63 ms | **134 – 183 rps** |
| **Home Feed Multi-Source Query (995 items)** | **8.99 ms** | 9.68 ms | **111.3 rps** |
| **Stocks Radar Query (50 Bluechip Tickers)** | **15.70 ms** | 16.04 ms | **63.7 rps** |
| **Instant Tip Fact-Checker (POST Regex/NLP)** | **838.00 ms** | 2,098.89 ms | **1.2 rps** |
