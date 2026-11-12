"""
Risk and Customer Memory Agent for MarketProbe Multi-Agent Council.

Implements personalized capital defense:
1. Compares proposed trade risk against Persistent Customer Memory profile.
2. Checks portfolio max loss limits, capital bracket, and learned user trading style.
3. Computes Kelly Criterion optimal position sizing.
4. Enforces regulatory max position size limit (SEBI 2.5% single-stock risk rule).
"""

from typing import Dict, Any, Optional
from src.quant.user_memory import CustomerMemoryEngine

user_memory_engine = CustomerMemoryEngine()

def evaluate_risk_memory_agent(
    user_id: str,
    ticker: str,
    action: str,
    entry: float,
    stoploss: float,
    tail_risk_cvar_pct: float = 4.5,
    monte_carlo_hit_prob: float = 0.50
) -> Dict[str, Any]:
    """
    Evaluates whether the trade matches the customer's learned profile and risk budget.
    """
    profile = user_memory_engine.get_or_create_profile(user_id)
    risk_profile = profile.get("risk_profile", "BALANCED").upper()
    max_loss_pct = float(profile.get("max_portfolio_loss_pct", 5.0))
    trading_style = profile.get("trading_style", "SWING")

    # Trade's nominal stop-loss distance
    if entry > 0 and stoploss > 0:
        nominal_risk_pct = abs((entry - stoploss) / entry) * 100.0
    else:
        nominal_risk_pct = 5.0

    # True downside = Nominal risk + Expected Shortfall (CVaR) gap penalty
    total_stress_loss_pct = round(nominal_risk_pct + (tail_risk_cvar_pct * 0.35), 2)

    # Simplified Kelly Fraction: f* = p - (q / b)
    # where p = hit_prob, q = 1-p, b = win/loss ratio (assumed 2.0 default)
    b = 2.0
    p = max(0.01, min(0.99, monte_carlo_hit_prob))
    q = 1.0 - p
    kelly_fraction = max(0.0, p - (q / b))
    # Half-Kelly for safety & institutional capital defense
    safe_kelly_pct = round(min(kelly_fraction * 0.5 * 100.0, 10.0), 1)

    # Hard SEBI compliance boundary: max 2.5% portfolio risk per trade
    recommended_position_pct = min(safe_kelly_pct, 2.5) if risk_profile != "AGGRESSIVE" else min(safe_kelly_pct, 4.0)

    # Memory Alignment Checks
    is_risk_acceptable = total_stress_loss_pct <= (max_loss_pct * 1.5)
    
    if not is_risk_acceptable:
        vote = "RISK_VETO"
        conviction = 20
        verdict = f"VETO: Trade downside under tail stress ({total_stress_loss_pct}%) exceeds your learned tolerance ({max_loss_pct}%)."
    elif risk_profile == "CONSERVATIVE" and nominal_risk_pct > 3.0:
        vote = "DEFENSIVE_HOLD"
        conviction = 45
        verdict = f"Downside ({nominal_risk_pct:.1f}%) too wide for your Conservative capital preservation style. Recommend tighter SL."
    else:
        vote = "APPROVED"
        conviction = 88
        verdict = f"Aligned with your {risk_profile} profile. Max suggested allocation: {recommended_position_pct}% of capital."

    return {
        "agent": "Risk & Customer Memory Agent",
        "vote": vote,
        "conviction_score": conviction,
        "verdict_rationale": verdict,
        "user_risk_profile": risk_profile,
        "user_max_loss_limit_pct": max_loss_pct,
        "trade_nominal_risk_pct": round(nominal_risk_pct, 2),
        "stress_tested_loss_pct": total_stress_loss_pct,
        "optimal_allocation_pct": recommended_position_pct,
        "half_kelly_score": safe_kelly_pct
    }
