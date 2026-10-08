# Quantitative Auditing and Machine Learning Evaluation of Retail Equity Recommendations in Indian Social Media

**Abstract**  
The rapid expansion of retail participation in the Indian equity markets (over 160 million active Demat accounts) has coincided with an explosion of unverified financial advice across social platforms (YouTube, Telegram, and X/Twitter). Retail investors routinely execute trades based on informal stock recommendations with non-transparent track records and undisclosed conflicts of interest. In this paper, we introduce **MarketProbe**, an end-to-end framework for autonomous financial advice ingestion, precision Named Entity Recognition (NER), path-dependent tick-level backtesting, and outcome predictability modeling. Using a curated dataset of $N=160$ verified recommendations across the National Stock Exchange (NSE) universe, we benchmark four supervised classification architectures (Logistic Regression, Random Forest, LightGBM, and XGBoost). Our empirical findings indicate that retail stock call viability is highly predictable prior to execution ($\text{ROC-AUC} = 0.861 \pm 0.048$ with Random Forest). Shapley Additive Explanations (SHAP) reveal that *stated profit target distance* ($\text{Mean } |\text{SHAP}| = 1.0169$) and *downside risk buffer* ($\text{Mean } |\text{SHAP}| = 0.4743$) are the dominant mathematical determinants of call failure, demonstrating that aggressive upside promises strongly correlate with premature stop-loss breach.

---

## 1. Introduction & Background

Retail equity participation in emerging markets has structurally decoupled from traditional institutional research desks. In India, retail daily turnover in derivatives and cash equity frequently matches or exceeds institutional flows. However, this surge has created a substantial information asymmetry: informal influencers, unregistered advisors, and media commentators broadcast price recommendations (*"tips"*) to millions of retail followers without deterministic outcome tracking or standardized performance verification.

Traditional market microstructure literature has focused on news-lag and sentiment nowcasting of broad indices. However, individual retail stock calls possess explicit, bounded trade geometries consisting of:
1. An entry price ($P_{entry}$)
2. A stated target profit price ($P_{target}$)
3. A protective stop-loss price ($P_{stoploss}$)

We formulate the problem of financial tip evaluation as a deterministic path-dependent verification problem coupled with pre-execution safety classification:

$$\mathcal{T} = \{ \text{Ticker}, \text{Action} \in \{\text{BUY}, \text{SELL}\}, P_{entry}, P_{target}, P_{stoploss}, t_0 \}$$

---

## 2. Methodology & Architecture

```
┌────────────────────────────────────────────────────────┐
│              MARKETPROBE RESEARCH PIPELINE             │
├─────────────────┬──────────────────┬───────────────────┤
│ 1. PRECISION NER│ 2. PATH-DEPENDENT│ 3. EMPIRICAL ML   │
│                 │    BACKTESTING   │    BENCHMARKING   │
│ • Anti-Noise    │ • Day-by-Day OHLC│ • 4 Model Suite   │
│   Stoplist      │   Simulation     │ • Bootstrap CIs   │
│ • Fuzzy NSE Link│ • SL vs Target   │ • SHAP Ablation   │
│   (2,559 stocks)│ • Max Drawdown   │   Analysis        │
└─────────────────┴──────────────────┴───────────────────┘
```

### 2.1 Multi-Platform Financial NER & Entity Disambiguation
A major vulnerability in financial natural language processing is conversational ticker hallucination. In the Indian equity market, common vocabulary words overlap directly with active NSE listed companies (e.g., *"take"* $\rightarrow$ `TAKESOL`, *"delivery"* $\rightarrow$ `DELHIVERY`, *"in fact"* $\rightarrow$ `FACT`, *"beta"* $\rightarrow$ `BETADRUGS`).

To prevent false entity extraction, we designed a multi-stage **Precision Financial NER Engine**:
1. **Contextual Action Verification:** The text must contain explicit directional trade verbs ($\mathcal{V}_{trade} \in \{\text{BUY}, \text{ACCUMULATE}, \text{SELL}, \text{SHORT}\}$).
2. **Anti-Hallucination Filtering:** An explicit stoplist $\mathcal{S}_{false}$ rejects conversational homonyms.
3. **Fuzzy Entity Matching:** Candidate company names are linked against the official $2,559$ active NSE equity master list using token-sort Levenshtein similarity with an acceptance threshold $\theta \ge 0.92$.
4. **Numeric Geometry Extraction:** Regular expressions identify stated numeric levels:

$$R_{target} = \frac{P_{target} - P_{entry}}{P_{entry}} \times 100$$

$$R_{stoploss} = \frac{P_{entry} - P_{stoploss}}{P_{entry}} \times 100$$

$$\text{RR Ratio} = \frac{R_{target}}{|R_{stoploss}|}$$

---

### 2.2 Path-Dependent Tick Backtesting Formulation

Rather than evaluating whether a price eventually reached $P_{target}$ at any arbitrary point in history, our backtesting engine executes a realistic daily path simulation across historical OHLC price series $\{ (\text{Open}_t, \text{High}_t, \text{Low}_t, \text{Close}_t) \}_{t=1}^{T}$:

For a long position ($\text{Action} = \text{BUY}$):
* If $\text{Low}_t \le P_{stoploss}$, the trade is terminated immediately with status $\text{MISS}$ at $P_{exit} = P_{stoploss}$.
* Else if $\text{High}_t \ge P_{target}$, the trade is terminated with status $\text{HIT}$ at $P_{exit} = P_{target}$.
* Throughout the holding period, Maximum Drawdown is recorded:

$$\text{MaxDrawdown} = \min_{1 \le t \le \tau} \left( \frac{\text{Low}_t - P_{entry}}{P_{entry}} \times 100 \right)$$

---

## 3. Machine Learning Formulation & Results

### 3.1 Feature Vector Specification
The feature vector $\mathbf{x} \in \mathbb{R}^8$ contains strictly **pre-call informational variables** accessible at time $t_0$:
1. $x_1$: `implied_reward_pct` ($R_{target}$)
2. $x_2$: `implied_risk_pct` ($R_{stoploss}$)
3. $x_3$: `implied_rr_ratio` ($\text{RR Ratio}$)
4. $x_4$: `is_buy` (Binary directional indicator)
5. $x_5$: `log_audience` ($\log_{10}(\text{Followers} + 1)$)
6. $x_6$: `is_sebi` (Regulatory license indicator)
7. $x_7$: `has_breakout_kw` (Technical indicator phrasing)
8. $x_8$: `has_multibagger_words` (Hype penalty indicator)

### 3.2 Empirical Model Benchmark ($N=160$)

We evaluated four architectures under a $75/25$ stratified train/test split. To account for sample size variance ($N=160$), we compute $95\%$ binomial confidence intervals and bootstrap standard errors ($B=1,000$ resamples):

| Model Architecture | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) | ROC-AUC ($\pm 95\%$ CI) |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Random Forest (100 Trees)** | **84.6%** | **80.0%** | **66.7%** | **72.7%** | **0.861 $\pm 0.048$** |
| **LightGBM Classifier** | **84.6%** | **80.0%** | **66.7%** | **72.7%** | **0.852 $\pm 0.051$** |
| **XGBoost Classifier** | **79.5%** | **64.3%** | **75.0%** | **69.2%** | **0.827 $\pm 0.054$** |
| **Logistic Regression (L2)** | **82.1%** | **85.7%** | **50.0%** | **63.2%** | **0.682 $\pm 0.076$** |

---

### 3.3 SHAP Feature Importance & Empirical Findings

Using TreeSHAP on the ensemble models, we compute the mean absolute contribution of each feature to the log-odds of trade success:

| Feature Name | Mean \|SHAP\| Impact | Directional Effect | Empirical Interpretation |
|:---|:---:|:---:|:---|
| `implied_reward_pct` | **1.0169** | Negative | Stating aggressive profit targets ($>15\%$) strongly increases probability of failure. |
| `is_buy` | **0.6079** | Positive | Long bias in trending equity regimes exhibits higher follow-through. |
| `has_breakout_kw` | **0.4753** | Positive | Explicit technical level references correlate with structured execution. |
| `implied_risk_pct` | **0.4743** | Negative | Overly tight stop-losses induce premature market noise shakeouts. |
| `log_audience` | **0.0618** | Mixed | Creator reach shows minimal direct correlation with individual call alpha. |

---

## 4. Ethical, Legal, and Compliance Considerations

1. **Information Geometry vs Personal Character:** The framework evaluates stated numeric bounds ($P_{target}, P_{stoploss}$) and historical market path executions, avoiding subjective or defamatory assertions.
2. **SEBI Licensing Transparency:** Display of SEBI Research Analyst registration numbers (`INH...`) relies on public statutory disclosures to assist retail investors in identifying certified fiduciaries.
3. **Data Anonymization Options:** When evaluating uncertified social accounts, platforms can aggregate performance distributions by tier to prevent individual harassment while enforcing systemic transparency.

---

## 5. Conclusion & Future Work

This paper establishes that retail stock recommendations are amenable to automated natural language extraction, deterministic tick backtesting, and machine learning risk classification. By grounding advice quality in stated trade geometry rather than follower count, MarketProbe provides an empirical foundation for automated investor protection in high-velocity emerging markets. Future extensions will expand real-time ingestion across Telegram voice notes and integrate multi-modal audio conviction features.
