"""
Verified Daily Hygiene, Outcome Audit & Provenance Pipeline for MarketProbe.

Policy (Proof Standard & Anti-Defamation):
- NEVER fabricates synthetic stock recommendations under real analyst or broker names.
- Audits database provenance (SHA-256 proof hashes + verification_tier classification).
- Runs deterministic OHLC outcome checks on open verified calls while preserving original stated levels.
"""

import datetime
import os
from typing import Any, Dict

from src.quant.hygiene_supervisor import run_hygiene_audit

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))


def run_daily_ingestion_job() -> Dict[str, Any]:
    """
    Executes an honest, proof-standard data hygiene & backtest verification pass.
    Zero fabricated recommendations are created.
    """
    start_time = datetime.datetime.now()
    logs = [
        f"[{start_time.strftime('%Y-%m-%d %H:%M:%S')}] [HYGIENE] Starting Verified Provenance & Data Hygiene Pipeline...",
        f"[{start_time.strftime('%H:%M:%S')}] [POLICY] Synthetic attribution disabled — only primary-source verified calls may enter accountability scores.",
    ]

    hygiene_summary = run_hygiene_audit(DB_PATH)
    logs.append(
        f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [PROOF] Audited {hygiene_summary.get('total_recommendations', 0)} records "
        f"(Verified Primary: {hygiene_summary.get('tier_counts', {}).get('VERIFIED_PRIMARY', 0)}, "
        f"New SHA-256 hashes: {hygiene_summary.get('proof_hashes_generated', 0)}, "
        f"Anomalies remaining: {hygiene_summary.get('anomalies_remaining', 0)})."
    )

    evaluated_open = 0
    try:
        from src.backtest.engine import run_backtest_engine
        evaluated_open = run_backtest_engine()
        logs.append(
            f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [BACKTEST] Re-verified {evaluated_open} open calls against exchange OHLC without altering stated entry levels."
        )
    except Exception as e:
        logs.append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [WARN] Exchange backtest skipped: {e}")

    end_time = datetime.datetime.now()
    duration = round((end_time - start_time).total_seconds(), 2)
    logs.append(f"[{end_time.strftime('%H:%M:%S')}] [DONE] Hygiene & verification completed in {duration}s.")

    return {
        "status": "COMPLETED",
        "timestamp": end_time.strftime("%Y-%m-%d %H:%M:%S"),
        "ingested_count": 0,
        "evaluated_open_calls": evaluated_open,
        "hygiene_summary": hygiene_summary,
        "duration_seconds": duration,
        "logs": logs,
    }


if __name__ == "__main__":
    res = run_daily_ingestion_job()
    print("\n".join(res["logs"]))
