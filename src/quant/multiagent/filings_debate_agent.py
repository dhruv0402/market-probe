"""
Bull vs. Bear AI Filings Debate & CIO Judge Engine (Phase 1) for MarketProbe.

Orchestrates a 3-Agent Adversarial Filings Debate grounded strictly in real
SEC EDGAR filings (10-K, 20-F, 10-Q, XBRL CompanyFacts) or uploaded NSE/BSE
Annual Report / Concall PDFs:
  1. Bull Counsel Agent    -> 3-4 evidence-cited thesis claims
  2. Bear Counsel Agent    -> 3-4 forensic counter-arguments & direct rebuttals
  3. Bull Rebuttal Round   -> concise defense against Bear's sharpest risk points
  4. CIO Debate Judge      -> scores Evidence Grounding, Financial Rigor, Risk Realism
                              and issues an empirical verdict + conviction delta (-15..+15)

SEBI Compliance: Outputs strictly empirical filing audits and risk simulations —
never personalized buy/sell directives.
"""

import json
import time
from typing import Any, Dict, List, Optional

from src.quant.llm_orchestrator import get_orchestrator
from src.quant.multiagent.message_bus import AgentMessageBus
from src.quant.sec_edgar_service import fetch_company_filings_context


SEBI_SYSTEM_GUARD = (
    "You are an institutional equity filings forensic analyst inside MarketProbe. "
    "You ONLY produce empirical document audits grounded in supplied SEC EDGAR XBRL facts "
    "and corporate filing excerpts. NEVER invent numbers not present in the context, and "
    "NEVER output personalized buy/sell investment advice or SEBI-prohibited trade directives. "
    "Return strictly valid JSON matching the requested schema."
)


def _build_evidence_dossier(ctx: Dict[str, Any]) -> str:
    xbrl = ctx.get("xbrl_snapshot") or {}
    filings = ctx.get("filings") or []
    latest_forms = ", ".join(
        f"{f['form']} ({f['filing_date']}, acc:{f['accession_no']})" for f in filings[:4]
    ) or "Uploaded PDF / Corpus Context"

    lines = [
        f"Company: {ctx.get('company_name')} | Ticker: {ctx.get('ticker')} | CIK: {ctx.get('cik') or 'NSE-Only'}",
        f"Source Mode: {ctx.get('source_mode')} | Recent Filings: {latest_forms}",
    ]
    if xbrl:
        lines.append(
            "Audited XBRL CompanyFacts ("
            f"Period End: {xbrl.get('period_end', 'N/A')}, Unit: {xbrl.get('currency_unit', 'USD')}): "
            f"Revenue={xbrl.get('revenue_formatted')} (YoY: {xbrl.get('revenue_yoy_pct')}%), "
            f"Net Income={xbrl.get('net_income_formatted')} (YoY: {xbrl.get('net_income_yoy_pct')}%), "
            f"Net Margin={xbrl.get('net_margin_pct')}%, "
            f"Operating Margin={xbrl.get('operating_margin_pct')}%, "
            f"Operating Cash Flow={xbrl.get('operating_cash_flow_formatted')} "
            f"(OCF/NetIncome={xbrl.get('ocf_to_net_income_ratio')}x), "
            f"Cash={xbrl.get('cash_formatted')}, "
            f"Long-Term Debt={xbrl.get('debt_formatted')} "
            f"(Cash/Debt={xbrl.get('cash_to_debt_ratio')}x), "
            f"Diluted EPS={xbrl.get('diluted_eps')} (prior: {xbrl.get('diluted_eps_prev')})."
        )
    excerpt = (ctx.get("filing_excerpt") or "").strip()
    if excerpt:
        lines.append(f"Primary Filing Excerpt:\n{excerpt[:3200]}")
    return "\n".join(lines)


def _deterministic_fallback_debate(ctx: Dict[str, Any]) -> Dict[str, Any]:
    """
    Zero-downtime deterministic XBRL-driven Bull vs. Bear debate used only if all
    cloud LLM nodes are unreachable or rate-limited.
    """
    ticker = ctx.get("ticker", "UNKNOWN")
    xbrl = ctx.get("xbrl_snapshot") or {}
    primary = ctx.get("latest_primary_filing") or {}
    ref = f"{primary.get('form', 'Filing')} ({primary.get('filing_date', 'Latest')})" if primary else "Corporate Filing / Corpus"

    rev_yoy = xbrl.get("revenue_yoy_pct")
    net_margin = xbrl.get("net_margin_pct")
    ocf_ratio = xbrl.get("ocf_to_net_income_ratio")
    cash_debt = xbrl.get("cash_to_debt_ratio")

    bull_points = [
        {
            "id": "B1",
            "title": "Top-Line Scale & Audited Revenue Durability",
            "claim": (
                f"{ctx.get('company_name')} reports audited revenue of {xbrl.get('revenue_formatted', 'N/A')} "
                f"with YoY expansion of {rev_yoy if rev_yoy is not None else 'N/A'}%, evidencing core franchise scale."
            ),
            "filing_ref": f"XBRL {ref}",
            "metric_evidence": f"Revenue: {xbrl.get('revenue_formatted', 'N/A')} | YoY: {rev_yoy}%",
            "quote": f"Period ended {xbrl.get('period_end', 'Latest FY')} reported {xbrl.get('revenue_formatted', 'audited top-line')}.",
            "strength_score": 82 if (rev_yoy or 0) > 8 else 68,
        },
        {
            "id": "B2",
            "title": "Profitability & Operating Cash Conversion",
            "claim": (
                f"Net profitability stands at {xbrl.get('net_income_formatted', 'N/A')} "
                f"(Net Margin: {net_margin if net_margin is not None else 'N/A'}%) backed by "
                f"{xbrl.get('operating_cash_flow_formatted', 'N/A')} in operating cash flow."
            ),
            "filing_ref": f"XBRL Cash Flow Statement ({ref})",
            "metric_evidence": f"Net Margin: {net_margin}% | OCF/NI: {ocf_ratio}x",
            "quote": f"Operating cash flow reached {xbrl.get('operating_cash_flow_formatted', 'positive territory')}.",
            "strength_score": 84 if (net_margin or 0) >= 15 else 70,
        },
        {
            "id": "B3",
            "title": "Balance Sheet Liquidity Buffer",
            "claim": (
                f"Cash and equivalents of {xbrl.get('cash_formatted', 'N/A')} provide capital flexibility "
                f"against long-term debt obligations of {xbrl.get('debt_formatted', 'N/A')}."
            ),
            "filing_ref": f"XBRL Balance Sheet ({ref})",
            "metric_evidence": f"Cash: {xbrl.get('cash_formatted', 'N/A')} | Cash/Debt: {cash_debt}x",
            "quote": f"Liquidity reserve reported at {xbrl.get('cash_formatted', 'N/A')} as of {xbrl.get('period_end', 'latest filing')}.",
            "strength_score": 78 if (cash_debt or 0) >= 1.0 else 62,
        },
    ]

    bear_points = [
        {
            "id": "R1",
            "title": "Growth Deceleration & Base-Effect Compression Risk",
            "claim": (
                f"Sustaining high multiple expectations on a {xbrl.get('revenue_formatted', 'large')} revenue base "
                f"exposes {ticker} to asymmetric valuation drawdown if YoY growth ({rev_yoy}%) moderates."
            ),
            "rebuts_bull_point": "B1",
            "filing_ref": f"Item 1A Risk Factors ({ref})",
            "metric_evidence": f"YoY Revenue Delta: {rev_yoy}%",
            "quote": "Disclosed macro, competitive pricing, and cyclical demand risks can compress top-line trajectory.",
            "severity_score": 80 if (rev_yoy is None or rev_yoy < 10) else 66,
        },
        {
            "id": "R2",
            "title": "Margin Sensitivity & Cash-Conversion Scrutiny",
            "claim": (
                f"Operating and net margins ({net_margin}%) face input-cost, wage, or capex intensity headwinds; "
                f"cash conversion ratio ({ocf_ratio}x) must be monitored for working-capital drag."
            ),
            "rebuts_bull_point": "B2",
            "filing_ref": f"MD&A Margin Discussion ({ref})",
            "metric_evidence": f"Op Margin: {xbrl.get('operating_margin_pct')}% | OCF/NI: {ocf_ratio}x",
            "quote": "Rising operating costs or capital expenditure cycles may pressure free cash flow yield.",
            "severity_score": 76 if (ocf_ratio is not None and ocf_ratio < 0.95) else 64,
        },
        {
            "id": "R3",
            "title": "Leverage & Refinancing / Regulatory Overhang",
            "claim": (
                f"Long-term debt of {xbrl.get('debt_formatted', 'N/A')} (Cash/Debt: {cash_debt}x) alongside "
                f"jurisdictional regulatory disclosures creates tail-risk under tighter credit conditions."
            ),
            "rebuts_bull_point": "B3",
            "filing_ref": f"Debt Footnote & Risk Disclosures ({ref})",
            "metric_evidence": f"Long-Term Debt: {xbrl.get('debt_formatted', 'N/A')}",
            "quote": "Debt covenants, FX exposure, and regulatory compliance remain material downside vectors.",
            "severity_score": 79 if (cash_debt is not None and cash_debt < 0.6) else 61,
        },
    ]

    bull_rebuttals = [
        {
            "target_bear_id": "R1",
            "rebuttal": (
                f"Audited profitability ({xbrl.get('net_income_formatted', 'N/A')}) and cash generation "
                f"cushion cyclical deceleration better than leveraged peers."
            ),
        },
        {
            "target_bear_id": "R2",
            "rebuttal": (
                f"Sustained operating margin ({xbrl.get('operating_margin_pct')}%) reflects pricing discipline "
                f"despite documented macro headwinds."
            ),
        },
    ]

    bull_total = round(sum(p["strength_score"] for p in bull_points) / len(bull_points))
    bear_total = round(sum(p["severity_score"] for p in bear_points) / len(bear_points))
    diff = bull_total - bear_total
    if diff >= 6:
        winner = "BULL_WIN"
        delta = min(15, max(4, diff))
    elif diff <= -6:
        winner = "BEAR_WIN"
        delta = max(-15, min(-4, diff))
    else:
        winner = "SPLIT_DECISION"
        delta = diff

    return {
        "bull_counsel": {
            "thesis_summary": f"Audited filings support durable franchise cash flows for {ticker}.",
            "arguments": bull_points,
            "rebuttals": bull_rebuttals,
        },
        "bear_counsel": {
            "thesis_summary": f"Forensic filing audit flags valuation, margin, and macro risk asymmetry for {ticker}.",
            "arguments": bear_points,
        },
        "cio_judge": {
            "winner": winner,
            "filing_conviction_delta": int(delta),
            "bull_scores": {
                "evidence_grounding": min(95, bull_total + 5),
                "financial_rigor": bull_total,
                "risk_realism": max(55, bull_total - 8),
            },
            "bear_scores": {
                "evidence_grounding": min(95, bear_total + 4),
                "financial_rigor": bear_total,
                "risk_realism": min(94, bear_total + 6),
            },
            "verdict_headline": (
                f"Empirical Filings Audit: {winner.replace('_', ' ')} "
                f"(Filing Bias {delta:+d} pts for Council Calibration)"
            ),
            "institutional_memo": (
                f"Across audited {ref} disclosures for {ctx.get('company_name')}, "
                f"Bull Counsel scored {bull_total}/100 on cash-flow & scale evidence while "
                f"Bear Counsel scored {bear_total}/100 on risk & margin scrutiny. "
                f"This filing audit informs quantitative risk calibration only and is not investment advice."
            ),
            "key_deciding_factor": (
                f"Net Margin ({net_margin}%), YoY Revenue Growth ({rev_yoy}%), and Cash/Debt ({cash_debt}x)."
            ),
        },
        "llm_nodes_used": ["deterministic_xbrl_fallback"],
    }


def _clamp_score(val: Any, default: int = 70) -> int:
    try:
        return max(0, min(100, int(round(float(val)))))
    except Exception:
        return default


async def run_filings_debate(
    ticker: str,
    horizon_days: int = 30,
    pdf_bytes: Optional[bytes] = None,
    pdf_filename: Optional[str] = None,
    user_id: str = "institutional_desk",
) -> Dict[str, Any]:
    """
    Executes the full Bull vs. Bear Filings Debate + CIO Judge pipeline and
    publishes structured debate packets onto the Council Message Bus.
    """
    t0 = time.perf_counter()
    ctx = fetch_company_filings_context(ticker, pdf_bytes=pdf_bytes, pdf_filename=pdf_filename)
    dossier = _build_evidence_dossier(ctx)
    router = get_orchestrator()
    nodes_used: List[str] = []

    # --- ROUND 1: BULL COUNSEL ---
    bull_prompt = f"""
Analyze the following audited corporate filings dossier for {ctx['ticker']} (analytical horizon: {horizon_days} days).
Act as BULL COUNSEL. Present 3 strong, strictly evidence-grounded bullish fundamental arguments citing exact numbers or risk/MD&A disclosures from the dossier.

DOSSIER:
{dossier}

Return strictly valid JSON with schema:
{{
  "thesis_summary": "1-2 sentence bull thesis grounded in filings",
  "arguments": [
    {{
      "id": "B1",
      "title": "Short institutional headline",
      "claim": "Quantitative fundamental argument grounded in the filing",
      "filing_ref": "Exact filing e.g. 10-K FY2025 / 20-F XBRL / Uploaded PDF p.4",
      "metric_evidence": "Exact figure e.g. Revenue $391B (+2.0% YoY)",
      "quote": "Short verbatim or exact fact citation from dossier",
      "strength_score": 82
    }}
  ]
}}
"""
    bull_data, bull_node = await router.execute_json_generation(
        bull_prompt, system_instruction=SEBI_SYSTEM_GUARD, timeout=14.0
    )
    if bull_data and isinstance(bull_data.get("arguments"), list) and len(bull_data["arguments"]) >= 1:
        nodes_used.append(f"bull:{bull_node}")
    else:
        fallback = _deterministic_fallback_debate(ctx)
        return _finalize_debate_response(ctx, fallback, t0, horizon_days, user_id)

    # --- ROUND 2: BEAR COUNSEL (Adversarial Counter-Examination) ---
    bear_prompt = f"""
You are BEAR COUNSEL conducting forensic cross-examination on {ctx['ticker']} (horizon: {horizon_days} days).
Review BOTH the primary filings dossier AND Bull Counsel's opening claims below. Construct 3 rigorous forensic bear arguments that expose weaknesses, margin/debt risks, valuation asymmetry, or omissions in Bull Counsel's claims.

DOSSIER:
{dossier}

BULL COUNSEL OPENING CLAIMS:
{json.dumps(bull_data, indent=2)[:2800]}

Return strictly valid JSON with schema:
{{
  "thesis_summary": "1-2 sentence forensic bear counter-thesis",
  "arguments": [
    {{
      "id": "R1",
      "title": "Short forensic risk headline",
      "claim": "Specific risk or counter-argument grounded in the filing",
      "rebuts_bull_point": "B1",
      "filing_ref": "Exact filing section or XBRL fact",
      "metric_evidence": "Exact figure or risk exposure",
      "quote": "Short fact citation from dossier",
      "severity_score": 78
    }}
  ]
}}
"""
    bear_data, bear_node = await router.execute_json_generation(
        bear_prompt, system_instruction=SEBI_SYSTEM_GUARD, timeout=14.0
    )
    if bear_data and isinstance(bear_data.get("arguments"), list) and len(bear_data["arguments"]) >= 1:
        nodes_used.append(f"bear:{bear_node}")
    else:
        fallback = _deterministic_fallback_debate(ctx)
        return _finalize_debate_response(ctx, fallback, t0, horizon_days, user_id)

    # --- ROUND 3: BULL REBUTTAL + CIO DEBATE JUDGE (Single structured pass for speed & consistency) ---
    judge_prompt = f"""
Act as BOTH:
(A) Bull Counsel issuing 2 sharp, concise rebuttals against Bear Counsel's strongest risk points, AND
(B) The Independent CIO Debate Judge adjudicating the adversarial filings debate on {ctx['ticker']}.

DOSSIER:
{dossier}

BULL COUNSEL:
{json.dumps(bull_data, indent=2)[:2200]}

BEAR COUNSEL:
{json.dumps(bear_data, indent=2)[:2200]}

Score both sides strictly on 0-100 across:
- evidence_grounding (citation precision to actual XBRL/filing facts)
- financial_rigor (accounting, cash flow, balance sheet soundness)
- risk_realism (honest weighting of downside tail risks)

Declare winner as exactly one of: "BULL_WIN", "BEAR_WIN", or "SPLIT_DECISION".
Provide "filing_conviction_delta" as an integer between -15 and +15 (empirical fundamental tilt for MarketProbe's Council risk simulator — NOT investment advice).

Return strictly valid JSON:
{{
  "bull_rebuttals": [
    {{"target_bear_id": "R1", "rebuttal": "Concise evidence-backed rebuttal"}}
  ],
  "cio_judge": {{
    "winner": "BULL_WIN | BEAR_WIN | SPLIT_DECISION",
    "filing_conviction_delta": 6,
    "bull_scores": {{"evidence_grounding": 84, "financial_rigor": 80, "risk_realism": 72}},
    "bear_scores": {{"evidence_grounding": 79, "financial_rigor": 77, "risk_realism": 85}},
    "verdict_headline": "Concise empirical adjudication headline (non-advisory)",
    "institutional_memo": "3-sentence objective audit summary citing both counsels and explicit SEBI non-advisory framing.",
    "key_deciding_factor": "The single decisive filing metric or risk factor"
  }}
}}
"""
    judge_data, judge_node = await router.execute_json_generation(
        judge_prompt, system_instruction=SEBI_SYSTEM_GUARD, timeout=16.0
    )
    if judge_data and isinstance(judge_data.get("cio_judge"), dict):
        nodes_used.append(f"judge:{judge_node}")
        cj = judge_data["cio_judge"]
        winner = str(cj.get("winner", "SPLIT_DECISION")).upper().strip()
        if winner not in ("BULL_WIN", "BEAR_WIN", "SPLIT_DECISION"):
            winner = "SPLIT_DECISION"
        try:
            delta = max(-15, min(15, int(round(float(cj.get("filing_conviction_delta", 0))))))
        except Exception:
            delta = 0

        bs = cj.get("bull_scores") or {}
        rs = cj.get("bear_scores") or {}
        assembled = {
            "bull_counsel": {
                "thesis_summary": str(bull_data.get("thesis_summary", "")),
                "arguments": [
                    {
                        "id": str(a.get("id", f"B{i+1}")),
                        "title": str(a.get("title", "Fundamental Claim")),
                        "claim": str(a.get("claim", "")),
                        "filing_ref": str(a.get("filing_ref", "SEC Filing")),
                        "metric_evidence": str(a.get("metric_evidence", "")),
                        "quote": str(a.get("quote", "")),
                        "strength_score": _clamp_score(a.get("strength_score"), 76),
                    }
                    for i, a in enumerate(bull_data.get("arguments", [])[:4])
                ],
                "rebuttals": [
                    {
                        "target_bear_id": str(r.get("target_bear_id", "R1")),
                        "rebuttal": str(r.get("rebuttal", "")),
                    }
                    for r in (judge_data.get("bull_rebuttals") or [])[:3]
                ],
            },
            "bear_counsel": {
                "thesis_summary": str(bear_data.get("thesis_summary", "")),
                "arguments": [
                    {
                        "id": str(a.get("id", f"R{i+1}")),
                        "title": str(a.get("title", "Forensic Risk")),
                        "claim": str(a.get("claim", "")),
                        "rebuts_bull_point": str(a.get("rebuts_bull_point", "B1")),
                        "filing_ref": str(a.get("filing_ref", "SEC Filing")),
                        "metric_evidence": str(a.get("metric_evidence", "")),
                        "quote": str(a.get("quote", "")),
                        "severity_score": _clamp_score(a.get("severity_score"), 74),
                    }
                    for i, a in enumerate(bear_data.get("arguments", [])[:4])
                ],
            },
            "cio_judge": {
                "winner": winner,
                "filing_conviction_delta": delta,
                "bull_scores": {
                    "evidence_grounding": _clamp_score(bs.get("evidence_grounding"), 80),
                    "financial_rigor": _clamp_score(bs.get("financial_rigor"), 78),
                    "risk_realism": _clamp_score(bs.get("risk_realism"), 72),
                },
                "bear_scores": {
                    "evidence_grounding": _clamp_score(rs.get("evidence_grounding"), 78),
                    "financial_rigor": _clamp_score(rs.get("financial_rigor"), 76),
                    "risk_realism": _clamp_score(rs.get("risk_realism"), 82),
                },
                "verdict_headline": str(cj.get("verdict_headline", f"Filings Audit: {winner.replace('_', ' ')}")),
                "institutional_memo": str(cj.get("institutional_memo", "")),
                "key_deciding_factor": str(cj.get("key_deciding_factor", "")),
            },
            "llm_nodes_used": nodes_used,
        }
        return _finalize_debate_response(ctx, assembled, t0, horizon_days, user_id)

    fallback = _deterministic_fallback_debate(ctx)
    return _finalize_debate_response(ctx, fallback, t0, horizon_days, user_id)


def _finalize_debate_response(
    ctx: Dict[str, Any],
    debate: Dict[str, Any],
    t0: float,
    horizon_days: int,
    user_id: str,
) -> Dict[str, Any]:
    # Publish debate highlights onto AgentMessageBus (Redis Pub/Sub if available)
    bus = AgentMessageBus(ticker=ctx["ticker"], user_id=user_id)
    bus.publish(
        1,
        "AGENT_PERCEPTION",
        "BROADCAST_ALL",
        "SIGNAL_BROADCAST",
        f"Bull Counsel opening ({ctx['ticker']}): {debate['bull_counsel']['thesis_summary']}",
        {"arguments": len(debate["bull_counsel"]["arguments"])},
    )
    bus.publish(
        2,
        "AGENT_FORENSIC",
        "AGENT_PERCEPTION",
        "PEER_CHALLENGE",
        f"Bear Counsel cross-exam ({ctx['ticker']}): {debate['bear_counsel']['thesis_summary']}",
        {"arguments": len(debate["bear_counsel"]["arguments"])},
    )
    bus.publish(
        3,
        "AGENT_CIO_GOVERNOR",
        "BROADCAST_ALL",
        "EQUILIBRIUM_SYNTHESIS",
        (
            f"CIO Filings Judge Decree: {debate['cio_judge']['winner']} "
            f"(Filing Conviction Delta: {debate['cio_judge']['filing_conviction_delta']:+d} pts)"
        ),
        {"winner": debate["cio_judge"]["winner"], "delta": debate["cio_judge"]["filing_conviction_delta"]},
    )

    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    return {
        "ticker": ctx["ticker"],
        "sec_ticker": ctx.get("sec_ticker", ctx["ticker"]),
        "company_name": ctx["company_name"],
        "cik": ctx.get("cik"),
        "source_mode": ctx["source_mode"],
        "edgar_available": ctx["edgar_available"],
        "edgar_browse_url": ctx.get("edgar_browse_url"),
        "nse_disclosure_url": ctx.get("nse_disclosure_url"),
        "pdf_filename": ctx.get("pdf_filename"),
        "horizon_days": horizon_days,
        "filings": ctx.get("filings", []),
        "latest_primary_filing": ctx.get("latest_primary_filing"),
        "xbrl_snapshot": ctx.get("xbrl_snapshot", {}),
        "bull_counsel": debate["bull_counsel"],
        "bear_counsel": debate["bear_counsel"],
        "cio_judge": debate["cio_judge"],
        "llm_nodes_used": debate.get("llm_nodes_used", []),
        "bus_packets": [p.to_dict() for p in bus.packets],
        "redis_synced": bus.redis_synced,
        "latency_ms": elapsed_ms,
        "sebi_disclaimer": (
            "Empirical filing audit and quantitative scenario analysis only — not SEBI-registered "
            "investment advice or a buy/sell recommendation."
        ),
    }
