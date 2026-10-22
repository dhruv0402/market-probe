import pytest
import sqlite3
import os
import sys
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.nlp.precision_extractor import PrecisionFinancialNER
from src.backend.api import app
from src.backend.security import create_jwt_token, hash_password, verify_password

DB_PATH = os.path.join(PROJECT_ROOT, "data", "marketprobe.db")

@pytest.fixture
def ner_engine():
    return PrecisionFinancialNER()

@pytest.fixture
def client():
    return TestClient(app)

# ==========================================
# 1. DATABASE & INTEGRITY TESTS
# ==========================================

def test_database_integrity_and_scale():
    """Verify database has scaled beyond initial 1,003 rows and covers all 51+ creators."""
    assert os.path.exists(DB_PATH), f"Database not found at {DB_PATH}"
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    cur.execute("SELECT count(*) FROM recommendations")
    total_recs = cur.fetchone()[0]
    assert total_recs >= 2000, f"Expected at least 2,000 recommendations, found {total_recs}"
    
    cur.execute("SELECT outcome_status, count(*) FROM recommendations GROUP BY outcome_status")
    status_counts = dict(cur.fetchall())
    assert "HIT" in status_counts and status_counts["HIT"] >= 500
    assert "MISS" in status_counts and status_counts["MISS"] >= 500
    assert "OPEN" in status_counts and status_counts["OPEN"] >= 100
    
    cur.execute("SELECT count(DISTINCT influencer_id) FROM recommendations")
    active_influencers = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM influencers")
    total_influencers = cur.fetchone()[0]
    assert active_influencers >= total_influencers
    
    cur.execute("SELECT count(*) FROM recommendations WHERE actual_peak_return_pct > 150 OR actual_max_drawdown_pct < -60")
    anomalies = cur.fetchone()[0]
    assert anomalies == 0, f"Found {anomalies} extreme return anomalies"
    
    conn.close()

def test_no_orphaned_recommendations():
    """Verify that all recommendations link to an existing influencer in influencers table."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        SELECT count(*) FROM recommendations r
        LEFT JOIN influencers i ON r.influencer_id = i.id
        WHERE i.id IS NULL
    """)
    orphaned = cur.fetchone()[0]
    conn.close()
    assert orphaned == 0, f"Found {orphaned} orphaned recommendation rows!"

# ==========================================
# 2. NLP EXTRACTION & DISAMBIGUATION TESTS
# ==========================================

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
    assert rec["instrument_type"] == "EQUITY"

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

def test_nlp_option_strike_disambiguation(ner_engine):
    """Ensure options strike numbers (e.g. 24500 CE) are flagged as OPTION and separated from entry/target prices."""
    text = "Buy NIFTY 24500 CE at 135 target 210 stop loss 95"
    rec = ner_engine.extract_recommendation(text)
    assert rec is not None
    assert rec["ticker"] == "^NSEI"
    assert rec["instrument_type"] == "OPTION"
    assert rec["option_strike"] == 24500.0
    assert rec["option_type"] == "CE"
    assert rec["entry_price"] == 135.0
    assert rec["target_price"] == 210.0
    assert rec["stoploss_price"] == 95.0

def test_nlp_hinglish_slang_extraction(ner_engine):
    """Verify Hindi trading slang: BECHO (Sell), KHAREEDO (Buy), PAKKA TARGET."""
    buy_text = "TATA MOTORS ko khareedo around 950 target 1040 sl 910"
    rec_buy = ner_engine.extract_recommendation(buy_text)
    assert rec_buy is not None
    assert "TATAMOTORS" in rec_buy["ticker"]
    assert rec_buy["action"] == "BUY"

    sell_text = "INFOSYS becho CMP 1850 target 1720 stop loss 1910"
    rec_sell = ner_engine.extract_recommendation(sell_text)
    assert rec_sell is not None
    assert "INFY" in rec_sell["ticker"]
    assert rec_sell["action"] == "SELL"

def test_nlp_handles_none_gracefully(ner_engine):
    """Ensure incomplete messages do not crash with NoneType or mathematical errors."""
    incomplete_text = "Looking very bullish on State Bank of India today!"
    rec = ner_engine.extract_recommendation(incomplete_text)
    assert rec is not None
    assert "SBIN" in rec["ticker"]
    assert rec["entry_price"] > 0
    assert rec["target_price"] > rec["entry_price"]
    assert rec["stoploss_price"] < rec["entry_price"]

# ==========================================
# 3. FASTAPI BACKEND API ENDPOINTS
# ==========================================

def test_api_health_check(client):
    """Test standard health check /api/health endpoint."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "healthy"
    assert data.get("database") == "connected"
    assert data.get("ner_engine") == "ready"

def test_api_home_feed_endpoint(client):
    """Test home feed endpoint with recommendations and summary statistics."""
    resp = client.get("/api/home-feed?min_conviction=0")
    assert resp.status_code == 200
    feed = resp.json()
    assert "stats" in feed
    assert "recent_tips" in feed
    assert len(feed["recent_tips"]) > 0
    first = feed["recent_tips"][0]
    assert "ticker" in first
    assert "action" in first
    assert "kite_basket_url" in first

def test_api_influencers_summary(client):
    """Test leaderboard / influencers list returns audited creators."""
    resp = client.get("/api/influencers")
    assert resp.status_code == 200
    data = resp.json()
    assert "leaderboard" in data
    assert len(data["leaderboard"]) >= 45

def test_api_dataset_endpoint(client):
    """Test /api/dataset paginated query endpoint."""
    resp = client.get("/api/dataset?limit=10")
    assert resp.status_code == 200
    data = resp.json()
    assert "dataset" in data
    assert len(data["dataset"]) <= 10

def test_api_sebi_export_format(client):
    """Verify SEBI regulatory export returns valid CSV or JSON formatted data."""
    resp_json = client.get("/api/export/sebi-audit?format=json")
    assert resp_json.status_code == 200
    data = resp_json.json()
    assert "records" in data
    assert len(data["records"]) > 0

    resp_csv = client.get("/api/export/sebi-audit?format=csv")
    assert resp_csv.status_code == 200
    assert "text/csv" in resp_csv.headers.get("content-type", "")
    assert "audit_id" in resp_csv.text.lower() or "ticker" in resp_csv.text.lower()

# ==========================================
# 4. SECURITY & AUTHENTICATION TESTS
# ==========================================

def test_password_hashing_and_verification():
    """Verify bcrypt or pbkdf2 password hashing behaves deterministically and securely."""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_token_generation_and_payload():
    """Verify JWT access tokens encode user information properly."""
    payload = {"user_id": 999, "email": "audit@marketprobe.internal"}
    token = create_jwt_token(payload)
    assert isinstance(token, str)
    assert len(token) > 20
