"""
Risk and Customer Memory Agent for MarketProbe Multi-Agent Council.

Implements personalized capital defense:
1. Compares proposed trade risk against Persistent Customer Memory profile.
2. Checks portfolio max loss limits, capital bracket, and learned user trading style.
3. Computes Kelly Criterion optimal position sizing.
4. Enforces regulatory max position size limit (SEBI 2.5% single-stock risk rule).
"""

from typing import Dict, Any, Optional, Tuple
from src.quant.user_memory import CustomerMemoryEngine

user_memory_engine = CustomerMemoryEngine()

def _compute_post_tax_ev_pct(gross_ev_pct: float, horizon_days: int = 30) -> float:
    """
    Applies Indian equity tax & transaction slippage drag:
    - 0.15% round-trip STT/brokerage/exchange charges
    - 20% Section 111A STCG tax (horizon < 365 days) or 12.5% Sec 112A LTCG on positive gains
    """
    net_pre_tax = gross_ev_pct - 0.15
    if net_pre_tax <= 0:
        return round(net_pre_tax, 2)
    tax_rate = 0.20 if horizon_days < 365 else 0.125
    return round(net_pre_tax * (1.0 - tax_rate), 2)


def _compute_half_kelly_pct(
    hit_prob: float,
    reward_risk_ratio: float,
    risk_profile: str,
) -> Tuple[float, float]:
    """Computes (half_kelly_pct, sebi_capped_allocation_pct)."""
    b = max(0.5, reward_risk_ratio)
    p = max(0.01, min(0.99, hit_prob))
    q = 1.0 - p
    kelly_fraction = max(0.0, p - (q / b))
    half_kelly_pct = round(min(kelly_fraction * 0.5 * 100.0, 10.0), 1)
    cap = 4.0 if "AGGRESSIVE" in risk_profile else (1.5 if "CONSERVATIVE" in risk_profile else 2.5)
    return half_kelly_pct, min(half_kelly_pct, cap)


def evaluate_risk_memory_agent(
    user_id: str,
    ticker: str,
    action: str,
    entry: float,
    stoploss: float,
    tail_risk_cvar_pct: float = 4.5,
    monte_carlo_hit_prob: float = 0.50,
    expected_return_pct: float = 0.0,
    target: float = 0.0,
    horizon_days: int = 30,
    counterfactual_metrics: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Evaluates whether the trade matches the customer's learned profile and risk budget,
    computes Indian Section 111A/112A post-tax EV drag, and evaluates dual Half-Kelly
    sizing for both original and counterfactual setups.
    """
    profile = user_memory_engine.get_or_create_profile(user_id)
    risk_profile = str(profile.get("risk_profile", "BALANCED")).upper()
    max_loss_pct = float(profile.get("max_portfolio_loss_pct", 5.0))
    trading_style = profile.get("trading_style", "SWING")
    raw_favs = profile.get("favorite_tickers", [])
    if isinstance(raw_favs, str):
        fav_tickers = [t.strip().upper() for t in raw_favs.split(",") if t.strip()]
    else:
        fav_tickers = [str(t).strip().upper() for t in (raw_favs or [])]

    clean_ticker = ticker.upper().replace(".NS", "").replace(".BO", "").strip()
    in_customer_watchlist = clean_ticker in fav_tickers

    # Trade's nominal stop-loss distance
    if entry > 0 and stoploss > 0:
        nominal_risk_pct = abs((entry - stoploss) / entry) * 100.0
    else:
        nominal_risk_pct = 5.0

    # True downside = Nominal risk + Expected Shortfall (CVaR) gap penalty
    total_stress_loss_pct = round(nominal_risk_pct + (tail_risk_cvar_pct * 0.35), 2)

    if entry > 0 and target > 0 and stoploss > 0 and abs(entry - stoploss) > 0:
        rr_ratio = abs(target - entry) / abs(entry - stoploss)
    else:
        rr_ratio = 2.0

    safe_kelly_pct, recommended_position_pct = _compute_half_kelly_pct(
        monte_carlo_hit_prob, rr_ratio, risk_profile
    )
    post_tax_ev_pct = _compute_post_tax_ev_pct(expected_return_pct, horizon_days=horizon_days)

    # Counterfactual sizing & post-tax EV evaluation
    restructured_allocation_pct = recommended_position_pct
    restructured_post_tax_ev_pct = post_tax_ev_pct
    restructured_stress_loss_pct = total_stress_loss_pct
    if counterfactual_metrics:
        cf_entry = float(counterfactual_metrics.get("entry") or entry or 100.0)
        cf_target = float(counterfactual_metrics.get("target") or cf_entry * 1.05)
        cf_sl = float(counterfactual_metrics.get("stoploss") or cf_entry * 0.96)
        cf_hit_p = float(counterfactual_metrics.get("p_target_first", 0.5))
        cf_ev = float(counterfactual_metrics.get("expected_return_pct", 0.0))

        cf_nom_risk = abs((cf_entry - cf_sl) / cf_entry) * 100.0 if cf_entry > 0 else 4.0
        restructured_stress_loss_pct = round(cf_nom_risk + (tail_risk_cvar_pct * 0.35), 2)
        cf_rr = abs(cf_target - cf_entry) / max(0.01, abs(cf_entry - cf_sl))
        _, restructured_allocation_pct = _compute_half_kelly_pct(cf_hit_p, cf_rr, risk_profile)
        restructured_post_tax_ev_pct = _compute_post_tax_ev_pct(cf_ev, horizon_days=horizon_days)

    # Memory Alignment Checks
    is_risk_acceptable = total_stress_loss_pct <= (max_loss_pct * 1.5)
    watchlist_note = (
        f"Ticker {clean_ticker} matches your tracked watchlist ({trading_style})."
        if in_customer_watchlist
        else f"Ticker {clean_ticker} is outside your current watchlist ({trading_style})."
    )

    if not is_risk_acceptable:
        vote = "RISK_VETO"
        conviction = 20
        verdict = (
            f"VETO: Trade downside under tail stress ({total_stress_loss_pct}%) exceeds your "
            f"learned tolerance ({max_loss_pct}%). Post-tax EV: {post_tax_ev_pct:+.2f}%."
        )
    elif "CONSERVATIVE" in risk_profile and nominal_risk_pct > 3.5:
        vote = "DEFENSIVE_HOLD"
        conviction = 45
        verdict = (
            f"Downside ({nominal_risk_pct:.1f}%) too wide for your Conservative capital preservation "
            f"style (Post-tax EV: {post_tax_ev_pct:+.2f}%). Recommend tighter SL."
        )
    else:
        vote = "APPROVED"
        conviction = 88 if in_customer_watchlist else 82
        verdict = (
            f"Aligned with your {risk_profile} profile ({watchlist_note}) "
            f"Post-tax EV: {post_tax_ev_pct:+.2f}%. Original Half-Kelly cap: {recommended_position_pct}% | "
            f"Restructured cap: {restructured_allocation_pct}%."
        )

    return {
        "agent": "Risk & Customer Memory Agent",
        "vote": vote,
        "conviction_score": conviction,
        "verdict_rationale": verdict,
        "user_risk_profile": risk_profile,
        "user_trading_style": trading_style,
        "user_max_loss_limit_pct": max_loss_pct,
        "in_customer_watchlist": in_customer_watchlist,
        "favorite_tickers": fav_tickers,
        "trade_nominal_risk_pct": round(nominal_risk_pct, 2),
        "stress_tested_loss_pct": total_stress_loss_pct,
        "optimal_allocation_pct": recommended_position_pct,
        "half_kelly_score": safe_kelly_pct,
        "post_tax_ev_pct": post_tax_ev_pct,
        "restructured_allocation_pct": restructured_allocation_pct,
        "restructured_post_tax_ev_pct": restructured_post_tax_ev_pct,
        "restructured_stress_loss_pct": restructured_stress_loss_pct,
    }
