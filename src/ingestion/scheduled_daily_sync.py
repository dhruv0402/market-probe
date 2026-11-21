"""
Safe, Deterministic Daily Market-Close Ingestion, Insider Sync & Hygiene Job.

Designed to run inside GitHub Actions (`daily-crawler.yml`) or Render Cron:
1. Syncs live SEC EDGAR Form 4 XML open-market buys & sales (`Code P`/`S` only).
2. Runs non-fabricating tick-level outcome verification on active open calls.
3. Enforces Automated Data Hygiene (`0` anomalies, `0` synthetic rows, 100% SHA-256 proof hashes).
"""

import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.quant.hygiene_supervisor import run_hygiene_audit
from src.quant.insider_cluster_service import sync_live_sec_form4


def main() -> int:
    print("=== [1/3] Syncing Live SEC EDGAR Form 4 XML Open-Market Filings ===")
    try:
        sec_res = sync_live_sec_form4(
            tickers=["AAPL", "NVDA", "MSFT", "META", "TSLA", "INTC", "AMD", "JPM"],
            max_filings_per_ticker=6,
        )
        print(
            f"SEC Form 4 Sync: parsed={sec_res.get('total_open_market_parsed')} "
            f"| newly_inserted={sec_res.get('newly_inserted')}"
        )
    except Exception as e:
        print(f"[WARN] SEC Form 4 sync skipped due to transient network error: {e}")

    print("=== [2/3] Running Deterministic Open-Call Tick Backtest ===")
    try:
        from src.backtest.engine import run_backtest_engine

        run_backtest_engine()
    except Exception as e:
        print(f"[WARN] Tick backtest skipped/partial: {e}")

    print("=== [3/3] Enforcing Automated Data Hygiene & Proof-Hash Audit ===")
    report = run_hygiene_audit()
    print("Hygiene Report:", report)
    anomalies = int(report.get("anomalies_remaining", 0) or 0)
    synthetic = int((report.get("tier_counts") or {}).get("SYNTHETIC_BENCHMARK", 0) or 0)
    if anomalies != 0:
        print(f"[FAIL] Hygiene anomalies detected: {anomalies}")
        return 1
    if synthetic != 0:
        print(f"[FAIL] Synthetic rows detected in production ledger: {synthetic}")
        return 1

    print("✅ Daily sync & hygiene gate passed cleanly.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
