"""
End-to-End Automated Test Suite for MarketProbe Next-Gen Institutional Intelligence:
- Phase 1: SEC EDGAR CIK/XBRL & Bull vs. Bear AI Filings Debate + CIO Judge
- Phase 2: Insider Cluster Buy Radar (Strict Form 4 Code P/S Filter) & Finfluencer Divergence
- Phase 3: Earnings Call Vocal Stress Detector (Real librosa acoustic shift + Hedging + History)
"""

import io
import wave
import numpy as np
from fastapi.testclient import TestClient

from src.backend.api import app
from src.quant.sec_edgar_service import resolve_cik, extract_xbrl_snapshot, parse_form4_xml
from src.quant.multiagent.perception_rag_agent import evaluate_perception_rag_agent

client = TestClient(app)


def test_sec_edgar_cik_xbrl_and_form4_strict_filter():
    # 1. Dual-market CIK resolution (US + Indian NSE ADR)
    aapl = resolve_cik("AAPL")
    infy = resolve_cik("INFY")
    assert aapl is not None and aapl["cik"] == "0000320193"
    assert infy is not None and infy["cik"] == "0001067491"

    # 2. Live XBRL extraction (us-gaap for AAPL, ifrs-full for INFY)
    snap_aapl = extract_xbrl_snapshot(aapl["cik"])
    assert snap_aapl.get("revenue") is not None and snap_aapl["revenue"] > 1e10
    assert snap_aapl.get("net_income") is not None

    snap_infy = extract_xbrl_snapshot(infy["cik"])
    assert snap_infy.get("revenue") is not None and snap_infy["revenue"] > 1e9

    # 3. Strict Form 4 XML parser: keep ONLY Code 'P' and 'S', reject 'A', 'F', 'M'
    sample_form4_xml = """<?xml version="1.0"?>
    <ownershipDocument>
      <reportingOwner>
        <reportingOwnerId><rptOwnerName>Jane Doe</rptOwnerName></reportingOwnerId>
        <reportingOwnerRelationship>
          <isDirector>0</isDirector><isOfficer>1</isOfficer>
          <officerTitle>Chief Financial Officer</officerTitle>
        </reportingOwnerRelationship>
      </reportingOwner>
      <nonDerivativeTable>
        <nonDerivativeTransaction>
          <transactionDate><value>2026-11-10</value></transactionDate>
          <transactionCoding><transactionCode>P</transactionCode></transactionCoding>
          <transactionAmounts>
            <transactionShares><value>10000</value></transactionShares>
            <transactionPricePerShare><value>125.50</value></transactionPricePerShare>
          </transactionAmounts>
        </nonDerivativeTransaction>
        <nonDerivativeTransaction>
          <transactionDate><value>2026-11-10</value></transactionDate>
          <transactionCoding><transactionCode>A</transactionCode></transactionCoding>
          <transactionAmounts>
            <transactionShares><value>50000</value></transactionShares>
            <transactionPricePerShare><value>0</value></transactionPricePerShare>
          </transactionAmounts>
        </nonDerivativeTransaction>
        <nonDerivativeTransaction>
          <transactionDate><value>2026-11-11</value></transactionDate>
          <transactionCoding><transactionCode>M</transactionCode></transactionCoding>
          <transactionAmounts>
            <transactionShares><value>25000</value></transactionShares>
            <transactionPricePerShare><value>40.00</value></transactionPricePerShare>
          </transactionAmounts>
        </nonDerivativeTransaction>
        <nonDerivativeTransaction>
          <transactionDate><value>2026-11-12</value></transactionDate>
          <transactionCoding><transactionCode>F</transactionCode></transactionCoding>
          <transactionAmounts>
            <transactionShares><value>4000</value></transactionShares>
            <transactionPricePerShare><value>126.00</value></transactionPricePerShare>
          </transactionAmounts>
        </nonDerivativeTransaction>
        <nonDerivativeTransaction>
          <transactionDate><value>2026-11-13</value></transactionDate>
          <transactionCoding><transactionCode>S</transactionCode></transactionCoding>
          <transactionAmounts>
            <transactionShares><value>2000</value></transactionShares>
            <transactionPricePerShare><value>130.00</value></transactionPricePerShare>
          </transactionAmounts>
        </nonDerivativeTransaction>
      </nonDerivativeTable>
    </ownershipDocument>
    """
    parsed = parse_form4_xml(
        sample_form4_xml,
        ticker="TESTCO",
        company_name="Test Corp",
        filing_date="2026-11-14",
        filing_url="https://www.sec.gov/Archives/test",
        accession_no="0001-26-000001",
    )
    codes = [tx["transaction_code"] for tx in parsed]
    assert codes == ["P", "S"], f"Expected only ['P', 'S'], got {codes}"
    assert parsed[0]["total_value"] == 1255000.0
    assert parsed[0]["insider_role"] == "Chief Financial Officer"


def test_bull_vs_bear_filings_debate_endpoint():
    prev = client.get("/api/debate/filings/preview?ticker=INFY")
    assert prev.status_code == 200
    pdata = prev.json()
    assert pdata["ticker"] == "INFY"
    assert pdata["edgar_available"] is True
    assert pdata["xbrl_snapshot"].get("revenue") is not None

    resp = client.post("/api/debate/filings", json={"ticker": "INFY", "horizon_days": 30})
    assert resp.status_code == 200
    data = resp.json()

    assert data["ticker"] == "INFY"
    assert len(data["bull_counsel"]["arguments"]) >= 1
    assert len(data["bear_counsel"]["arguments"]) >= 1
    for arg in data["bull_counsel"]["arguments"]:
        assert arg.get("filing_ref")
    judge = data["cio_judge"]
    assert judge["winner"] in ("BULL_WIN", "BEAR_WIN", "SPLIT_DECISION")
    assert -15 <= judge["filing_conviction_delta"] <= 15
    for side in ("bull_scores", "bear_scores"):
        for k in ("evidence_grounding", "financial_rigor", "risk_realism"):
            assert 0 <= judge[side][k] <= 100
    assert "not" in data["sebi_disclaimer"].lower()


def test_insider_cluster_radar_and_council_perception_integration():
    resp = client.get("/api/insiders/clusters?market=ALL&window_days=30&min_insiders=2")
    assert resp.status_code == 200
    data = resp.json()

    assert data["summary"]["active_buy_clusters"] >= 1
    assert len(data["clusters"]) >= 1
    top = data["clusters"][0]
    assert top["distinct_buyers"] >= 2
    assert 0 <= top["cluster_conviction_score"] <= 100
    assert top["divergence"]["code"] in (
        "SMART_MONEY_CONFIRMED",
        "STEALTH_ACCUMULATION",
        "FINFLUENCER_TRAP",
        "INSIDER_DISTRIBUTION",
        "NEUTRAL_FLOW",
    )

    # Single-ticker insider endpoint
    t_resp = client.get("/api/insiders/ticker/HDFCBANK")
    assert t_resp.status_code == 200
    tdata = t_resp.json()
    assert tdata["has_activity"] is True
    assert tdata["distinct_buyers"] >= 2

    # Agent 1 (Perception) must automatically pull live insider telemetry
    agent1 = evaluate_perception_rag_agent("HDFCBANK", action="BUY", creator_name="Kotak Securities")
    assert "insider_telemetry" in agent1
    assert agent1["insider_telemetry"]["has_activity"] is True


def test_vocal_stress_real_librosa_audio_upload_and_sample():
    # 1. Sample concall endpoint check
    s_resp = client.post("/api/audio/stress-audit", json={"sample_id": "infy_q3_concall"})
    assert s_resp.status_code == 200
    sdata = s_resp.json()
    assert sdata["ticker"] == "INFY"
    assert 0 <= sdata["composite_stress_score"] <= 100
    assert len(sdata["timeline"]) == 12
    assert sdata["linguistic_forensics"]["hedging_hits_count"] >= 2

    # 2. Deterministic synthetic WAV upload: calm prepared (3.5s) -> stressed jittered + paused Q&A (4.5s)
    sr = 16000
    t_prep = np.linspace(0, 3.5, int(sr * 3.5), endpoint=False)
    y_prep = 0.35 * np.sin(2 * np.pi * 140.0 * t_prep)

    rng = np.random.default_rng(7)
    n_qa = int(sr * 4.5)
    t_qa = np.linspace(0, 4.5, n_qa, endpoint=False)
    f0_qa = 152.0 + 28.0 * np.sin(2 * np.pi * 2.3 * t_qa) + 12.0 * rng.standard_normal(n_qa).cumsum() / np.sqrt(n_qa)
    f0_qa = np.clip(f0_qa, 115.0, 240.0)
    phase = 2 * np.pi * np.cumsum(f0_qa) / sr
    y_qa = 0.34 * (1.0 + 0.32 * np.sin(2 * np.pi * 9.0 * t_qa)) * np.sin(phase)
    # Inject 4 hesitation pauses in Q&A
    for k in range(4):
        idx = int(((k + 0.5) / 5.0) * n_qa)
        y_qa[idx : idx + int(0.25 * sr)] *= 0.005

    pcm = np.int16(np.clip(np.concatenate([y_prep, y_qa]), -0.95, 0.95) * 32767)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())

    transcript = (
        "We achieved strong record margins and disciplined cash generation across core segments. "
        "[QA_START] "
        "Looking ahead, we face macro headwinds, challenging visibility, and elongated deal cycles. "
        "We are taking a cautious stance and prudently recalibrating our near-term softness."
    )
    u_resp = client.post(
        "/api/audio/stress-audit",
        data={
            "ticker": "TCS",
            "qa_split_sec": "3.5",
            "transcript_text": transcript,
        },
        files={"audio_file": ("test_concall.wav", buf.getvalue(), "audio/wav")},
    )
    assert u_resp.status_code == 200
    udata = u_resp.json()
    assert udata["ticker"] == "TCS"
    assert udata["acoustic_biomarkers"]["deltas"]["f0_variance_delta_pct"] > 0
    assert udata["acoustic_biomarkers"]["deltas"]["pause_hesitation_delta_pct"] > 0
    assert udata["linguistic_forensics"]["qa_sentiment_drop"] > 0
    assert udata["linguistic_forensics"]["hedging_hits_count"] >= 2
    assert 0 <= udata["composite_stress_score"] <= 100

    # 3. Verify persistence in stress history endpoint, then clean up synthetic test row
    h_resp = client.get("/api/audio/stress-history?limit=10")
    assert h_resp.status_code == 200
    hdata = h_resp.json()
    assert hdata["count"] >= 2
    assert any(row["ticker"] == "TCS" for row in hdata["history"])

    import sqlite3, os
    conn = sqlite3.connect(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "marketprobe.db"))
    conn.execute("DELETE FROM earnings_stress_audits WHERE call_title = 'TCS Earnings Call Vocal Forensics'")
    conn.commit()
    conn.close()


def test_db_adapter_postgres_translation_and_health_metadata():
    from src.backend.db_adapter import _translate_sql_for_postgres

    ddl = _translate_sql_for_postgres(
        "CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, flag BOOLEAN DEFAULT 0)"
    )
    assert "SERIAL PRIMARY KEY" in ddl
    assert "INTEGER DEFAULT 0" in ddl

    dml = _translate_sql_for_postgres("INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)")
    assert dml.startswith("INSERT INTO users")
    assert "%s, %s" in dml
    assert "ON CONFLICT DO NOTHING" in dml

    health = client.get("/api/health").json()
    assert health["database_backend"]["backend"] in ("sqlite", "postgresql")
    assert "market_data_connector" in health


def test_nse_sebi_pit_csv_importer_and_official_indices_endpoint():
    sample_csv = (
        "SYMBOL,COMPANY,NAME OF THE ACQUIRER/DISPOSER,CATEGORY OF PERSON,"
        "NO. OF SECURITY (ACQUIRED/DISPLOSED),VALUE OF SECURITY (ACQUIRED/DISPLOSED),"
        "ACQUISITION/DISPOSAL TRANSACTION TYPE,MODE OF ACQUISITION,"
        "DATE OF ALLOTMENT/ACQUISITION FROM,BROADCASTE DATE AND TIME\n"
        "UNITTESTCO,Unit Test India Ltd,A. Sharma,Promoter,5000,7500000,Buy,Market Purchase,18-Nov-2026,19-Nov-2026 10:15\n"
        "UNITTESTCO,Unit Test India Ltd,B. Rao,Director,10000,15000000,Buy,ESOP,18-Nov-2026,19-Nov-2026 10:15\n"
        "UNITTESTCO,Unit Test India Ltd,C. Nair,KMP,2000,3000000,Sell,Market Sale,18-Nov-2026,19-Nov-2026 10:15\n"
    )
    resp = client.post("/api/insiders/import-sebi-pit", json={"csv_text": sample_csv})
    assert resp.status_code == 200
    d = resp.json()
    assert d["open_market_parsed"] == 2
    assert d["skipped_non_market"] == 1
    assert d["buys"] == 1 and d["sells"] == 1

    # Clean up test ticker from DB
    import sqlite3, os
    conn = sqlite3.connect(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "marketprobe.db"))
    conn.execute("DELETE FROM insider_transactions WHERE ticker = 'UNITTESTCO'")
    conn.commit()
    conn.close()

    # Official NSE allIndices endpoint
    idx_resp = client.get("/api/market/indices")
    assert idx_resp.status_code == 200
    idx_data = idx_resp.json()
    assert idx_data["status"] in ("live", "cached_fallback", "unavailable")
    assert "connector" in idx_data
