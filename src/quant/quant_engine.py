"""
Native Unified FinBot Quantitative & Conversational Core for MarketProbe
Runs in-process without requiring a secondary port or backend.
Includes Customer Memory, Behavioral Learning & Dynamic Risk Adaptation.
"""

import os
from typing import Dict, Any, List, Optional
from src.quant.guardrails_service import FinancialGuardrailEngine
from src.quant.rag_service import search_knowledge_base
from src.quant.llm_orchestrator import get_orchestrator
from src.quant.mpt_service import compute_efficient_frontier
from src.quant.tax_service import calculate_tax_loss_harvesting
from src.backend.deep_quant_copilot import get_deep_quant_copilot
from src.quant.user_memory import get_customer_memory

async def process_copilot_query(message: str, user_id: str = "demo-trader") -> Dict[str, Any]:
    """
    Direct in-process execution pipeline with Customer Memory:
    1. Passive Behavioral Extraction & Pattern Learning (Customer Memory).
    2. Deep Quant Trade Audit (Chain-of-Thought & SHAP).
    3. Database Action Cycle.
    4. Input Guardrails (PII + Prompt Injection).
    5. Context Assembly (Memory Profile + Vector RAG + YouTube Transcripts).
    6. Multi-Node Generation (Gemini 3.5 Flash Router).
    7. Conversational Logging & SEBI Compliance Stamping.
    """
    mem = get_customer_memory()
    mem.extract_and_learn_patterns(user_id, message)
    mem.add_interaction(user_id, "user", message)
    memory_context = mem.build_memory_prompt_context(user_id)
    profile = mem.get_or_create_profile(user_id)

    msg_low = message.lower().strip()

    # 1. Deep Quant Trade Audit
    if any(w in msg_low for w in ["buy", "sell", "tgt", "target", "stoploss", "sl", "breakout"]):
        engine = get_deep_quant_copilot()
        audit_res = engine.deep_audit_trade(message)
        if audit_res:
            audit_res["customer_profile"] = {
                "risk_profile": profile.get("risk_profile"),
                "trading_style": profile.get("trading_style"),
                "favorite_tickers": profile.get("favorite_tickers", [])
            }
            mem.add_interaction(user_id, "assistant", audit_res["reply"])
            return audit_res

    # 2. Database Action Cycle
    from src.backend.copilot_actions import execute_copilot_tool_cycle
    tool_res = execute_copilot_tool_cycle(message)
    if tool_res:
        tool_res["customer_profile"] = {
            "risk_profile": profile.get("risk_profile"),
            "trading_style": profile.get("trading_style"),
            "favorite_tickers": profile.get("favorite_tickers", [])
        }
        mem.add_interaction(user_id, "assistant", tool_res["reply"])
        return tool_res

    # 3. PII Sanitization & Input Guardrails
    sanitized = FinancialGuardrailEngine.sanitize_and_mask_pii(message)
    context_chunks = search_knowledge_base(sanitized, top_k=2)

    is_safe, rejection = FinancialGuardrailEngine.check_input_guardrails(sanitized, context_chunks)
    if not is_safe:
        return {
            "reply": rejection,
            "source_node": "guardrails-reject",
            "action_chips": [],
            "customer_profile": profile
        }

    # 4. Context Assembly with Long-Term Customer Memory
    context_str = f"{memory_context}\n\n"
    if context_chunks:
        context_str += "Verified Knowledge & Transcript Context:\n" + "\n".join([f"- {c['topic']}: {c['content']}" for c in context_chunks])

    recent_turns = mem.get_recent_history(user_id, limit=3)
    history_str = ""
    if len(recent_turns) > 1:
        history_str = "\nRecent Conversational Memory:\n" + "\n".join([f"{t['role'].upper()}: {t['message']}" for t in recent_turns[:-1]])

    system_instruction = (
        "You are FinBot, the institutional AI Quantitative Analyst and Copilot embedded in MarketProbe. "
        "You remember the customer's trading patterns, risk profile, and favorite tickers. "
        "Answer questions on NSE/BSE stocks, YouTube video transcripts, influencer win-rates, portfolio risk (MPT), "
        "and Indian tax laws (Finance Act 2024). Tailor all risk assessments directly to the customer's memory profile."
    )
    prompt = f"{context_str}\n{history_str}\n\nUser Question: {sanitized}\nProvide an institutional, personalized quantitative answer (under 130 words):"

    # 5. Multi-Node Generation
    orchestrator = get_orchestrator()
    response_text, provider_used = await orchestrator.execute_generation(prompt, system_instruction=system_instruction)

    if not response_text:
        if context_chunks:
            response_text = context_chunks[0]["content"]
        else:
            response_text = f"MarketProbe Quant Desk: Recognizing your {profile.get('trading_style', 'swing')} preference on {', '.join(profile.get('favorite_tickers', ['stocks'])[:3])}, you can stress-test active allocations on the Market Radar and P&L Simulator."

    # 6. SEBI Stamping & Logging
    final_reply = FinancialGuardrailEngine.check_output_guardrails(response_text)
    mem.add_interaction(user_id, "assistant", final_reply)

    action_chips = [
        {"type": "NAVIGATE_TAB", "label": "Explore Live Feed", "tab": "FEED"},
        {"type": "NAVIGATE_TAB", "label": "Open P&L Simulator", "tab": "SIMULATOR"},
        {"type": "NAVIGATE_TAB", "label": "View Model Rigor", "tab": "EVAL"}
    ]
    if profile.get("favorite_tickers"):
        fav = profile["favorite_tickers"][0]
        action_chips.insert(0, {"type": "NAVIGATE_TAB", "label": f"View {fav} Radar", "tab": "STOCKS", "ticker": f"{fav}.NS"})

    return {
        "reply": final_reply,
        "source_node": provider_used,
        "action_chips": action_chips,
        "customer_profile": {
            "risk_profile": profile.get("risk_profile"),
            "trading_style": profile.get("trading_style"),
            "max_drawdown": profile.get("max_portfolio_loss_pct"),
            "favorite_tickers": profile.get("favorite_tickers", []),
            "total_interactions": profile.get("total_interactions", 0)
        }
    }
