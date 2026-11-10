"""
Native Unified FinBot Quantitative & Conversational Core for MarketProbe
Runs in-process without requiring a secondary port or backend.
"""

import os
from typing import Dict, Any, List, Optional
from src.quant.guardrails_service import FinancialGuardrailEngine
from src.quant.rag_service import search_knowledge_base
from src.quant.llm_orchestrator import get_orchestrator
from src.quant.mpt_service import compute_efficient_frontier
from src.quant.tax_service import calculate_tax_loss_harvesting
from src.backend.deep_quant_copilot import get_deep_quant_copilot

async def process_copilot_query(message: str) -> Dict[str, Any]:
    """
    Direct in-process execution pipeline:
    1. Check for deep quantitative tip audit (Chain-of-Thought & SHAP).
    2. Check for influencer rankings / watchlist actions.
    3. Input guardrails (Prompt injection + PII sanitization).
    4. RAG vector context search (74 YouTube transcripts + 2,448 audited calls).
    5. Multi-node router generation (Gemini 3.5 Flash -> Flash-Lite -> Offline).
    6. Output guardrail (SEBI compliance).
    """
    msg_low = message.lower().strip()

    # 1. Deep Quant Trade Audit
    if any(w in msg_low for w in ["buy", "sell", "tgt", "target", "stoploss", "sl", "breakout"]):
        engine = get_deep_quant_copilot()
        audit_res = engine.deep_audit_trade(message)
        if audit_res:
            return audit_res

    # 2. Database Action Cycle
    from src.backend.copilot_actions import execute_copilot_tool_cycle
    tool_res = execute_copilot_tool_cycle(message)
    if tool_res:
        return tool_res

    # 3. PII Sanitization & Input Guardrails
    sanitized = FinancialGuardrailEngine.sanitize_and_mask_pii(message)
    context_chunks = search_knowledge_base(sanitized, top_k=2)

    is_safe, rejection = FinancialGuardrailEngine.check_input_guardrails(sanitized, context_chunks)
    if not is_safe:
        return {
            "reply": rejection,
            "source_node": "guardrails-reject",
            "action_chips": []
        }

    # 4. Context Assembly
    context_str = ""
    if context_chunks:
        context_str = "Verified Knowledge & Transcript Context:\n" + "\n".join([f"- {c['topic']}: {c['content']}" for c in context_chunks])

    system_instruction = (
        "You are FinBot, the institutional AI Quantitative Analyst and Copilot embedded in MarketProbe. "
        "Answer questions on NSE/BSE stocks, YouTube video transcripts, influencer win-rates, portfolio risk (MPT), "
        "and Indian tax laws (Finance Act 2024). Be concise, quantitative, and cite exact numbers."
    )
    prompt = f"{context_str}\n\nUser Question: {sanitized}\nProvide an institutional, quantitative answer (under 130 words):"

    # 5. Multi-Node Generation
    orchestrator = get_orchestrator()
    response_text, provider_used = await orchestrator.execute_generation(prompt, system_instruction=system_instruction)

    if not response_text:
        if context_chunks:
            response_text = context_chunks[0]["content"]
        else:
            response_text = "MarketProbe Quant Desk: To analyze asset allocations, YouTube creator track records, or MPT frontiers, explore the Market Radar, Rankings, or P&L Simulator tabs."

    # 6. SEBI Stamping
    final_reply = FinancialGuardrailEngine.check_output_guardrails(response_text)

    return {
        "reply": final_reply,
        "source_node": provider_used,
        "action_chips": [
            {"type": "NAVIGATE_TAB", "label": "Explore Live Feed", "tab": "FEED"},
            {"type": "NAVIGATE_TAB", "label": "Open P&L Simulator", "tab": "SIMULATOR"},
            {"type": "NAVIGATE_TAB", "label": "View Model Rigor", "tab": "EVAL"}
        ]
    }
