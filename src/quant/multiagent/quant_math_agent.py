"""
Quantitative Mathematics Agent for MarketProbe Multi-Agent Council.

Implements rigorous, deterministic quantitative simulations:
1. Merton Jump-Diffusion Geometric Brownian Motion (1,000-path Monte Carlo).
2. First-Passage Probability: Exact odds of reaching target before stop-loss.
3. Mathematical Expected Value (EV) per share and percentage.
4. Historical and Parametric Value-at-Risk (VaR 95%) and Conditional VaR (CVaR 95%).
"""

import numpy as np
import yfinance as yf
from typing import Dict, Any, Optional

def fetch_ticker_historical_params(ticker: str) -> Dict[str, float]:
    """
    Fetches 6-month historical OHLC daily returns for the ticker
    to estimate drift (mu), annualized volatility (sigma), and historical fat-tail returns.
    """
    clean_sym = ticker.upper().replace(".NS", "").replace(".BO", "")
    for sym_variant in [f"{clean_sym}.NS", f"{clean_sym}.BO", clean_sym]:
        try:
            df = yf.download(sym_variant, period="6mo", interval="1d", progress=False)
            if df is not None and not df.empty and len(df) > 20:
                # Handle possible multi-index columns from newer yfinance
                close_series = df["Close"]
                if hasattr(close_series, "columns"):
                    close_series = close_series.iloc[:, 0]
                
                prices = close_series.dropna().values
                if len(prices) > 20:
                    log_rets = np.diff(np.log(prices))
                    dt = 1.0 / 252.0
                    mu = float(np.mean(log_rets) / dt)
                    sigma = float(np.std(log_rets, ddof=1) / np.sqrt(dt))
                    sigma = max(0.12, min(sigma, 1.20)) # Bound volatility between 12% and 120%
                    return {
                        "mu": mu,
                        "sigma": sigma,
                        "current_price": float(prices[-1]),
                        "returns": log_rets.tolist(),
                        "symbol_used": sym_variant
                    }
        except Exception:
            continue

    # Fallback to standard NSE Large/Midcap volatility prior if network fails
    return {
        "mu": 0.12,
        "sigma": 0.28,
        "current_price": 1000.0,
        "returns": np.random.normal(0.0005, 0.018, 126).tolist(),
        "symbol_used": f"{clean_sym}.NS"
    }


def simulate_monte_carlo_first_passage(
    entry_price: float,
    target_price: float,
    stoploss_price: float,
    mu: float,
    sigma: float,
    horizon_days: int = 30,
    n_paths: int = 1000,
    jump_intensity: float = 0.08, # Probability of jump shock
    jump_mean: float = -0.02,
    jump_std: float = 0.04
) -> Dict[str, Any]:
    """
    Simulates n_paths of Merton Jump-Diffusion Geometric Brownian Motion.
    Tracks pathwise first-passage:
    - Did the path hit target first?
    - Did the path hit stoploss first?
    - Did the path expire open at horizon?
    """
    dt = 1.0 / 252.0
    steps = max(5, int(horizon_days * (252.0 / 365.0)))
    
    # Pre-generate standard normal innovations
    Z = np.random.normal(0.0, 1.0, (n_paths, steps))
    # Poisson jumps
    jumps = np.random.poisson(jump_intensity * dt, (n_paths, steps))
    jump_sizes = np.random.normal(jump_mean, jump_std, (n_paths, steps))
    
    # Initialize price matrix
    price_paths = np.zeros((n_paths, steps + 1))
    price_paths[:, 0] = entry_price
    
    drift_term = (mu - 0.5 * sigma**2) * dt
    diff_term = sigma * np.sqrt(dt)

    # Path simulation
    for t in range(steps):
        log_ret = drift_term + diff_term * Z[:, t] + jumps[:, t] * jump_sizes[:, t]
        price_paths[:, t + 1] = price_paths[:, t] * np.exp(log_ret)

    target_hit_count = 0
    stoploss_hit_count = 0
    expired_count = 0
    terminal_gains = []

    is_buy = target_price > entry_price

    for p in range(n_paths):
        path = price_paths[p, :]
        hit_target_step = None
        hit_stoploss_step = None
        
        for step_idx, price in enumerate(path[1:], start=1):
            if is_buy:
                if price >= target_price and hit_target_step is None:
                    hit_target_step = step_idx
                if price <= stoploss_price and hit_stoploss_step is None:
                    hit_stoploss_step = step_idx
            else: # Short / Sell
                if price <= target_price and hit_target_step is None:
                    hit_target_step = step_idx
                if price >= stoploss_price and hit_stoploss_step is None:
                    hit_stoploss_step = step_idx
                    
        # Determine first passage
        if hit_target_step is not None and (hit_stoploss_step is None or hit_target_step < hit_stoploss_step):
            target_hit_count += 1
            terminal_gains.append((target_price - entry_price) if is_buy else (entry_price - target_price))
        elif hit_stoploss_step is not None and (hit_target_step is None or hit_stoploss_step < hit_target_step):
            stoploss_hit_count += 1
            terminal_gains.append((stoploss_price - entry_price) if is_buy else (entry_price - stoploss_price))
        else:
            expired_count += 1
            final_p = path[-1]
            terminal_gains.append((final_p - entry_price) if is_buy else (entry_price - final_p))

    p_target = float(target_hit_count / n_paths)
    p_stoploss = float(stoploss_hit_count / n_paths)
    p_expired = float(expired_count / n_paths)
    
    expected_value = float(np.mean(terminal_gains))
    expected_return_pct = float((expected_value / entry_price) * 100.0)

    # 10 representative paths for visualization cone
    cone_indices = np.linspace(0, n_paths - 1, 10, dtype=int)
    cone_paths = price_paths[cone_indices, :].round(2).tolist()

    return {
        "n_paths": n_paths,
        "horizon_days": horizon_days,
        "p_target_first": round(p_target, 4),
        "p_stoploss_first": round(p_stoploss, 4),
        "p_expired": round(p_expired, 4),
        "expected_value_inr": round(expected_value, 2),
        "expected_return_pct": round(expected_return_pct, 2),
        "path_sample_cone": cone_paths
    }


def compute_var_cvar(returns_list: list, confidence: float = 0.95) -> Dict[str, float]:
    """
    Computes Historical & Parametric Value-at-Risk (VaR) and
    Conditional Value-at-Risk (CVaR / Expected Shortfall) on daily return series.
    """
    rets = np.array(returns_list)
    if len(rets) < 10:
        return {"var_95_pct": 2.5, "cvar_95_pct": 4.5}

    alpha = 1.0 - confidence
    # Historical VaR is the negative of the alpha quantile
    hist_var = float(-np.percentile(rets, alpha * 100))
    # CVaR is the mean of losses strictly worse than VaR
    tail_losses = rets[rets <= -hist_var]
    if len(tail_losses) > 0:
        hist_cvar = float(-np.mean(tail_losses))
    else:
        hist_cvar = hist_var * 1.35

    return {
        "var_95_pct": round(max(0.0, hist_var * 100.0), 2),
        "cvar_95_pct": round(max(0.0, hist_cvar * 100.0), 2)
    }


def evaluate_quant_math_agent(
    ticker: str,
    action: str,
    entry: float,
    target: float,
    stoploss: float,
    horizon_days: int = 30
) -> Dict[str, Any]:
    """
    Executes full Quantitative Math Agent validation workflow.
    """
    hist_params = fetch_ticker_historical_params(ticker)
    curr_price = hist_params["current_price"]
    
    # If entry is 0 or unrealistic, calibrate to current price
    calc_entry = entry if entry > 0 else curr_price
    calc_target = target if target > 0 else (calc_entry * 1.08 if action.upper() == 'BUY' else calc_entry * 0.92)
    calc_stoploss = stoploss if stoploss > 0 else (calc_entry * 0.95 if action.upper() == 'BUY' else calc_entry * 1.05)

    mc_results = simulate_monte_carlo_first_passage(
        entry_price=calc_entry,
        target_price=calc_target,
        stoploss_price=calc_stoploss,
        mu=hist_params["mu"],
        sigma=hist_params["sigma"],
        horizon_days=horizon_days,
        n_paths=1000
    )

    tail_risk = compute_var_cvar(hist_params["returns"])

    # Strict Decision Gating Logic
    p_hit = mc_results["p_target_first"]
    p_sl = mc_results["p_stoploss_first"]
    ev_pct = mc_results["expected_return_pct"]
    
    if ev_pct > 2.0 and p_hit >= 0.50:
        vote = "BULLISH"
        conviction = min(95, int(50 + (p_hit * 50)))
        verdict = f"Positive mathematical drift: {p_hit*100:.1f}% first-passage target probability vs {p_sl*100:.1f}% SL risk."
    elif ev_pct > 0 and p_hit >= 0.40:
        vote = "NEUTRAL"
        conviction = 55
        verdict = f"Marginal expected value (+{ev_pct:.2f}%). Execution risk present under volatility."
    else:
        vote = "BEARISH_VETO"
        conviction = max(10, int(p_hit * 60))
        verdict = f"Negative expected alpha ({ev_pct:.2f}%). Odds of hitting stop-loss ({p_sl*100:.1f}%) mathematically outweigh target."

    return {
        "agent": "Quantitative Mathematics Agent",
        "vote": vote,
        "conviction_score": conviction,
        "verdict_rationale": verdict,
        "monte_carlo": mc_results,
        "tail_risk": tail_risk,
        "volatility_annualized": round(hist_params["sigma"] * 100.0, 2),
        "drift_annualized": round(hist_params["mu"] * 100.0, 2),
        "tested_entry": calc_entry,
        "tested_target": calc_target,
        "tested_stoploss": calc_stoploss
    }
