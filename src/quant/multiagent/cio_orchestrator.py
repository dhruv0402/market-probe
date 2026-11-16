"""
Chief Investment Officer (CIO) Meta-Governor & Multi-Round Orchestrator for MarketProbe.

Orchestrates a 5-Agent Communicating Council across 3 deliberative rounds:
1. AGENT_PERCEPTION: Semantic FAISS RAG + SEBI RA Registry + Peer Herd Divergence
2. AGENT_FORENSIC: Empirical Bayes Shrinkage + Wilson 95% CI + Brier Calibration
3. AGENT_QUANT: 1,000-Path Merton Jump-Diffusion Monte Carlo + Counterfactual Barrier Search
4. AGENT_RISK_MEMORY: CVaR (95%) Tail Risk + Sec 111A/112A Post-Tax EV + Customer Memory Sizing
5. AGENT_CIO_GOVERNOR: Bayesian Equilibrium Synthesis & Counterfactual Decree

All agents communicate explicitly via AgentMessageBus (Redis Pub/Sub + in-memory blackboard).
"""

import re
from typing import Any, Dict, List, Optional

from src.quant.multiagent.message_bus import AgentMessageBus
from src.quant.multiagent.perception_rag_agent import evaluate_perception_rag_agent
from src.quant.multiagent.quant_math_agent import evaluate_quant_math_agent
from src.quant.multiagent.forensic_tracker_agent import evaluate_forensic_agent
from src.quant.multiagent.risk_memory_agent import evaluate_risk_memory_agent
from src.quant.user_memory import CustomerMemoryEngine
from src.quant.guardrails_service import FinancialGuardrailEngine

guardrail_engine = FinancialGuardrailEngine()
memory_engine = CustomerMemoryEngine()


def _parse_horizon_from_directive(directive: str, default_horizon: int) -> int:
    """Extracts explicit holding horizon in days from a natural-language directive."""
    if not directive:
        return default_horizon
    match = re.search(r"\b(\d{1,3})\s*(?:d|day|days)\b", directive, re.IGNORECASE)
    if match:
        val = int(match.group(1))
        return max(5, min(365, val))
    return default_horizon


def run_cio_council_deliberation(
    ticker: str,
    action: str = "BUY",
    entry_price: float = 0.0,
    target_price: float = 0.0,
    stoploss_price: float = 0.0,
    creator_name: str = "",
    user_id: str = "demo-trader",
    horizon_days: int = 30,
    user_directive: str = "",
) -> Dict[str, Any]:
    """
    Executes a 3-round communicating 5-agent deliberation protocol and synthesizes consensus.
    """
    clean_ticker = ticker.upper().replace(".NS", "").replace(".BO", "").strip()
    clean_action = action.upper().strip() or "BUY"
    effective_horizon = _parse_horizon_from_directive(user_directive, horizon_days)

    bus = AgentMessageBus(ticker=clean_ticker, user_id=user_id)

    # Optional Customer Memory learning & directive injection
    clean_directive = (user_directive or "").strip()
    if clean_directive:
        memory_engine.extract_and_learn_patterns(user_id, clean_directive)
        memory_engine.add_interaction(user_id, "user", clean_directive)
        bus.publish(
            round_num=1,
            sender="USER_DIRECTIVE",
            recipient="AGENT_CIO_GOVERNOR",
            intent="RISK_CONSTRAINT_INJECTION",
            content=(
                f"Client Directive received: \"{clean_directive}\" — updated Customer Memory "
                f"and calibrated deliberation horizon to {effective_horizon}D."
            ),
            payload={"horizon_days": effective_horizon, "directive": clean_directive[:160]},
        )

    # =========================================================================
    # ROUND 1: Independent Discovery & Signal Broadcast
    # =========================================================================
    bus.publish(
        round_num=1,
        sender="AGENT_CIO_GOVERNOR",
        recipient="BROADCAST_ALL",
        intent="SIGNAL_BROADCAST",
        content=(
            f"Council Session Convened for {clean_ticker} ({clean_action}) | "
            f"Entry ₹{entry_price or 'CMP'} / Target ₹{target_price or 'Auto'} / SL ₹{stoploss_price or 'Auto'} | "
            f"Horizon: {effective_horizon}D. All agents execute Round 1 independent analysis."
        ),
        payload={
            "ticker": clean_ticker,
            "action": clean_action,
            "horizon_days": effective_horizon,
            "creator": creator_name or "Unspecified",
        },
    )

    perception_eval = evaluate_perception_rag_agent(
        ticker=clean_ticker,
        action=clean_action,
        creator_name=creator_name,
    )
    forensic_eval = evaluate_forensic_agent(
        creator_name=creator_name,
        ticker=clean_ticker,
    )
    # Round 1 Quant simulation uses raw historical drift (prior to Forensic Bayes haircut)
    quant_r1 = evaluate_quant_math_agent(
        ticker=clean_ticker,
        action=clean_action,
        entry=entry_price,
        target=target_price,
        stoploss=stoploss_price,
        horizon_days=effective_horizon,
        bayes_drift_adjustment=0.0,
        uncertainty_multiplier=1.0,
    )
    risk_r1 = evaluate_risk_memory_agent(
        user_id=user_id,
        ticker=clean_ticker,
        action=clean_action,
        entry=quant_r1["tested_entry"],
        stoploss=quant_r1["tested_stoploss"],
        tail_risk_cvar_pct=quant_r1["tail_risk"]["cvar_95_pct"],
        monte_carlo_hit_prob=quant_r1["monte_carlo"]["p_target_first"],
        expected_return_pct=quant_r1["monte_carlo"]["expected_return_pct"],
        target=quant_r1["tested_target"],
        horizon_days=effective_horizon,
    )

    r1_gov_score = int(
        0.30 * quant_r1["conviction_score"]
        + 0.25 * forensic_eval["conviction_score"]
        + 0.25 * risk_r1["conviction_score"]
        + 0.20 * perception_eval["conviction_score"]
    )

    bus.record_conviction("AGENT_PERCEPTION", 1, perception_eval["conviction_score"])
    bus.record_conviction("AGENT_FORENSIC", 1, forensic_eval["conviction_score"])
    bus.record_conviction("AGENT_QUANT", 1, quant_r1["conviction_score"])
    bus.record_conviction("AGENT_RISK_MEMORY", 1, risk_r1["conviction_score"])
    bus.record_conviction("AGENT_CIO_GOVERNOR", 1, r1_gov_score)

    bus.publish(
        round_num=1,
        sender="AGENT_PERCEPTION",
        recipient="BROADCAST_ALL",
        intent="SIGNAL_BROADCAST",
        content=perception_eval["verdict_rationale"],
        payload={
            "rag_hits": perception_eval["rag_hits_count"],
            "herd_bullish_pct": perception_eval["herd_bullish_pct"],
            "sebi_registered": perception_eval["sebi_registered"],
            "contrarian": perception_eval["contrarian_divergence_flag"],
        },
    )

    bus.publish(
        round_num=1,
        sender="AGENT_FORENSIC",
        recipient="BROADCAST_ALL",
        intent="SIGNAL_BROADCAST",
        content=forensic_eval["verdict_rationale"],
        payload={
            "bayes_rate": forensic_eval["bayes_shrinkage_rate"],
            "wilson_ci": forensic_eval["wilson_95_ci"],
            "brier_score": forensic_eval["brier_score"],
            "sample_size": forensic_eval["sample_size"],
        },
    )

    bus.publish(
        round_num=1,
        sender="AGENT_QUANT",
        recipient="BROADCAST_ALL",
        intent="SIGNAL_BROADCAST",
        content=(
            f"[Raw Drift {quant_r1['mu_raw_annualized']}% | Vol {quant_r1['volatility_annualized']}%] "
            + quant_r1["verdict_rationale"]
        ),
        payload={
            "p_target_first": quant_r1["monte_carlo"]["p_target_first"],
            "p_stoploss_first": quant_r1["monte_carlo"]["p_stoploss_first"],
            "expected_return_pct": quant_r1["monte_carlo"]["expected_return_pct"],
            "cvar_95_pct": quant_r1["tail_risk"]["cvar_95_pct"],
        },
    )

    bus.publish(
        round_num=1,
        sender="AGENT_RISK_MEMORY",
        recipient="BROADCAST_ALL",
        intent="SIGNAL_BROADCAST",
        content=risk_r1["verdict_rationale"],
        payload={
            "risk_profile": risk_r1["user_risk_profile"],
            "stress_loss_pct": risk_r1["stress_tested_loss_pct"],
            "post_tax_ev_pct": risk_r1["post_tax_ev_pct"],
            "half_kelly_alloc": risk_r1["optimal_allocation_pct"],
        },
    )

    # =========================================================================
    # ROUND 2: Adversarial Cross-Examination & Counterfactual Restructuring
    # =========================================================================
    # MSG-006: Perception -> Forensic challenge
    herd_gap = (
        f"Contrarian divergence detected ({perception_eval['herd_bullish_pct']}% peer BUY vs {clean_action})"
        if perception_eval["contrarian_divergence_flag"]
        else f"Aligned with {perception_eval['herd_bullish_pct']}% historical peer consensus"
    )
    forensic_r2_adj = -5 if perception_eval["contrarian_divergence_flag"] else (4 if perception_eval["rag_hits_count"] > 0 else 0)
    forensic_r2_score = max(15, min(95, forensic_eval["conviction_score"] + forensic_r2_adj))

    bus.publish(
        round_num=2,
        sender="AGENT_PERCEPTION",
        recipient="AGENT_FORENSIC",
        intent="PEER_CHALLENGE",
        content=(
            f"Cross-examining {creator_name or clean_ticker}: {herd_gap} across "
            f"{perception_eval['herd_buy_calls'] + perception_eval['herd_sell_calls']} calls, "
            f"and {perception_eval['rag_hits_count']} FAISS YouTube/research transcripts support context. "
            f"Verify creator Brier score ({forensic_eval['brier_score']}) before approving prior drift."
        ),
        payload={
            "herd_bullish_pct": perception_eval["herd_bullish_pct"],
            "rag_hits": perception_eval["rag_hits_count"],
            "forensic_score_delta": forensic_r2_adj,
        },
    )

    # MSG-007: Forensic -> Quant parameter recalibration
    peer_challenge = forensic_eval["peer_challenge_for_quant"]
    bayes_adj = float(peer_challenge["bayes_drift_adjustment"])
    unc_mult = float(peer_challenge["uncertainty_multiplier"])

    bus.publish(
        round_num=2,
        sender="AGENT_FORENSIC",
        recipient="AGENT_QUANT",
        intent="PARAMETER_RECALIBRATION",
        content=peer_challenge["challenge_summary"],
        payload={
            "bayes_drift_adjustment": bayes_adj,
            "uncertainty_multiplier": unc_mult,
            "brier_score": forensic_eval["brier_score"],
        },
    )

    # Round 2 Quant simulation incorporating Bayesian drift prior from Forensic Agent
    quant_r2 = evaluate_quant_math_agent(
        ticker=clean_ticker,
        action=clean_action,
        entry=entry_price,
        target=target_price,
        stoploss=stoploss_price,
        horizon_days=effective_horizon,
        bayes_drift_adjustment=bayes_adj,
        uncertainty_multiplier=unc_mult,
    )
    counterfactual = quant_r2["counterfactual_proposal"]
    cf_restructured = counterfactual["restructured_metrics"]

    # MSG-008: Quant -> Risk & Memory counterfactual proposal
    bus.publish(
        round_num=2,
        sender="AGENT_QUANT",
        recipient="AGENT_RISK_MEMORY",
        intent="COUNTERFACTUAL_PROPOSAL",
        content=(
            f"Re-simulated 1,000 paths with posterior drift {quant_r2['drift_annualized']}% "
            f"(Δ={quant_r2['bayes_drift_adjustment']:+.2f}%). Original barrier P(Target)={quant_r2['monte_carlo']['p_target_first']*100:.1f}%. "
            f"Proposing Council-Restructured Levels: Target ₹{cf_restructured['target']} / SL ₹{cf_restructured['stoploss']} "
            f"raising P(Target) to {cf_restructured['p_target_first']*100:.1f}% and EV to {cf_restructured['expected_return_pct']:+.2f}%."
        ),
        payload={
            "mu_adjusted_pct": quant_r2["drift_annualized"],
            "restructured_target": cf_restructured["target"],
            "restructured_stoploss": cf_restructured["stoploss"],
            "restructured_p_target": cf_restructured["p_target_first"],
            "restructured_ev_pct": cf_restructured["expected_return_pct"],
        },
    )

    # Round 2 Risk & Memory evaluates both original & counterfactual
    risk_r2 = evaluate_risk_memory_agent(
        user_id=user_id,
        ticker=clean_ticker,
        action=clean_action,
        entry=quant_r2["tested_entry"],
        stoploss=quant_r2["tested_stoploss"],
        tail_risk_cvar_pct=quant_r2["tail_risk"]["cvar_95_pct"],
        monte_carlo_hit_prob=quant_r2["monte_carlo"]["p_target_first"],
        expected_return_pct=quant_r2["monte_carlo"]["expected_return_pct"],
        target=quant_r2["tested_target"],
        horizon_days=effective_horizon,
        counterfactual_metrics=cf_restructured,
    )

    # MSG-009: Risk & Memory -> CIO Governor constraint injection
    bus.publish(
        round_num=2,
        sender="AGENT_RISK_MEMORY",
        recipient="AGENT_CIO_GOVERNOR",
        intent="RISK_CONSTRAINT_INJECTION",
        content=(
            f"Evaluated Sec 111A/112A Tax & Slippage drag for {risk_r2['user_risk_profile']}: "
            f"Original Post-Tax EV={risk_r2['post_tax_ev_pct']:+.2f}% (Half-Kelly cap {risk_r2['optimal_allocation_pct']}%). "
            f"Restructured Post-Tax EV={risk_r2['restructured_post_tax_ev_pct']:+.2f}% "
            f"(Half-Kelly cap {risk_r2['restructured_allocation_pct']}%, Stress Downside {risk_r2['restructured_stress_loss_pct']}%)."
        ),
        payload={
            "post_tax_ev_pct": risk_r2["post_tax_ev_pct"],
            "restructured_post_tax_ev_pct": risk_r2["restructured_post_tax_ev_pct"],
            "optimal_allocation_pct": risk_r2["optimal_allocation_pct"],
            "restructured_allocation_pct": risk_r2["restructured_allocation_pct"],
        },
    )

    bus.record_conviction("AGENT_PERCEPTION", 2, perception_eval["conviction_score"])
    bus.record_conviction("AGENT_FORENSIC", 2, forensic_r2_score)
    bus.record_conviction("AGENT_QUANT", 2, quant_r2["conviction_score"])
    bus.record_conviction("AGENT_RISK_MEMORY", 2, risk_r2["conviction_score"])

    # =========================================================================
    # ROUND 3: Equilibrium Synthesis & Governor Decree
    # =========================================================================
    sebi_eval = {
        "agent": "SEBI Compliance & Circuit Guard",
        "vote": "COMPLIANT" if perception_eval["sebi_compliant"] else "SEBI_WARNING",
        "conviction_score": 90 if perception_eval["sebi_compliant"] else 30,
        "verdict_rationale": (
            f"Liquid NSE/BSE constituent within {perception_eval['circuit_band']}."
            if perception_eval["sebi_compliant"]
            else "Potential high-volatility illiquid surveillance counter."
        ),
    }

    w_quant = 0.35
    w_forensic = 0.25
    w_risk = 0.25
    w_perception = 0.15

    composite_score = int(
        (quant_r2["conviction_score"] * w_quant)
        + (forensic_r2_score * w_forensic)
        + (risk_r2["conviction_score"] * w_risk)
        + (perception_eval["conviction_score"] * w_perception)
    )

    has_veto = (
        quant_r2["vote"] == "BEARISH_VETO"
        or risk_r2["vote"] == "RISK_VETO"
        or not perception_eval["sebi_compliant"]
    )

    if has_veto:
        composite_score = min(composite_score, 38)
        council_verdict = "INSTITUTIONAL_VETO"
        executive_summary = (
            f"The 5-Agent Council has VETOED the original levels. {quant_r2['verdict_rationale']} | "
            f"Counterfactual proposal identified: Target ₹{cf_restructured['target']} / SL ₹{cf_restructured['stoploss']} "
            f"(+{counterfactual['improvement_hit_prob_pct']}% hit prob)."
        )
    elif composite_score >= 70:
        council_verdict = "HIGH_CONVICTION_EXECUTE"
        executive_summary = (
            f"Strong 5-agent alignment ({composite_score}/100). Positive Monte Carlo drift "
            f"(+{quant_r2['monte_carlo']['expected_return_pct']}%) confirmed with {forensic_eval['bayes_shrinkage_rate']}% "
            f"Bayes credibility and {risk_r2['post_tax_ev_pct']:+.2f}% post-tax EV."
        )
    elif composite_score >= 50:
        council_verdict = "MODERATE_SPECULATIVE"
        executive_summary = (
            f"Balanced setup ({composite_score}/100). Post-tax EV is {risk_r2['post_tax_ev_pct']:+.2f}%; "
            f"limit size to {risk_r2['optimal_allocation_pct']}% Half-Kelly."
        )
    else:
        council_verdict = "AVOID_SUBPAR_ALPHA"
        executive_summary = (
            f"Weak risk-reward profile ({composite_score}/100). First-passage odds do not justify capital commitment."
        )

    # Restructured setup verdict
    cf_score = int(
        (cf_restructured["conviction_score"] * w_quant)
        + (forensic_r2_score * w_forensic)
        + (risk_r2["conviction_score"] * w_risk)
        + (perception_eval["conviction_score"] * w_perception)
    )
    if cf_score >= 70 and cf_restructured["p_target_first"] >= 0.50:
        cf_verdict = "COUNCIL_RESTRUCTURED_BUY"
    elif cf_score >= 52:
        cf_verdict = "MODERATE_RESTRUCTURED"
    else:
        cf_verdict = "DEFENSIVE_WAIT"

    bus.record_conviction("AGENT_CIO_GOVERNOR", 2, composite_score)

    # Converge Round 3 equilibrium view (agents anchor lightly toward Council Equilibrium)
    def _converge(score: int) -> int:
        return int(round(0.75 * score + 0.25 * composite_score))

    r3_perception = _converge(perception_eval["conviction_score"])
    r3_forensic = _converge(forensic_r2_score)
    r3_quant = _converge(quant_r2["conviction_score"])
    r3_risk = _converge(risk_r2["conviction_score"])
    bus.record_conviction("AGENT_PERCEPTION", 3, r3_perception)
    bus.record_conviction("AGENT_FORENSIC", 3, r3_forensic)
    bus.record_conviction("AGENT_QUANT", 3, r3_quant)
    bus.record_conviction("AGENT_RISK_MEMORY", 3, r3_risk)
    bus.record_conviction("AGENT_CIO_GOVERNOR", 3, composite_score)

    # MSG-010: CIO Governor Final Synthesis Broadcast
    bus.publish(
        round_num=3,
        sender="AGENT_CIO_GOVERNOR",
        recipient="BROADCAST_ALL",
        intent="EQUILIBRIUM_SYNTHESIS",
        content=(
            f"Final Decree: {council_verdict} (Original Conviction {composite_score}/100). "
            f"Equilibrium Counterfactual Verdict: {cf_verdict} ({cf_score}/100) at "
            f"Target ₹{cf_restructured['target']} / SL ₹{cf_restructured['stoploss']} "
            f"(Post-Tax EV {risk_r2['restructured_post_tax_ev_pct']:+.2f}%, Half-Kelly {risk_r2['restructured_allocation_pct']}%)."
        ),
        payload={
            "original_conviction": composite_score,
            "original_verdict": council_verdict,
            "restructured_conviction": cf_score,
            "restructured_verdict": cf_verdict,
        },
    )

    bus_telemetry = bus.export_telemetry()

    agents_roster: List[Dict[str, Any]] = [
        {
            "agent_id": "AGENT_PERCEPTION",
            "name": "Perception & RAG",
            "role": "FAISS Corpus, SEBI RA & Herd Consensus",
            "vote": perception_eval["vote"],
            "round_1_score": perception_eval["conviction_score"],
            "round_2_score": perception_eval["conviction_score"],
            "round_3_score": r3_perception,
            "conviction_delta": r3_perception - perception_eval["conviction_score"],
            "summary": perception_eval["verdict_rationale"],
        },
        {
            "agent_id": "AGENT_FORENSIC",
            "name": "Forensic Bayes",
            "role": "Empirical Bayes, Wilson 95% CI & Brier",
            "vote": forensic_eval["vote"],
            "round_1_score": forensic_eval["conviction_score"],
            "round_2_score": forensic_r2_score,
            "round_3_score": r3_forensic,
            "conviction_delta": r3_forensic - forensic_eval["conviction_score"],
            "summary": forensic_eval["verdict_rationale"],
        },
        {
            "agent_id": "AGENT_QUANT",
            "name": "Stochastic Quant",
            "role": "1,000-Path Merton GBM & Counterfactuals",
            "vote": quant_r2["vote"],
            "round_1_score": quant_r1["conviction_score"],
            "round_2_score": quant_r2["conviction_score"],
            "round_3_score": r3_quant,
            "conviction_delta": r3_quant - quant_r1["conviction_score"],
            "summary": quant_r2["verdict_rationale"],
        },
        {
            "agent_id": "AGENT_RISK_MEMORY",
            "name": "Risk & Memory",
            "role": "CVaR Tail Risk, Sec 111A Tax & Kelly",
            "vote": risk_r2["vote"],
            "round_1_score": risk_r1["conviction_score"],
            "round_2_score": risk_r2["conviction_score"],
            "round_3_score": r3_risk,
            "conviction_delta": r3_risk - risk_r1["conviction_score"],
            "summary": risk_r2["verdict_rationale"],
        },
        {
            "agent_id": "AGENT_CIO_GOVERNOR",
            "name": "CIO Meta-Governor",
            "role": "3-Round Equilibrium & Veto Governor",
            "vote": council_verdict,
            "round_1_score": r1_gov_score,
            "round_2_score": composite_score,
            "round_3_score": composite_score,
            "conviction_delta": composite_score - r1_gov_score,
            "summary": executive_summary,
        },
    ]

    counterfactual_restructuring = {
        **counterfactual,
        "restructured_conviction_score": cf_score,
        "restructured_verdict": cf_verdict,
        "restructured_allocation_pct": risk_r2["restructured_allocation_pct"],
        "restructured_post_tax_ev_pct": risk_r2["restructured_post_tax_ev_pct"],
        "restructured_stress_loss_pct": risk_r2["restructured_stress_loss_pct"],
    }

    dialogue_trace = [
        {
            "agent": p.sender_name,
            "recipient": p.recipient_name,
            "round": p.round,
            "intent": p.intent,
            "vote": p.intent,
            "score": bus_telemetry["conviction_trajectories"].get(p.sender, {}).get(
                f"round_{p.round}", composite_score
            ),
            "statement": p.content,
        }
        for p in bus.packets
    ]

    response_payload = {
        "ticker": clean_ticker,
        "action": clean_action,
        "horizon_days": effective_horizon,
        "user_directive": clean_directive,
        "entry": quant_r2["tested_entry"],
        "target": quant_r2["tested_target"],
        "stoploss": quant_r2["tested_stoploss"],
        "composite_conviction_score": composite_score,
        "council_verdict": council_verdict,
        "executive_summary": executive_summary,
        "dialogue_trace": dialogue_trace,
        "agents_roster": agents_roster,
        "message_bus": bus_telemetry,
        "counterfactual_restructuring": counterfactual_restructuring,
        "perception_rag": perception_eval,
        "quant_math": quant_r2,
        "forensic_audit": forensic_eval,
        "risk_memory": risk_r2,
        "sebi_guard": sebi_eval,
    }

    bus.persist_final_deliberation(
        {
            "ticker": clean_ticker,
            "council_verdict": council_verdict,
            "composite_conviction_score": composite_score,
            "packets_count": bus_telemetry["total_packets_exchanged"],
            "convergence_pct": bus_telemetry["consensus_convergence_pct"],
        }
    )

    return response_payload
