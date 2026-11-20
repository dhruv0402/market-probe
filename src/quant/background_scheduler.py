"""
Background Data Hygiene & Outcome Verification Scheduler for MarketProbe.

Replaces legacy synthetic call generation (which posed defamation & provenance risks)
with a clean automated supervisor that:
1. Runs deterministic data hygiene & SHA-256 proof-hash auditing.
2. Evaluates open verified recommendations against exchange OHLC data without mutating stated entries.
3. Keeps `/api/system/data-health` continuously fresh.
"""

import asyncio
import os
from src.quant.hygiene_supervisor import run_hygiene_audit

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))


async def run_continuous_ingestion_loop(interval_seconds: int = 1800):
    """Runs a non-blocking automated hygiene & verification loop inside FastAPI."""
    while True:
        try:
            summary = await asyncio.to_thread(run_hygiene_audit, DB_PATH)
            print(
                f"[HYGIENE SUPERVISOR] Audited {summary.get('total_recommendations', 0)} records | "
                f"Verified Primary: {summary.get('tier_counts', {}).get('VERIFIED_PRIMARY', 0)} | "
                f"Anomalies: {summary.get('anomalies_remaining', 0)}"
            )
        except Exception as e:
            print(f"[HYGIENE SUPERVISOR] Cycle notice: {e}")

        await asyncio.sleep(interval_seconds)
