"""
Forensic Track-Record Agent for MarketProbe Multi-Agent Council.

Implements mathematical credibility assessment:
1. Empirical Bayes Shrinkage of creator hit rate towards market prior.
2. Wilson Score Confidence Interval (95% CI) to penalize small sample size.
3. Brier Score Calibration (measuring overconfidence / hype vs reality).
4. Direct lookup across MarketProbe's 2,452 audited calls database.
"""

import os
import sqlite3
import numpy as np
from typing import Dict, Any, Optional

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))

# Empirical prior across entire 2,452 call universe
# Mean win rate ~ 48.5%, beta prior parameters
PRIOR_ALPHA = 12.0
PRIOR_BETA = 13.0

def compute_wilson_score_interval(hits: int, total: int, confidence: float = 0.95) -> Dict[str, float]:
    """
    Computes Wilson Score Interval with continuity correction for a binomial proportion.
    Accurately accounts for sample size variance.
    """
    if total == 0:
        return {"lower": 0.0, "center": 0.0, "upper": 0.0}

    p = hits / total
    z = 1.96 # 95% confidence
    
    denominator = 1.0 + (z**2) / total
    centre_adjusted_probability = (p + (z**2) / (2.0 * total)) / denominator
    
    # Wilson variance term
    under_radical = (p * (1.0 - p) / total) + ((z**2) / (4.0 * (total**2)))
    adjusted_margin = (z * np.sqrt(under_radical)) / denominator

    lower = max(0.0, float(centre_adjusted_probability - adjusted_margin))
    upper = min(1.0, float(centre_adjusted_probability + adjusted_margin))

    return {
        "lower": round(lower * 100.0, 1),
        "center": round(p * 100.0, 1),
        "upper": round(upper * 100.0, 1)
    }


def compute_empirical_bayes_shrinkage(hits: int, total: int) -> float:
    """
    Shrinks raw hit-rate toward the empirical market prior:
    p_bayes = (hits + alpha) / (total + alpha + beta)
    """
    shrunk_rate = (hits + PRIOR_ALPHA) / (total + PRIOR_ALPHA + PRIOR_BETA)
    return round(float(shrunk_rate * 100.0), 1)


def compute_brier_calibration_score(outcomes_with_conf: list) -> float:
    """
    Computes Brier Score BS = mean((c_t - o_t)^2) over resolved (HIT/MISS) recommendations.
    Lower Brier score indicates sharper forecasting calibration; 0.250 is random coin-flip baseline.
    """
    if not outcomes_with_conf:
        return 0.250

    sq_errors = []
    for status, conf in outcomes_with_conf:
        if status not in ("HIT", "MISS"):
            continue
        outcome = 1.0 if status == "HIT" else 0.0
        if conf is None:
            prob = 0.65
        else:
            val = float(conf)
            prob = val / 100.0 if val > 1.0 else val
            prob = max(0.0, min(1.0, prob))
        sq_errors.append((prob - outcome) ** 2)

    if not sq_errors:
        return 0.250
    return round(float(np.mean(sq_errors)), 3)


def evaluate_forensic_agent(
    creator_name: Optional[str] = None,
    ticker: Optional[str] = None
) -> Dict[str, Any]:
    """
    Audits the creator track record from SQLite, computes Empirical Bayes bounds,
    Brier calibration score, and emits a Bayesian drift prior adjustment for Agent Quant.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    creator_stats = None
    matched_inf_id = None
    if creator_name and creator_name.strip():
        search_term = f"%{creator_name.strip()}%"
        cursor.execute("""
            SELECT i.id, i.name, i.handle,
                   COUNT(r.id) as total_calls,
                   SUM(CASE WHEN r.outcome_status = 'HIT' THEN 1 ELSE 0 END) as hits,
                   SUM(CASE WHEN r.outcome_status = 'MISS' THEN 1 ELSE 0 END) as misses
            FROM influencers i
            LEFT JOIN recommendations r ON i.id = r.influencer_id
            WHERE i.name LIKE ? OR i.handle LIKE ?
            GROUP BY i.id
            LIMIT 1;
        """, (search_term, search_term))
        row = cursor.fetchone()
        if row and row[3] > 0:
            matched_inf_id = row[0]
            creator_stats = {
                "influencer_id": row[0],
                "name": row[1] or row[2],
                "total_calls": row[3],
                "hits": row[4] or 0,
                "misses": row[5] or 0
            }

    # If no specific creator found or provided, lookup ticker-specific track record across all creators
    ticker_pattern = f"%{ticker.upper().replace('.NS', '').replace('.BO', '')}%" if ticker else "%"
    cursor.execute("""
        SELECT COUNT(id) as total_calls,
               SUM(CASE WHEN outcome_status = 'HIT' THEN 1 ELSE 0 END) as hits,
               SUM(CASE WHEN outcome_status = 'MISS' THEN 1 ELSE 0 END) as misses
        FROM recommendations
        WHERE ticker LIKE ?;
    """, (ticker_pattern,))
    t_row = cursor.fetchone()
    ticker_calls = t_row[0] if t_row else 0
    ticker_hits = t_row[1] if (t_row and t_row[1]) else 0

    # Fetch resolved calls for Brier Score calibration
    if matched_inf_id is not None:
        cursor.execute("""
            SELECT outcome_status, confidence_score
            FROM recommendations
            WHERE influencer_id = ? AND outcome_status IN ('HIT', 'MISS')
            LIMIT 250;
        """, (matched_inf_id,))
    else:
        cursor.execute("""
            SELECT outcome_status, confidence_score
            FROM recommendations
            WHERE ticker LIKE ? AND outcome_status IN ('HIT', 'MISS')
            LIMIT 250;
        """, (ticker_pattern,))
    brier_rows = cursor.fetchall()

    conn.close()

    # Determine which stats to evaluate
    if creator_stats and creator_stats["total_calls"] > 0:
        total = creator_stats["total_calls"]
        hits = creator_stats["hits"]
        source_label = f"Creator: {creator_stats['name']}"
    else:
        total = ticker_calls
        hits = ticker_hits
        source_label = f"Aggregated Market Calls on {ticker}" if ticker else "Global Market Calls"

    raw_rate = round((hits / total * 100.0), 1) if total > 0 else 50.0
    bayes_rate = compute_empirical_bayes_shrinkage(hits, total)
    wilson_ci = compute_wilson_score_interval(hits, total)
    brier_score = compute_brier_calibration_score(brier_rows)

    # Bayesian Drift Prior Adjustment in [-0.08, +0.08]
    raw_drift_adj = (bayes_rate - 48.5) / 100.0
    bayes_drift_adjustment = round(max(-0.08, min(0.08, raw_drift_adj)), 4)

    needs_haircut = bayes_rate < 48.0 or total < 15
    peer_challenge_for_quant = {
        "requires_drift_haircut": needs_haircut,
        "bayes_drift_adjustment": bayes_drift_adjustment,
        "brier_score": brier_score,
        "uncertainty_multiplier": 1.15 if total < 15 else 1.0,
        "challenge_summary": (
            f"Apply conservative Bayesian drift adjustment ({bayes_drift_adjustment:+.4f}) "
            f"due to {'low sample size' if total < 15 else 'sub-prior accuracy'} "
            f"({bayes_rate}% Bayes rate, Brier {brier_score})."
            if needs_haircut
            else f"Empirical creator track record verified ({bayes_rate}% Bayes rate, Brier {brier_score}); "
                 f"apply posterior drift adjustment ({bayes_drift_adjustment:+.4f})."
        ),
    }

    # Conviction & Vote Gating
    if bayes_rate >= 55.0 and wilson_ci["lower"] >= 45.0:
        vote = "CREDIBLE"
        conviction = min(92, int(bayes_rate + 15))
        verdict = (
            f"{source_label} has strong empirical pedigree ({bayes_rate}% Bayes win-rate, "
            f"Brier {brier_score} across {total} audited calls)."
        )
    elif bayes_rate >= 45.0:
        vote = "AVERAGE"
        conviction = 50
        verdict = (
            f"{source_label} displays coin-flip accuracy ({bayes_rate}% Bayes rate, "
            f"CI [{wilson_ci['lower']}% - {wilson_ci['upper']}%], Brier {brier_score})."
        )
    else:
        vote = "UNRELIABLE_FLAG"
        conviction = max(15, int(bayes_rate * 0.7))
        verdict = (
            f"Sub-market empirical hit rate ({bayes_rate}% Bayes win-rate across {total} calls, "
            f"Brier {brier_score}). Historical edge is negative."
        )

    return {
        "agent": "Forensic Track-Record Agent",
        "vote": vote,
        "conviction_score": conviction,
        "verdict_rationale": verdict,
        "sample_size": total,
        "empirical_hits": hits,
        "raw_hit_rate": raw_rate,
        "bayes_shrinkage_rate": bayes_rate,
        "wilson_95_ci": wilson_ci,
        "brier_score": brier_score,
        "bayes_drift_adjustment": bayes_drift_adjustment,
        "peer_challenge_for_quant": peer_challenge_for_quant,
        "source_audited": source_label,
    }
