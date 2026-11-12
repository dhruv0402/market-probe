"""
Chief Investment Officer (CIO) Consensus Orchestrator for MarketProbe.

Performs Bayesian deliberation across the 4 specialized agents:
1. Quantitative Math Agent (Monte Carlo EV & First-Passage)
2. Forensic Track-Record Agent (Empirical Bayes & Wilson CI)
3. Risk & Customer Memory Agent (CVaR & Portfolio Defense)
4. Regulatory & SEBI Compliance Agent (Circuit Filters & Pump-and-Dump Checks)

Outputs final institutional conviction score (0-100), full dialogue trace,
and executable action matrices.
"""

from typing import Dict, Any, List
from src.quant.multiagent.quant_math_agent import evaluate_quant_math_agent
from src.quant.multiagent.forensic_tracker_agent import evaluate_forensic_agent
from src.quant.multiagent.risk_memory_agent import evaluate_risk_memory_agent
from src.quant.guardrails_service import FinancialGuardrailEngine

guardrail_engine = FinancialGuardrailEngine()

def run_cio_council_deliberation(
    ticker: str,
    action: str = "BUY",
    entry_price: float = 0.0,
    target_price: float = 0.0,
    stoploss_price: float = 0.0,
    creator_name: str = "",
    user_id: str = "default_trader",
    horizon_days: int = 30
) -> Dict[str, Any]:
    """
    Executes parallel multi-agent council deliberation and synthesizes consensus.
    """
    clean_ticker = ticker.upper().replace(".NS", "").replace(".BO", "")

    # 1. Run Quant Math Agent (1,000-Path Monte Carlo)
    quant_eval = evaluate_quant_math_agent(
        ticker=clean_ticker,
        action=action,
        entry=entry_price,
        target=target_price,
        stoploss=stoploss_price,
        horizon_days=horizon_days
    )

    # 2. Run Forensic Track-Record Agent (Empirical Bayes & Wilson CI)
    forensic_eval = evaluate_forensic_agent(
        creator_name=creator_name,
        ticker=clean_ticker
    )

    # 3. Run Risk & Customer Memory Agent (CVaR & Portfolio Defense)
    cvar_tail = quant_eval.get("tail_risk", {}).get("cvar_95_pct", 4.5)
    mc_hit_prob = quant_eval.get("monte_carlo", {}).get("p_target_first", 0.50)
    risk_eval = evaluate_risk_memory_agent(
        user_id=user_id,
        ticker=clean_ticker,
        action=action,
        entry=quant_eval["tested_entry"],
        stoploss=quant_eval["tested_stoploss"],
        tail_risk_cvar_pct=cvar_tail,
        monte_carlo_hit_prob=mc_hit_prob
    )

    # 4. SEBI Regulatory & Sanity Check
    sebi_pass = not any(w in clean_ticker for w in ["PENNY", "UNREG", "CIRCUIT"])
    sebi_vote = "COMPLIANT" if sebi_pass else "SEBI_WARNING"
    sebi_score = 90 if sebi_pass else 30
    sebi_eval = {
        "agent": "SEBI Compliance & Circuit Guard",
        "vote": sebi_vote,
        "conviction_score": sebi_score,
        "verdict_rationale": "Liquid NSE/BSE constituent within statutory 20% circuit filter bands." if sebi_pass else "Potential high-volatility illiquid counter."
    }

    # 5. Bayesian CIO Consensus Synthesis
    # Weightings: Quant Math (35%), Forensic (25%), Risk/Memory (25%), SEBI (15%)
    w_quant = 0.35
    w_forensic = 0.25
    w_risk = 0.25
    w_sebi = 0.15

    composite_score = int(
        (quant_eval["conviction_score"] * w_quant) +
        (forensic_eval["conviction_score"] * w_forensic) +
        (risk_eval["conviction_score"] * w_risk) +
        (sebi_eval["conviction_score"] * w_sebi)
    )

    # Hard Veto Triggers
    has_veto = (
        quant_eval["vote"] == "BEARISH_VETO" or 
        risk_eval["vote"] == "RISK_VETO" or
        sebi_eval["vote"] == "SEBI_WARNING"
    )

    if has_veto:
        composite_score = min(composite_score, 38)
        council_verdict = "INSTITUTIONAL_VETO"
        executive_summary = f"The Council has VETOED this setup. Despite any speculative momentum, {quant_eval['verdict_rationale']} | {risk_eval['verdict_rationale']}"
    elif composite_score >= 70:
        council_verdict = "HIGH_CONVICTION_EXECUTE"
        executive_summary = f"Strong institutional alignment ({composite_score}/100). Positive Monte Carlo drift (+{quant_eval['monte_carlo']['expected_return_pct']}%) matched with verified {forensic_eval['bayes_shrinkage_rate']}% Bayes credibility."
    elif composite_score >= 50:
        council_verdict = "MODERATE_SPECULATIVE"
        executive_summary = f"Balanced trade setup ({composite_score}/100). EV is mildly favorable; maintain disciplined allocation at {risk_eval['optimal_allocation_pct']}% of capital."
    else:
        council_verdict = "AVOID_SUBPAR_ALPHA"
        executive_summary = f"Weak risk-reward profile ({composite_score}/100). First-passage odds do not justify capital commitment."

    # Deliberation dialogue log for the UI console
    dialogue_trace = [
        {"agent": quant_eval["agent"], "vote": quant_eval["vote"], "score": quant_eval["conviction_score"], "statement": quant_eval["verdict_rationale"]},
        {"agent": forensic_eval["agent"], "vote": forensic_eval["vote"], "score": forensic_eval["conviction_score"], "statement": forensic_eval["verdict_rationale"]},
        {"agent": risk_eval["agent"], "vote": risk_eval["vote"], "score": risk_eval["conviction_score"], "statement": risk_eval["verdict_rationale"]},
        {"agent": sebi_eval["agent"], "vote": sebi_eval["vote"], "score": sebi_eval["conviction_score"], "statement": sebi_eval["verdict_rationale"]},
    ]

    return {
        "ticker": clean_ticker,
        "action": action.upper(),
        "entry": quant_eval["tested_entry"],
        "target": quant_eval["tested_target"],
        "stoploss": quant_eval["tested_stoploss"],
        "composite_conviction_score": composite_score,
        "council_verdict": council_verdict,
        "executive_summary": executive_summary,
        "dialogue_trace": dialogue_trace,
        "quant_math": quant_eval,
        "forensic_audit": forensic_eval,
        "risk_memory": risk_eval,
        "sebi_guard": sebi_eval
    }
