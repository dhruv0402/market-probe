"""
Next-Gen Institutional Intelligence FastAPI Router:
- Phase 1: Bull vs. Bear AI Filings Debate + SEC EDGAR XBRL Preview
- Phase 2: Insider Cluster Buy Radar + Smart-Money vs. Finfluencer Divergence
- Phase 3: Earnings Call Vocal Stress & Executive Hedging Lab
"""

import asyncio
from typing import List, Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel

router = APIRouter(tags=["Next-Gen Institutional Intelligence"])


@router.get("/api/debate/filings/preview")
async def preview_company_filings(ticker: str = Query(..., min_length=1, max_length=24)):
    """Fast cached SEC EDGAR filing metadata & audited XBRL highlights preview."""
    from src.quant.sec_edgar_service import fetch_company_filings_context

    ctx = await asyncio.to_thread(fetch_company_filings_context, ticker)
    return {
        "ticker": ctx["ticker"],
        "sec_ticker": ctx.get("sec_ticker", ctx["ticker"]),
        "company_name": ctx["company_name"],
        "cik": ctx.get("cik"),
        "source_mode": ctx["source_mode"],
        "edgar_available": ctx["edgar_available"],
        "edgar_browse_url": ctx.get("edgar_browse_url"),
        "nse_disclosure_url": ctx.get("nse_disclosure_url"),
        "latest_primary_filing": ctx.get("latest_primary_filing"),
        "filings": ctx.get("filings", [])[:6],
        "xbrl_snapshot": ctx.get("xbrl_snapshot", {}),
    }


@router.post("/api/debate/filings")
async def run_bull_vs_bear_filings_debate(request: Request):
    """
    Phase 1 — Bull vs. Bear AI Filings Debate + CIO Judge.
    Accepts either JSON (`{ticker, horizon_days}`) or multipart form-data with optional `filing_pdf`.
    """
    from src.quant.multiagent.filings_debate_agent import run_filings_debate

    content_type = (request.headers.get("content-type") or "").lower()
    ticker = "AAPL"
    horizon_days = 30
    pdf_bytes: Optional[bytes] = None
    pdf_filename: Optional[str] = None
    user_id = "institutional_desk"

    if "multipart/form-data" in content_type:
        form = await request.form()
        ticker = str(form.get("ticker") or "AAPL").strip()
        try:
            horizon_days = max(5, min(365, int(form.get("horizon_days") or 30)))
        except Exception:
            horizon_days = 30
        user_id = str(form.get("user_id") or "institutional_desk")
        upload = form.get("filing_pdf") or form.get("file")
        if upload is not None and hasattr(upload, "read"):
            pdf_bytes = await upload.read()
            pdf_filename = getattr(upload, "filename", "uploaded_filing.pdf")
            if pdf_bytes and len(pdf_bytes) == 0:
                pdf_bytes = None
    else:
        try:
            body = await request.json()
        except Exception:
            body = {}
        ticker = str(body.get("ticker") or "AAPL").strip()
        try:
            horizon_days = max(5, min(365, int(body.get("horizon_days") or 30)))
        except Exception:
            horizon_days = 30
        user_id = str(body.get("user_id") or "institutional_desk")

    return await run_filings_debate(
        ticker=ticker,
        horizon_days=horizon_days,
        pdf_bytes=pdf_bytes,
        pdf_filename=pdf_filename,
        user_id=user_id,
    )


@router.get("/api/insiders/clusters")
async def get_insider_clusters(
    market: str = Query("ALL"),
    window_days: int = Query(30, ge=1, le=365),
    min_insiders: int = Query(2, ge=1, le=10),
):
    """Phase 2 — Insider Cluster Buy Radar & Smart-Money vs. Finfluencer Divergence."""
    from src.quant.insider_cluster_service import detect_insider_clusters

    return await asyncio.to_thread(
        detect_insider_clusters,
        market=market,
        window_days=window_days,
        min_insiders=min_insiders,
    )


@router.get("/api/insiders/ticker/{symbol}")
async def get_ticker_insiders(symbol: str, window_days: int = Query(90, ge=7, le=365)):
    """Single-ticker insider transaction ledger & Smart-Money Divergence summary."""
    from src.quant.insider_cluster_service import get_ticker_insider_summary

    return await asyncio.to_thread(get_ticker_insider_summary, symbol, window_days)


class InsiderSyncRequest(BaseModel):
    tickers: Optional[List[str]] = None
    max_filings_per_ticker: int = 8


@router.post("/api/insiders/sync")
async def trigger_insider_sec_sync(req: Optional[InsiderSyncRequest] = None):
    """Triggers live SEC EDGAR Form 4 XML ingestion (Code P & Code S open-market only)."""
    from src.quant.insider_cluster_service import sync_live_sec_form4

    tickers = req.tickers if (req and req.tickers) else None
    max_f = req.max_filings_per_ticker if req else 6
    return await asyncio.to_thread(sync_live_sec_form4, tickers, max_f)


@router.post("/api/insiders/import-sebi-pit")
async def import_nse_sebi_pit_disclosures(request: Request):
    """Imports official NSE SEBI PIT Insider Trading CSV (`CF-Insider-Trading-equities-*.csv`)."""
    from src.quant.insider_cluster_service import import_nse_sebi_pit_csv

    content_type = (request.headers.get("content-type") or "").lower()
    csv_text = ""
    if "multipart/form-data" in content_type:
        form = await request.form()
        upload = form.get("file") or form.get("csv_file")
        if upload is not None and hasattr(upload, "read"):
            raw = await upload.read()
            csv_text = raw.decode("utf-8", errors="ignore")
        else:
            csv_text = str(form.get("csv_text") or "")
    else:
        try:
            body = await request.json()
            csv_text = str(body.get("csv_text") or "")
        except Exception:
            raw = await request.body()
            csv_text = raw.decode("utf-8", errors="ignore")

    return await asyncio.to_thread(import_nse_sebi_pit_csv, csv_text)


@router.post("/api/audio/stress-audit")
async def run_earnings_vocal_stress_audit(request: Request):
    """
    Phase 3 — Earnings Call Vocal Stress & Executive Hedging Detector.
    Accepts multipart audio upload (.wav/.mp3/.m4a) OR JSON (sample_id or transcript_text).
    """
    from src.quant.vocal_stress_service import analyze_earnings_vocal_stress

    content_type = (request.headers.get("content-type") or "").lower()
    ticker = "INFY"
    call_title: Optional[str] = None
    earnings_date: Optional[str] = None
    qa_split_sec: Optional[float] = None
    transcript_text: Optional[str] = None
    sample_id: Optional[str] = None
    audio_bytes: Optional[bytes] = None
    filename: Optional[str] = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        ticker = str(form.get("ticker") or "INFY").strip()
        call_title = str(form.get("call_title") or "").strip() or None
        earnings_date = str(form.get("earnings_date") or "").strip() or None
        transcript_text = str(form.get("transcript_text") or "").strip() or None
        sample_id = str(form.get("sample_id") or "").strip() or None
        raw_split = form.get("qa_split_sec")
        if raw_split not in (None, ""):
            try:
                qa_split_sec = float(raw_split)
            except Exception:
                qa_split_sec = None
        upload = form.get("audio_file") or form.get("file")
        if upload is not None and hasattr(upload, "read"):
            audio_bytes = await upload.read()
            filename = getattr(upload, "filename", "earnings_call.wav")
            if audio_bytes and len(audio_bytes) == 0:
                audio_bytes = None
    else:
        try:
            body = await request.json()
        except Exception:
            body = {}
        ticker = str(body.get("ticker") or "INFY").strip()
        call_title = body.get("call_title") or None
        earnings_date = body.get("earnings_date") or None
        transcript_text = body.get("transcript_text") or None
        sample_id = body.get("sample_id") or None
        if body.get("qa_split_sec") not in (None, ""):
            try:
                qa_split_sec = float(body["qa_split_sec"])
            except Exception:
                qa_split_sec = None

    return await analyze_earnings_vocal_stress(
        ticker=ticker,
        call_title=call_title,
        earnings_date=earnings_date,
        audio_bytes=audio_bytes,
        filename=filename,
        qa_split_sec=qa_split_sec,
        transcript_text=transcript_text,
        sample_id=sample_id,
    )


@router.get("/api/audio/stress-history")
async def get_earnings_vocal_stress_history(limit: int = Query(20, ge=1, le=100)):
    """Returns verifiable sample earnings call profiles and persisted stress-vs-drift audits."""
    from src.quant.vocal_stress_service import get_vocal_stress_history

    return await asyncio.to_thread(get_vocal_stress_history, limit)
