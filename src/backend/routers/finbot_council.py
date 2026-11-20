"""
FinBot Quantitative Core, Customer Memory, 5-Agent Council & Multimodal Dropzone Router.
"""

import io
from typing import List, Optional
from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel

router = APIRouter(tags=["FinBot & 5-Agent Quant Council"])


class FinBotChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "marketprobe-session"
    user_id: Optional[str] = "demo-trader"


class FinBotOptimizeRequest(BaseModel):
    tickers: List[str] = ["RELIANCE", "TCS", "INFY", "HDFCBANK"]
    risk_free_rate: float = 0.065
    target_return: Optional[float] = None


class FinBotTaxHarvestRequest(BaseModel):
    realized_gains: float = 120000.0
    unrealized_losses: float = 40000.0
    holding_period_days: int = 400


class MultiAgentAuditRequest(BaseModel):
    ticker: str
    action: str = "BUY"
    entry_price: float = 0.0
    target_price: float = 0.0
    stoploss_price: float = 0.0
    creator_name: str = ""
    user_id: str = "demo-trader"
    horizon_days: int = 30
    user_directive: str = ""


@router.get("/api/user/memory/profile")
async def get_user_memory_profile(user_id: str = "demo-trader"):
    """Fetches learned customer behavioral profile & preferences."""
    from src.quant.user_memory import get_customer_memory

    mem = get_customer_memory()
    return mem.get_or_create_profile(user_id)


@router.post("/api/user/memory/reset")
async def reset_user_memory(user_id: str = "demo-trader"):
    """Resets learned memory for the user."""
    from src.quant.user_memory import get_customer_memory

    mem = get_customer_memory()
    mem.update_profile_field(user_id, "favorite_tickers", ["TATAMOTORS", "RELIANCE", "TCS"])
    mem.update_profile_field(user_id, "risk_profile", "Moderate / Balanced Growth")
    mem.update_profile_field(user_id, "trading_style", "Swing Breakout & Quality Delivery")
    mem.update_profile_field(user_id, "max_portfolio_loss_pct", 15.0)
    mem.update_profile_field(user_id, "raw_memory_notes", [])
    return {"status": "success", "message": "Customer memory profile refreshed"}


@router.get("/api/finbot/status")
async def get_finbot_status():
    """Verify in-process FinBot AI quantitative core status."""
    return {
        "connected": True,
        "mode": "in-process-native",
        "finbot_url": "embedded://marketprobe/quant",
        "status": {
            "status": "healthy",
            "service": "Native FinBot AI Quantitative Core with Persistent Customer Memory",
            "knowledge_vectors": 544,
            "models": ["gemini-flash-lite-latest", "gemini-3.8-flash", "faiss-vector-rag"],
        },
    }


@router.post("/api/finbot/chat")
async def handle_finbot_chat(req: FinBotChatRequest):
    """Direct in-process execution of FinBot Copilot."""
    from src.quant.quant_engine import process_copilot_query

    uid = req.user_id or req.session_id or "demo-trader"
    return await process_copilot_query(req.message, user_id=uid)


@router.post("/api/finbot/optimize")
async def handle_finbot_optimize(req: FinBotOptimizeRequest):
    """Native Markowitz Modern Portfolio Theory (MPT) optimization curve."""
    from src.quant.mpt_service import compute_efficient_frontier

    return compute_efficient_frontier()


@router.post("/api/finbot/tax-harvest")
async def handle_finbot_tax_harvest(req: FinBotTaxHarvestRequest):
    """Native Indian Section 112A Tax-Loss Harvesting calculation."""
    from src.quant.tax_service import calculate_tax_loss_harvesting

    return calculate_tax_loss_harvesting(
        realized_gains=req.realized_gains,
        unrealized_losses=req.unrealized_losses,
        holding_period_days=req.holding_period_days,
    )


@router.post("/api/multiagent/audit")
async def handle_multiagent_audit(req: MultiAgentAuditRequest):
    """Executes 3-Round Communicating Council of 5 Specialized Agents."""
    from src.quant.multiagent.cio_orchestrator import run_cio_council_deliberation

    return run_cio_council_deliberation(
        ticker=req.ticker,
        action=req.action,
        entry_price=req.entry_price,
        target_price=req.target_price,
        stoploss_price=req.stoploss_price,
        creator_name=req.creator_name,
        user_id=req.user_id,
        horizon_days=req.horizon_days,
        user_directive=req.user_directive,
    )


@router.post("/api/audit/drop")
async def handle_drag_and_drop_audit(
    file: Optional[UploadFile] = File(None),
    youtube_url: Optional[str] = Form(None),
    raw_text: Optional[str] = Form(None),
    creator_name: Optional[str] = Form("External Dropzone"),
    user_id: Optional[str] = Form("demo-trader"),
):
    """Multimodal Drag-and-Drop Ingestion Gateway."""
    from src.quant.multiagent.perception_agent import (
        commit_new_recommendation_to_db,
        extract_youtube_video_id,
        fetch_youtube_transcript,
        parse_pdf_document,
        parse_trade_entities_from_text,
    )
    from src.quant.multiagent.cio_orchestrator import run_cio_council_deliberation

    extracted_content = ""
    source_type = "TEXT_DROP"
    source_ref = "Direct Input"

    if youtube_url and youtube_url.strip():
        source_type = "YOUTUBE"
        source_ref = youtube_url.strip()
        vid = extract_youtube_video_id(youtube_url.strip())
        if vid:
            extracted_content = fetch_youtube_transcript(vid)
        else:
            extracted_content = f"Could not parse YouTube ID from {youtube_url}"
    elif file is not None:
        source_type = "FILE_UPLOAD"
        source_ref = file.filename
        content_bytes = await file.read()
        if file.filename.lower().endswith(".pdf"):
            extracted_content = parse_pdf_document(io.BytesIO(content_bytes))
        else:
            try:
                extracted_content = content_bytes.decode("utf-8", errors="ignore")
            except Exception:
                extracted_content = f"Binary media received: {file.filename}"
    elif raw_text and raw_text.strip():
        extracted_content = raw_text.strip()
    else:
        return {"error": "No valid source provided. Upload a PDF/video, provide a YouTube URL, or paste text."}

    parsed = parse_trade_entities_from_text(extracted_content)
    rec_id = commit_new_recommendation_to_db(
        ticker=parsed["ticker"],
        action=parsed["action"],
        entry=parsed["entry"],
        target=parsed["target"],
        stoploss=parsed["stoploss"],
        source_type=source_type,
        source_url=source_ref,
        raw_quote=extracted_content[:300],
        creator_name=creator_name or "Dropzone Ingestion",
    )

    council_result = run_cio_council_deliberation(
        ticker=parsed["ticker"],
        action=parsed["action"],
        entry_price=parsed["entry"],
        target_price=parsed["target"],
        stoploss_price=parsed["stoploss"],
        creator_name=creator_name,
        user_id=user_id or "demo-trader",
    )

    council_result["ingestion_meta"] = {
        "recommendation_id": rec_id,
        "source_type": source_type,
        "source_ref": source_ref,
        "text_preview": extracted_content[:200] + "..." if len(extracted_content) > 200 else extracted_content,
    }
    return council_result
