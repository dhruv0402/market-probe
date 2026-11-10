from typing import Dict, Any

def calculate_tax_loss_harvesting(realized_gains: float, unrealized_losses: float, holding_period_days: int) -> Dict[str, Any]:
    """
    Calculates tax savings achieved by harvesting unrealized capital losses against realized capital gains.
    Compliant with Section 70/71 of the Income Tax Act (STCG @ 20%, LTCG @ 12.5%).
    """
    is_long_term = holding_period_days > 365
    tax_rate = 0.125 if is_long_term else 0.20
    gain_type = "Long-Term Capital Gain (LTCG)" if is_long_term else "Short-Term Capital Gain (STCG)"

    # Eligible loss offset is limited to total realized gain
    harvestable_loss = min(realized_gains, unrealized_losses)
    net_taxable_gain = max(0.0, realized_gains - harvestable_loss)
    
    tax_before_harvest = realized_gains * tax_rate
    tax_after_harvest = net_taxable_gain * tax_rate
    tax_saved = tax_before_harvest - tax_after_harvest

    return {
        "realized_gains": realized_gains,
        "unrealized_losses": unrealized_losses,
        "gain_type": gain_type,
        "tax_rate_pct": round(tax_rate * 100, 1),
        "harvestable_loss_applied": harvestable_loss,
        "net_taxable_gain": net_taxable_gain,
        "tax_before_harvest": round(tax_before_harvest, 2),
        "tax_after_harvest": round(tax_after_harvest, 2),
        "tax_saved": round(tax_saved, 2),
        "recommendation": f"Harvest ₹{harvestable_loss:,.2f} of unrealized loss to save ₹{tax_saved:,.2f} in taxes."
    }
