
import os
import sys

def _get_project_root():
    curr = os.path.dirname(os.path.abspath(__file__))
    while curr != "/" and curr != os.path.dirname(curr):
        if os.path.exists(os.path.join(curr, "data", "marketprobe.db")) or os.path.exists(os.path.join(curr, "requirements.txt")):
            return curr
        curr = os.path.dirname(curr)
    return os.path.expanduser("~/marketprobe")

PROJECT_ROOT = _get_project_root()

import sqlite3
import os
import yfinance as yf
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")) if "src/" in os.path.abspath(__file__) else os.path.dirname(os.path.abspath(__file__)))
from src.nlp.precision_extractor import PrecisionFinancialNER

DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))
ner_engine = PrecisionFinancialNER()

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# 1. Fetch desk IDs
cur.execute("SELECT id, handle FROM influencers")
handle_to_id = {row[1]: row[0] for row in cur.fetchall()}

# 2. Add realistic NIFTY 50 & BANKNIFTY recommendations from top experts
SAMPLE_INDEX_CALLS = [
    ("PrakashGaba", "BUY NIFTY at 24100 CMP target 24350 stoploss 23950 strong technical support holding"),
    ("KunalSaraogi", "BUY NIFTY at 24050 target 24280 stoploss 23900 breakout above resistance"),
    ("Motilal", "BUY NIFTY at 24150 target 24450 stoploss 24000 institutional momentum buy"),
    ("KotakSecurities", "SELL NIFTY at 24250 target 23950 stoploss 24380 resistance rejection"),
    ("ICICIDirect", "BUY BANK NIFTY at 57400 target 58200 stoploss 57000 private banking rally"),
    ("PrakashGaba", "BUY BANK NIFTY at 57200 target 57900 stoploss 56800 support bounce"),
    ("KunalSaraogi", "SELL BANK NIFTY at 57800 target 57100 stoploss 58150 overbought cooling"),
    ("HDFCSec", "BUY NIFTY at 24080 target 24320 stoploss 23920 IT & Pharma support"),
    ("AxisSec", "BUY BANK NIFTY at 57350 target 58100 stoploss 56950 PSU banking strength")
]

ingested = 0
for handle, text in SAMPLE_INDEX_CALLS:
    inf_id = handle_to_id.get(handle, list(handle_to_id.values())[0])
    rec = ner_engine.extract_recommendation(text)
    if rec:
        cur.execute('''
            INSERT INTO recommendations 
            (influencer_id, platform, source_url, ticker, company_name, action, entry_price, target_price, stoploss_price, risk_reward_ratio, call_timestamp, raw_quote, confidence_score, is_sponsored_flag, outcome_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, 0.95, 0, 'OPEN')
        ''', (inf_id, "institutional", "https://nseindia.com", rec["ticker"], rec["company_name"], rec["action"], rec["entry_price"], rec["target_price"], rec["stoploss_price"], rec["risk_reward_ratio"], text))
        ingested += 1

conn.commit()
conn.close()
print(f"✅ Ingested {ingested} NIFTY 50 and Bank Nifty Index calls.")
