"""
Automated Data Hygiene, Provenance Classification & Proof-Hash Engine for MarketProbe.

Enforces three core institutional guarantees:
1. Proof Standard & Anti-Defamation:
   - Classifies every record into `VERIFIED_PRIMARY`, `ARCHIVED_UNVERIFIED`, or `SYNTHETIC_BENCHMARK`.
   - Generates an immutable SHA-256 `proof_hash` per recommendation tuple.
   - Preserves `stated_entry_price` so backtesting never silently rewrites historical claims.
2. Automated Data Hygiene:
   - Continuously audits and bounds corrupt penny prices, extreme R:R outliers, and return anomalies.
3. Live Freshness Telemetry:
   - Exposes structured health metrics for `/api/system/data-health`.
"""

import datetime
import hashlib
import os
import sqlite3
from typing import Any, Dict, Optional

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))

_LAST_HYGIENE_SUMMARY: Dict[str, Any] = {
    "last_run_utc": None,
    "schema_migrated": False,
    "proof_hashes_generated": 0,
    "hygiene_fixes_applied": 0,
}

GENERIC_HOMEPAGE_URLS = {
    "",
    "#",
    "https://www.youtube.com",
    "http://www.youtube.com",
    "https://youtube.com",
    "https://www.nseindia.com",
    "http://www.nseindia.com",
    "nse official stream",
    "https://research.brokerage.com",
    "direct input",
}


def compute_proof_hash(
    ticker: str,
    action: str,
    entry_price: float,
    target_price: float,
    stoploss_price: float,
    call_timestamp: str,
    source_url: str,
) -> str:
    """Deterministic SHA-256 fingerprint for tamper-evident audit trails."""
    canonical = (
        f"{(ticker or '').upper().strip()}|{(action or 'BUY').upper().strip()}|"
        f"{round(float(entry_price or 0.0), 2)}|{round(float(target_price or 0.0), 2)}|"
        f"{round(float(stoploss_price or 0.0), 2)}|{(call_timestamp or '').strip()}|"
        f"{(source_url or '').strip()}"
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:24]


SYNTHETIC_QUOTE_MARKERS = (
    "jackpot call",
    "huge buying seen!",
)

SYNTHETIC_TELEGRAM_HANDLES = (
    "t.me/sureshot_intraday_king/",
    "t.me/alpha_momentum_traders/",
    "t.me/nifty_hunters_vip/",
    "t.me/bharat_equity_signals/",
    "t.me/jackpot_multibagger_gems/",
)


def classify_verification_tier(
    platform: Optional[str],
    source_url: Optional[str],
    video_id: Optional[str],
    raw_quote: Optional[str] = None,
) -> str:
    """
    Honest provenance classification so synthetic/template rows never pollute
    primary-source creator accountability scores.
    """
    plat = (platform or "").strip()
    url = (source_url or "").strip().lower()
    quote_l = (raw_quote or "").strip().lower()

    if (
        plat in ("Automated EOD Ingestion", "INSTITUTIONAL_RESEARCH", "TEST_UPLOAD")
        or url in ("nse official stream", "https://research.brokerage.com")
        or any(m in quote_l for m in SYNTHETIC_QUOTE_MARKERS)
        or any(h in url for h in SYNTHETIC_TELEGRAM_HANDLES)
    ):
        return "SYNTHETIC_BENCHMARK"

    if plat == "YouTube" and video_id and len(str(video_id).strip()) == 11 and str(video_id).strip() != "OGcyDEj-qYo":
        return "VERIFIED_PRIMARY"

    if url and url not in GENERIC_HOMEPAGE_URLS and (
        url.startswith("http://") or url.startswith("https://")
    ):
        return "VERIFIED_PRIMARY"

    if plat in ("TEXT_DROP", "FILE_UPLOAD", "YOUTUBE"):
        return "USER_SUBMITTED"

    return "ARCHIVED_UNVERIFIED"


def ensure_provenance_schema(conn: sqlite3.Connection) -> None:
    """Idempotently adds proof-standard columns to recommendations."""
    cur = conn.cursor()
    existing_cols = {row[1] for row in cur.execute("PRAGMA table_info(recommendations)").fetchall()}
    if "verification_tier" not in existing_cols:
        cur.execute("ALTER TABLE recommendations ADD COLUMN verification_tier TEXT DEFAULT 'ARCHIVED_UNVERIFIED'")
    if "stated_entry_price" not in existing_cols:
        cur.execute("ALTER TABLE recommendations ADD COLUMN stated_entry_price REAL")
    if "proof_hash" not in existing_cols:
        cur.execute("ALTER TABLE recommendations ADD COLUMN proof_hash TEXT")
    conn.commit()


def run_hygiene_audit(db_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes a deterministic hygiene & proof-standard sweep across SQLite:
    - Migrates provenance columns if missing
    - Backfills immutable stated_entry_price, verification_tier, and SHA-256 proof_hash
    - Clamps any newly introduced extreme R:R or return anomalies
    """
    target_db = db_path or DB_PATH
    if not os.path.exists(target_db):
        return {"status": "db_missing", "db_path": target_db}

    conn = sqlite3.connect(target_db, timeout=30.0)
    conn.row_factory = sqlite3.Row
    ensure_provenance_schema(conn)
    cur = conn.cursor()

    rows = cur.execute(
        """
        SELECT id, platform, source_url, video_id, raw_quote, ticker, action,
               entry_price, target_price, stoploss_price, risk_reward_ratio,
               call_timestamp, actual_peak_return_pct, actual_max_drawdown_pct,
               verification_tier, stated_entry_price, proof_hash
        FROM recommendations
        """
    ).fetchall()

    hashes_added = 0
    fixes_applied = 0
    updates = []

    for r in rows:
        entry = float(r["entry_price"] or 0.0)
        target = float(r["target_price"] or 0.0)
        sl = float(r["stoploss_price"] or 0.0)
        rr = float(r["risk_reward_ratio"] or 0.0)
        peak = float(r["actual_peak_return_pct"] or 0.0)
        dd = float(r["actual_max_drawdown_pct"] or 0.0)

        tier = classify_verification_tier(r["platform"], r["source_url"], r["video_id"], r["raw_quote"])
        stated_entry = r["stated_entry_price"] if r["stated_entry_price"] is not None else entry
        p_hash = r["proof_hash"] or compute_proof_hash(
            r["ticker"], r["action"], stated_entry, target, sl, r["call_timestamp"], r["source_url"]
        )

        # Clean extreme bounds without fabricating new prices
        new_rr = rr
        if entry > 0 and target > 0 and sl > 0:
            calc_rr = round(min(6.0, max(0.3, abs(target - entry) / max(0.01, abs(entry - sl)))), 2)
            if rr <= 0.1 or rr > 10.0:
                new_rr = calc_rr

        new_peak = round(min(145.0, max(-55.0, peak)), 2)
        new_dd = round(max(-55.0, min(0.0, dd)), 2)

        needs_update = (
            r["verification_tier"] != tier
            or r["stated_entry_price"] is None
            or not r["proof_hash"]
            or abs(new_rr - rr) > 1e-4
            or abs(new_peak - peak) > 1e-4
            or abs(new_dd - dd) > 1e-4
        )
        if needs_update:
            if not r["proof_hash"]:
                hashes_added += 1
            if abs(new_rr - rr) > 1e-4 or abs(new_peak - peak) > 1e-4 or abs(new_dd - dd) > 1e-4:
                fixes_applied += 1
            updates.append((tier, stated_entry, p_hash, new_rr, new_peak, new_dd, r["id"]))

    if updates:
        cur.executemany(
            """
            UPDATE recommendations
            SET verification_tier = ?, stated_entry_price = ?, proof_hash = ?,
                risk_reward_ratio = ?, actual_peak_return_pct = ?, actual_max_drawdown_pct = ?
            WHERE id = ?
            """,
            updates,
        )
        conn.commit()

    tier_counts = dict(
        cur.execute("SELECT verification_tier, COUNT(*) FROM recommendations GROUP BY verification_tier").fetchall()
    )
    anomalies = cur.execute(
        """
        SELECT COUNT(*) FROM recommendations
        WHERE entry_price < 15 OR risk_reward_ratio > 10 OR actual_peak_return_pct > 150 OR actual_max_drawdown_pct < -60
        """
    ).fetchone()[0]
    latest_ts = cur.execute("SELECT MAX(call_timestamp) FROM recommendations").fetchone()[0]
    total_recs = cur.execute("SELECT COUNT(*) FROM recommendations").fetchone()[0]
    conn.close()

    now_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
    _LAST_HYGIENE_SUMMARY.update(
        {
            "last_run_utc": now_utc,
            "schema_migrated": True,
            "proof_hashes_generated": hashes_added,
            "hygiene_fixes_applied": fixes_applied,
            "tier_counts": tier_counts,
            "anomalies_remaining": int(anomalies),
            "latest_call_timestamp": latest_ts,
            "total_recommendations": int(total_recs),
        }
    )
    return dict(_LAST_HYGIENE_SUMMARY)


def get_data_health_report(
    live_feed_is_real: bool = False,
    last_quote_sync_epoch: float = 0.0,
    last_quote_sync_str: str = "",
    quotes_cached: int = 0,
) -> Dict[str, Any]:
    """Returns real-time data freshness, provenance coverage, and hygiene health telemetry."""
    if not _LAST_HYGIENE_SUMMARY.get("last_run_utc"):
        run_hygiene_audit()

    now_epoch = datetime.datetime.now(datetime.timezone.utc).timestamp()
    age_s = round(max(0.0, now_epoch - last_quote_sync_epoch), 1) if last_quote_sync_epoch > 0 else None

    if live_feed_is_real and age_s is not None and age_s < 300:
        quote_status = "LIVE_EXCHANGE"
    elif quotes_cached > 0:
        quote_status = "CACHED_SNAPSHOT"
    else:
        quote_status = "OFFLINE"

    tiers = _LAST_HYGIENE_SUMMARY.get("tier_counts", {})
    return {
        "status": "HEALTHY" if _LAST_HYGIENE_SUMMARY.get("anomalies_remaining", 0) == 0 else "NEEDS_HYGIENE",
        "quote_feed_status": quote_status,
        "live_feed_is_real": live_feed_is_real,
        "last_quote_sync": last_quote_sync_str or None,
        "quote_age_seconds": age_s,
        "quotes_cached": quotes_cached,
        "total_recommendations": _LAST_HYGIENE_SUMMARY.get("total_recommendations", 0),
        "verified_primary_calls": int(tiers.get("VERIFIED_PRIMARY", 0)),
        "archived_unverified_calls": int(tiers.get("ARCHIVED_UNVERIFIED", 0)),
        "user_submitted_calls": int(tiers.get("USER_SUBMITTED", 0)),
        "synthetic_excluded_calls": int(tiers.get("SYNTHETIC_BENCHMARK", 0)),
        "hygiene_anomalies_remaining": _LAST_HYGIENE_SUMMARY.get("anomalies_remaining", 0),
        "latest_call_timestamp": _LAST_HYGIENE_SUMMARY.get("latest_call_timestamp"),
        "last_hygiene_run_utc": _LAST_HYGIENE_SUMMARY.get("last_run_utc"),
        "sebi_compliance_mode": "EMPIRICAL_AUDIT_NON_ADVISORY",
    }
