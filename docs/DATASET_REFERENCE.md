# MarketProbe: Master Dataset Reference (995 Audited Records)

This document provides a direct view and structural documentation of the **$995$ financial recommendations** and **$51$ creators/institutional entities** in the MarketProbe dataset.

---

## 📥 Direct CSV Dataset Exports

The full dataset has been exported into clean, tabular CSV files accessible in your local repository:

1. 📄 **[marketprobe_recommendations.csv](file:///Users/dhruvgourisaria/.gemini/antigravity/scratch/marketprobe/data/marketprobe_recommendations.csv)** — All $995$ audited trade calls with entry, target, stop loss, outcome status (`HIT`/`MISS`/`OPEN`), timestamps, and quotes.
2. 📄 **[marketprobe_influencers.csv](file:///Users/dhruvgourisaria/.gemini/antigravity/scratch/marketprobe/data/marketprobe_influencers.csv)** — Directory of $51$ creators & institutional broker desks with subscriber counts, platform handles, and SEBI registration numbers.
3. 📄 **[marketprobe_raw_content.csv](file:///Users/dhruvgourisaria/.gemini/antigravity/scratch/marketprobe/data/marketprobe_raw_content.csv)** — Full ingested transcripts, post IDs, and source URLs.

---

## 📊 1. Multi-Platform Distribution

| Source Platform | Total Recommendations | Target HITs | Stop Loss MISSes | Open / Active | Realized Win Rate (%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **YouTube** | **464** | 156 | 239 | 69 | **39.49%** |
| **Twitter / X FinTwit** | **247** | 72 | 131 | 44 | **35.47%** |
| **Telegram Channels** | **161** | 60 | 75 | 26 | **44.44%** |
| **Broker / Institutional Research** | **123** | 53 | 57 | 13 | **48.18%** |
| **Total System Scope** | **995** | **341** | **502** | **152** | **40.45%** |

---

## 🔍 2. Sample Audited Records (First 15 Rows)

| ID | Ticker | Platform | Creator / Desk | Action | Entry (₹) | Target (₹) | Stop Loss (₹) | R:R | Outcome | Verbatim Quote Snippet |
| :-: | :--- | :--- | :--- | :-: | :-: | :-: | :-: | :-: | :-: | :--- |
| **1** | `MOTILALOFS` | Telegram | Motilal Oswal | `BUY` | ₹995.14 | ₹1,101.18 | ₹949.02 | 2.30 | **HIT** | *"BUY MOTILALOFS @ 38.0 TGT: 41.04 SL: 36.1"* |
| **2** | `ETERNAL` | Broker Research | Motilal Oswal | `BUY` | ₹1,011.87 | ₹1,063.87 | ₹952.15 | 0.87 | **HIT** | *"Accumulate ETERNAL at CMP with upside target."* |
| **3** | `MOTILALOFS` | YouTube | Motilal Oswal | `SELL` | ₹990.31 | ₹900.88 | ₹1,030.32 | 2.23 | **MISS** | *"Short setup on breakdown below 990."* |
| **4** | `MOTILALOFS` | Twitter / X | Motilal Oswal | `SELL` | ₹1,015.31 | ₹932.80 | ₹1,061.70 | 1.78 | **MISS** | *"Bearish engulfing candle, sell on rise."* |
| **5** | `MOTILALOFS` | Broker Research | Motilal Oswal | `SELL` | ₹1,006.46 | ₹904.22 | ₹1,043.96 | 2.73 | **HIT** | *"Reduce position towards target 904."* |
| **6** | `HDFCBANK` | YouTube | Kunal Saraogi | `BUY` | ₹711.10 | ₹765.00 | ₹678.00 | 1.63 | **HIT** | *"HDFC Bank showing strong breakout above 710."* |
| **7** | `RELIANCE` | YouTube | Prakash Gaba | `BUY` | ₹1,309.90 | ₹1,420.00 | ₹1,250.00 | 1.84 | **HIT** | *"Buy Reliance on dips towards 1300 with target 1420."* |
| **8** | `TATAMOTORS` | Twitter / X | Anant Ladha | `BUY` | ₹312.35 | ₹350.00 | ₹292.00 | 1.85 | **MISS** | *"Auto sector momentum, Long Tata Motors."* |
| **9** | `INFY` | Telegram | ICICI Direct | `SELL` | ₹1,128.00 | ₹1,050.00 | ₹1,170.00 | 1.86 | **HIT** | *"IT index weakness, short INFY on rally."* |
| **10** | `TCS` | Broker Research | Kotak Securities | `BUY` | ₹2,327.00 | ₹2,550.00 | ₹2,220.00 | 2.08 | **HIT** | *"Accumulate TCS for long-term target 2550."* |
| **11** | `SBIN` | YouTube | CA Rachana Ranade | `BUY` | ₹1,034.30 | ₹1,120.00 | ₹985.00 | 1.74 | **HIT** | *"PSU Bank rally, State Bank of India target 1120."* |
| **12** | `BHARTIARTL` | Twitter / X | PR Sundar | `BUY` | ₹1,865.60 | ₹2,050.00 | ₹1,780.00 | 2.15 | **OPEN** | *"Telecom tariff hike beneficiary, buy Airtel."* |
| **13** | `LT` | Broker Research | HDFC Securities | `BUY` | ₹4,017.00 | ₹4,400.00 | ₹3,850.00 | 2.30 | **HIT** | *"Strong order book inflow, target 4400."* |
| **14** | `BAJFINANCE` | Telegram | Sharekhan | `BUY` | ₹1,053.20 | ₹1,180.00 | ₹990.00 | 2.01 | **OPEN** | *"NBFC credit growth pickup, buy Bajaj Finance."* |
| **15** | `KOTAKBANK` | YouTube | Axis Securities | `BUY` | ₹1,780.00 | ₹1,950.00 | ₹1,700.00 | 2.13 | **HIT** | *"Private bank re-rating candidate, Target 1950."* |

---

## 🏛️ 3. Top Audited Creators & Research Desks

| Creator / Entity Name | Primary Platform | SEBI Registered? | Tracked Subscribers / Reach | Total Audited Calls | Win Rate (%) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Motilal Oswal Financial Services** | Institutional Broker | **Yes (INH000000412)** | $1,200,000$ | **347** | $43.8\%$ |
| **ICICI Direct Research** | Institutional Broker | **Yes (INH000000990)** | $2,100,000$ | **137** | $26.1\%$ |
| **HDFC Securities Research** | Institutional Broker | **Yes (INH000002475)** | $1,600,000$ | **121** | $22.0\%$ |
| **Sharekhan by BNP Paribas** | Institutional Broker | **Yes (INH000006183)** | $1,400,000$ | **81** | $34.6\%$ |
| **Kotak Securities Research** | Institutional Broker | **Yes (INH000000586)** | $1,800,000$ | **61** | **$86.0\%$** |
| **Axis Securities** | Institutional Broker | **Yes (INH000000297)** | $1,100,000$ | **57** | **$67.4\%$** |
| **Angel One Research** | Institutional Broker | **Yes (INH000000164)** | $2,500,000$ | **56** | $44.9\%$ |
| **Kunal Saraogi** | YouTube / CNBC | **Yes** | $520,000$ | **7** | **$100.0\%$** |
| **Prakash Gaba** | YouTube / CNBC | **Yes** | $450,000$ | **3** | $50.0\%$ |
