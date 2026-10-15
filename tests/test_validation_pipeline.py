import pytest
import sqlite3
import os
import sys

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.nlp.precision_extractor import PrecisionFinancialNER

DB_PATH = os.path.join(PROJECT_ROOT, "data", "marketprobe.db")

@pytest.fixture
def ner_engine():
    return PrecisionFinancialNER()

def test_database_integrity_and_scale():
    """Verify database has scaled beyond initial 1,003 rows and covers all 51 creators."""
    assert os.path.exists(DB_PATH), f"Database not found at {DB_PATH}"
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 1. Total recommendations count
    cur.execute("SELECT count(*) FROM recommendations")
    total_recs = cur.fetchone()[0]
    assert total_recs >= 2000, f"Expected at least 2,000 recommendations, found {total_recs}"
    
    # 2. Outcome breakdown
    cur.execute("SELECT outcome_status, count(*) FROM recommendations GROUP BY outcome_status")
    status_counts = dict(cur.fetchall())
    assert "HIT" in status_counts and status_counts["HIT"] >= 500
    assert "MISS" in status_counts and status_counts["MISS"] >= 500
    assert "OPEN" in status_counts and status_counts["OPEN"] >= 100
    
    # 3. Influencer coverage
    cur.execute("SELECT count(DISTINCT influencer_id) FROM recommendations")
    active_influencers = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM influencers")
    total_influencers = cur.fetchone()[0]
    assert active_influencers >= total_influencers, f"Active influencers ({active_influencers}) < Total ({total_influencers})"
    
    # 4. Realistic return sanity
    cur.execute("SELECT count(*) FROM recommendations WHERE actual_peak_return_pct > 150 OR actual_max_drawdown_pct < -60")
    anomalies = cur.fetchone()[0]
    assert anomalies == 0, f"Found {anomalies} extreme return anomalies"
    
    conn.close()

def test_nlp_precision_extractor_basic(ner_engine):
    """Test NER extraction with clean explicit stock target and stoploss."""
    text = "Motilal Oswal recommends BUY on Reliance Industries with target price 3250 and stop loss 2850"
    rec = ner_engine.extract_recommendation(text)
    assert rec is not None
    assert rec["ticker"] == "RELIANCE.NS"
    assert rec["action"] == "BUY"
    assert rec["target_price"] == 3250.0
    assert rec["stoploss_price"] == 2850.0
    assert rec["entry_price"] < rec["target_price"]
    assert rec["risk_reward_ratio"] > 0

def test_nlp_precision_extractor_desk_exclusion(ner_engine):
    """Verify that brokerage names (Emkay, Angel One, Motilal) are not misclassified as tickers."""
    text = "Emkay Global has initiated coverage on ICICI Bank with target 1450 and stop loss 1280"
    rec = ner_engine.extract_recommendation(text)
    assert rec is not None
    assert rec["ticker"] == "ICICIBANK.NS"
    assert rec["ticker"] != "EMKAY.NS"

def test_nlp_precision_extractor_target_precedence(ner_engine):
    """Ensure target price is accurately identified even when BUY keyword precedes numbers."""
    text = "HDFC Sec Buy Tata Consultancy Services tgt 4600 sl 4100"
    rec = ner_engine.extract_recommendation(text)
    assert rec is not None
    assert rec["ticker"] == "TCS.NS"
    assert rec["target_price"] == 4600.0
    assert rec["stoploss_price"] == 4100.0
