"""
Automated Regression Tests for MarketProbe's Core Governance & Trust Pillars:
1. SEBI Non-Advisory Boundary (no execution solicitation or advisory directives).
2. Defamation & Proof Standard (SHA-256 proof hashes, Wilson 95% CI, zero fabricated calls/videos).
3. Data Freshness & Automated Hygiene (/api/system/data-health & zero DB anomalies).
4. Real Copilot Watchlist Persistence.
"""

import os
import sqlite3
from fastapi.testclient import TestClient

from src.backend.api import app
from src.backend.copilot_actions import execute_copilot_tool_cycle
from src.backend.security import get_user_watchlist, toggle_watchlist_item
from src.ingestion.daily_ingestion_service import run_daily_ingestion_job
from src.quant.guardrails_service import FinancialGuardrailEngine

client = TestClient(app)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(PROJECT_ROOT, "data", "marketprobe.db")


def test_sebi_non_advisory_boundary():
    """Verify explain, fact-check, and guardrails never emit unlawful BUY/EXECUTE directives."""
    resp = client.get("/api/ai/explain?entry=1378&target=1495&stoploss=1330&is_sebi=true")
    assert resp.status_code == 200
    data = resp.json()
    rec = data.get("recommendation", "").upper()
    assert "EXECUTE LONG" not in rec
    assert "EXECUTE SHORT" not in rec
    assert "sebi_disclaimer" in data

    fc = client.post("/api/audit-live-text", json={"text": "Buy RELIANCE at 1378 target 1495 sl 1330"})
    assert fc.status_code == 200
    fc_data = fc.json()
    assert "APPROVED (" not in fc_data.get("ai_recommendation", "")
    assert "not SEBI-registered" in fc_data.get("verdict_summary", "")

    sanitized = FinancialGuardrailEngine.check_output_guardrails("Guaranteed return — execute long now!")
    assert "guaranteed return" not in sanitized.lower()
    assert "execute long" not in sanitized.lower()
    assert "not a SEBI-registered" in sanitized


def test_proof_standard_and_no_fabricated_calls():
    """Verify every DB record has proof_hash + verification_tier, no fake OGcyDEj-qYo fallback, and zero synthetic fabrication."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    total = cur.execute("SELECT COUNT(*) FROM recommendations").fetchone()[0]
    unhashed = cur.execute("SELECT COUNT(*) FROM recommendations WHERE proof_hash IS NULL OR proof_hash = ''").fetchone()[0]
    conn.close()
    assert unhashed == 0, f"Found {unhashed} records missing SHA-256 proof_hash"

    # Triggering daily pipeline must NEVER fabricate fake recommendations under real creator names
    res = run_daily_ingestion_job()
    assert res["status"] == "COMPLETED"
    assert res["ingested_count"] == 0

    conn = sqlite3.connect(DB_PATH)
    after_total = conn.execute("SELECT COUNT(*) FROM recommendations").fetchone()[0]
    conn.close()
    assert after_total == total

    # Feed must never fabricate OGcyDEj-qYo video IDs
    feed = client.get("/api/home-feed?min_conviction=0").json()
    for tip in feed.get("recent_tips", []):
        assert tip.get("video_id") != "OGcyDEj-qYo"
        assert tip.get("proof_hash"), "Every feed item must expose SHA-256 proof_hash"
        assert tip.get("verification_tier") != "SYNTHETIC_BENCHMARK"

    # Leaderboard must expose Wilson 95% CI and transparent methodology
    lb = client.get("/api/leaderboard").json()
    assert "methodology" in lb
    assert lb["methodology"]["synthetic_excluded"] is True
    first = lb["leaderboard"][0]
    assert "wilson_low" in first and "wilson_high" in first
    assert 0.0 <= first["wilson_low"] <= first["win_rate"] <= first["wilson_high"] <= 100.0


def test_data_freshness_and_hygiene_endpoint():
    """Verify /api/system/data-health reports honest feed status and zero hygiene anomalies."""
    resp = client.get("/api/system/data-health")
    assert resp.status_code == 200
    h = resp.json()
    assert h["hygiene_anomalies_remaining"] == 0
    assert h["verified_primary_calls"] >= 2000
    assert h["quote_feed_status"] in ("LIVE_EXCHANGE", "CACHED_SNAPSHOT", "OFFLINE")
    assert h["sebi_compliance_mode"] == "EMPIRICAL_AUDIT_NON_ADVISORY"


def test_copilot_watchlist_actually_persists():
    """Verify Copilot 'add to watchlist' tool actually mutates SQLite instead of returning a fake message."""
    test_uid = "usr_test_watchlist_audit"
    res = execute_copilot_tool_cycle("Add RELIANCE to my watchlist", user_id=test_uid)
    assert res is not None
    assert res["tool_executed"] == "mutate_watchlist"
    items = [it["symbol"] for it in get_user_watchlist(test_uid)]
    assert "RELIANCE" in items
    # Clean up test row
    toggle_watchlist_item(test_uid, "RELIANCE")
