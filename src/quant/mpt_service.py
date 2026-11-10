import numpy as np
from scipy.optimize import minimize
from typing import Dict, Any, List

# Standard asset class annualized metrics (Expected Return, Volatility)
ASSET_METRICS = {
    "Direct Equity": {"return": 0.155, "volatility": 0.185},
    "Equity Funds": {"return": 0.125, "volatility": 0.142},
    "Debt Instruments": {"return": 0.072, "volatility": 0.048},
    "Gold": {"return": 0.095, "volatility": 0.115},
    "Crypto": {"return": 0.280, "volatility": 0.550}
}

# Correlation matrix across asset classes
ASSET_CLASSES = ["Direct Equity", "Equity Funds", "Debt Instruments", "Gold"]
CORRELATION_MATRIX = np.array([
    [1.00, 0.88, 0.12, -0.15],
    [0.88, 1.00, 0.18, -0.10],
    [0.12, 0.18, 1.00, 0.25],
    [-0.15, -0.10, 0.25, 1.00]
])

def compute_efficient_frontier() -> Dict[str, Any]:
    """
    Computes Markowitz Efficient Frontier curve and Tangency Portfolio weights.
    """
    returns = np.array([ASSET_METRICS[a]["return"] for a in ASSET_CLASSES])
    vols = np.array([ASSET_METRICS[a]["volatility"] for a in ASSET_CLASSES])
    
    # Construct Covariance Matrix: Cov = Vol_i * Vol_j * Corr_ij
    cov_matrix = np.outer(vols, vols) * CORRELATION_MATRIX
    num_assets = len(ASSET_CLASSES)
    risk_free_rate = 0.065 # 6.5% GOI 10Y Bond rate

    # Helper: Portfolio Performance
    def portfolio_performance(weights):
        p_ret = np.sum(weights * returns)
        p_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        return p_ret, p_vol

    # Helper: Negative Sharpe Ratio (for optimization)
    def neg_sharpe(weights):
        p_ret, p_vol = portfolio_performance(weights)
        return -(p_ret - risk_free_rate) / p_vol

    bounds = tuple((0.0, 1.0) for _ in range(num_assets))
    constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
    init_weights = np.array([1.0 / num_assets] * num_assets)

    # 1. Optimal Tangency Portfolio (Max Sharpe)
    opt_sharpe = minimize(neg_sharpe, init_weights, method='SLSQP', bounds=bounds, constraints=constraints)
    max_sharpe_weights = opt_sharpe.x
    max_sharpe_ret, max_sharpe_vol = portfolio_performance(max_sharpe_weights)
    max_sharpe_val = (max_sharpe_ret - risk_free_rate) / max_sharpe_vol

    # 2. Minimum Volatility Portfolio
    def min_vol_func(weights):
        return portfolio_performance(weights)[1]
    opt_vol = minimize(min_vol_func, init_weights, method='SLSQP', bounds=bounds, constraints=constraints)
    min_vol_weights = opt_vol.x
    min_vol_ret, min_vol_risk = portfolio_performance(min_vol_weights)

    # 3. Generate Efficient Frontier Curve Points
    target_returns = np.linspace(min_vol_ret, max(returns), 25)
    frontier_curve = []

    for target in target_returns:
        req_constraints = (
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0},
            {'type': 'eq', 'fun': lambda w: portfolio_performance(w)[0] - target}
        )
        res = minimize(min_vol_func, init_weights, method='SLSQP', bounds=bounds, constraints=req_constraints)
        if res.success:
            frontier_curve.append({
                "volatility_pct": round(float(res.fun) * 100, 2),
                "expected_return_pct": round(float(target) * 100, 2),
                "sharpe_ratio": round(float((target - risk_free_rate) / res.fun), 2)
            })

    # Format weights dictionary
    tangency_weights = {
        ASSET_CLASSES[i]: round(float(max_sharpe_weights[i]) * 100, 1)
        for i in range(num_assets)
    }

    return {
        "asset_classes": ASSET_CLASSES,
        "max_sharpe_portfolio": {
            "expected_return_pct": round(max_sharpe_ret * 100, 2),
            "volatility_pct": round(max_sharpe_vol * 100, 2),
            "sharpe_ratio": round(max_sharpe_val, 2),
            "weights_pct": tangency_weights
        },
        "min_variance_portfolio": {
            "expected_return_pct": round(min_vol_ret * 100, 2),
            "volatility_pct": round(min_vol_risk * 100, 2)
        },
        "efficient_frontier": frontier_curve
    }
