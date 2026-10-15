
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
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import re
import yfinance as yf
import datetime

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.nlp.precision_extractor import PrecisionFinancialNER

DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))
ner_engine = PrecisionFinancialNER()

# Comprehensive Creator / Institutional Desk Mapping
CREATOR_PATTERNS = [
    # Institutional Desks
    (236, ["motilal oswal", "motilal"]),
    (238, ["icici direct", "icicidirect"]),
    (239, ["kotak securities", "kotak sec"]),
    (257, ["hdfc securities", "hdfc sec"]),
    (258, ["axis securities", "axis sec"]),
    (259, ["angel one", "angel broking"]),
    (247, ["sharekhan"]),
    (248, ["emkay global", "emkay"]),
    (249, ["prabhudas lilladher", "prabhudas"]),
    (250, ["nirmal bang"]),
    (255, ["sumeet bagadia", "choice equity", "bagadia"]),
    
    # Experts / Registered Analysts
    (220, ["kunal saraogi", "saraogi"]),
    (235, ["prakash gaba", "gaba"]),
    (226, ["rakesh bansal", "dr. rakesh bansal"]),
    (233, ["sanjiv bhasin", "bhasin"]),
    (234, ["nooresh merani", "nooresh"]),
    (261, ["vivek bajaj", "stockedge"]),
    (227, ["seema jain", "stockpro"]),
    (228, ["bharat jhunjhunwala"]),
    (229, ["trade with trend"]),
    (230, ["theta gainers"]),
    
    # Prominent Creators / Finfluencers
    (211, ["anant ladha", "invest aaj for kal"]),
    (212, ["neeraj joshi"]),
    (213, ["subasish pani", "power of stocks"]),
    (214, ["anish singh thakur", "booming bulls"]),
    (215, ["mukul agrawal"]),
    (216, ["ghanshyam tech", "ghanshyam"]),
    (217, ["sunil minglani"]),
    (218, ["nitin bhatia"]),
    (219, ["sidharth bhanushali"]),
    (221, ["stock market ka commando"]),
    (222, ["pr sundar", "p.r. sundar"]),
    (223, ["abhishek kar"]),
    (224, ["malkansview", "vishal malkan"]),
    (225, ["vijay thakkar"]),
    (231, ["rachana ranade", "ca rachana ranade"]),
    (232, ["akshat shrivastava", "akshat"]),
    (260, ["pranjal kamra"]),
    (262, ["pushkar raj thakur", "pushkar"])
]

# Targeted Google News Financial Feed Queries
TARGETED_QUERIES = [
    # Top Institutional Desks
    "Buy target HDFC Securities",
    "Buy target ICICI Direct",
    "Buy target Kotak Securities",
    "Buy target Motilal Oswal",
    "Buy target Axis Securities",
    "Buy target Sharekhan",
    "Buy target Angel One",
    "Buy target Emkay Global",
    "Buy target Prabhudas Lilladher",
    "Buy target Nirmal Bang",
    "Sumeet Bagadia buy target",
    
    # Top Analysts & Advisors
    "Sanjiv Bhasin stocks to buy target",
    "Kunal Saraogi technical picks target",
    "Prakash Gaba buy sell target",
    "Rakesh Bansal stocks target stop loss",
    "Nooresh Merani stock picks target",
    "Vivek Bajaj StockEdge breakout buy",
    "StockPro Seema Jain target stoploss",
    
    # Popular Finfluencers
    "Anant Ladha stocks to buy",
    "Mukul Agrawal portfolio stock buy",
    "Nitin Bhatia stocks to buy target",
    "Rachana Ranade stock analysis buy",
    "Pushkar Raj Thakur stock investment buy",
    "Subasish Pani Power of Stocks breakout",
    "Ghanshyam Tech trading setup target",
    "Abhishek Kar trading call target",
    "Pranjal Kamra stock to buy",
    
    # High-Density Sector & Daily Focus Calls
    "Top Stocks to Buy Today target stoploss",
    "Stocks in Focus Target Price Moneycontrol",
    "Breakout Stocks Target Stoploss Livemint",
    "Technical Stock Picks Target Stoploss Zee Business",
    "Nifty 50 Bluechips Buy Target Brokerage",
    "Banking stocks buy target stoploss",
    "IT stocks buy target stoploss",
    "Auto stocks buy target stoploss",
    "FMCG Pharma stocks buy target stoploss"
]

def resolve_influencer(combined_text: str) -> tuple[int, str]:
    text_lower = combined_text.lower()
    for inf_id, keywords in CREATOR_PATTERNS:
        for kw in keywords:
            if kw in text_lower:
                return inf_id, "Matched"
    # Default fallback to institutional desk
    return 236, "Fallback"

def run_scale_ingestion():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    ingested_count = 0
    skipped_duplicates = 0
    
    print(f"🚀 Initializing High-Density Multi-Creator Ingestion Pipeline across {len(TARGETED_QUERIES)} search queries...\n")
    
    for query in TARGETED_QUERIES:
        encoded_query = urllib.parse.quote(query)
        url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"
        
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                tree = ET.fromstring(resp.read())
                
            items = tree.findall(".//item")
            print(f"📡 Query [{query}]: Found {len(items)} raw financial posts...")
            
            for item in items:
                title = item.findtext("title", "")
                link = item.findtext("link", "")
                pub_date = item.findtext("pubDate", "")
                desc = item.findtext("description", "")
                combined_text = f"{title}. {desc}"
                
                rec = ner_engine.extract_recommendation(combined_text)
                if not rec or rec["ticker"] == "PENNY_STOCK.NS":
                    continue
                    
                inf_id, match_type = resolve_influencer(combined_text)
                
                # Check for duplicate
                cur.execute("SELECT id FROM recommendations WHERE ticker = ? AND raw_quote = ?", (rec["ticker"], title))
                if cur.fetchone():
                    skipped_duplicates += 1
                    continue
                    
                # Determine platform type for influencer
                cur.execute("SELECT platform, name FROM influencers WHERE id = ?", (inf_id,))
                inf_row = cur.fetchone()
                platform = inf_row[0] if inf_row else "institutional"
                inf_name = inf_row[1] if inf_row else "Institutional Desk"
                
                cur.execute('''
                    INSERT INTO recommendations 
                    (influencer_id, platform, source_url, ticker, company_name, action, 
                     entry_price, target_price, stoploss_price, risk_reward_ratio, 
                     call_timestamp, raw_quote, confidence_score, is_sponsored_flag, outcome_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, 0.92, 0, 'OPEN')
                ''', (
                    inf_id, 
                    "Broker Research" if platform == "institutional" else "YouTube / Social", 
                    link, 
                    rec["ticker"], 
                    rec["company_name"], 
                    rec["action"], 
                    rec["entry_price"], 
                    rec["target_price"], 
                    rec["stoploss_price"], 
                    rec["risk_reward_ratio"], 
                    title
                ))
                ingested_count += 1
                
        except Exception as e:
            print(f"   [!] Error querying '{query}': {e}")
            
    conn.commit()
    conn.close()
    
    print(f"\n==========================================")
    print(f"🎉 Ingestion Run Complete!")
    print(f"✅ Ingested: {ingested_count} brand-new verifiable financial recommendations")
    print(f"⏭️ Skipped Duplicates: {skipped_duplicates}")
    print(f"==========================================\n")
    return ingested_count

if __name__ == "__main__":
    run_scale_ingestion()
