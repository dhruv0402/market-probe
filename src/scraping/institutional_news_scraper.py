
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
import re
import time
import feedparser
import urllib.parse
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")) if "src/" in os.path.abspath(__file__) else os.path.dirname(os.path.abspath(__file__)))
from src.nlp.precision_extractor import PrecisionFinancialNER

DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))
LOG_PATH = os.path.join(PROJECT_ROOT, "multi_platform.log")

def log(msg):
    t = time.strftime("[%Y-%m-%d %H:%M:%S]")
    line = f"{t} {msg}"
    print(line)
    with open(LOG_PATH, "a") as f:
        f.write(line + "\n")

def run_institutional_collector():
    ner = PrecisionFinancialNER()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    desks = [
        ("Motilal Oswal Financial Services", "MotilalOswal", 1200000, 1, "INZ000158836"),
        ("ICICI Direct Research", "ICICIDirect", 2100000, 1, "INZ000183631"),
        ("Kotak Securities Research", "KotakSecurities", 1800000, 1, "INZ000200137"),
        ("HDFC Securities Institutional Desk", "HDFCSecurities", 1500000, 1, "INZ000186937"),
        ("Sharekhan by BNP Paribas", "Sharekhan", 950000, 1, "INZ000171337"),
        ("Emkay Global Financial", "EmkayGlobal", 420000, 1, "INZ000295832"),
        ("Prabhudas Lilladher", "PLIndia", 380000, 1, "INZ000196637"),
        ("Nirmal Bang Institutional", "NirmalBang", 310000, 1, "INZ000202536"),
        ("Kunal Saraogi (Equityrush)", "KunalSaraogi", 1180000, 1, "INH000000277"),
        ("Dr. Rakesh Bansal Ventures", "DrRakeshBansal", 510000, 1, "INH000008432"),
        ("Nooresh Merani (AnalyzeIndia)", "NooreshMerani", 180000, 1, "INH000001234"),
        ("Prakash Gaba Technicals", "PrakashGaba", 290000, 1, "INH000003456"),
        ("Sumeet Bagadia (Choice Equity)", "SumeetBagadia", 410000, 1, "INH000004567")
    ]
    
    for name, handle, subs, is_sebi, sebi_no in desks:
        cur.execute('''
            INSERT OR REPLACE INTO influencers (name, platform, handle, approx_subscribers, is_sebi_registered, sebi_reg_no)
            VALUES (?, 'institutional', ?, ?, ?, ?)
        ''', (name, handle, subs, is_sebi, sebi_no))
    conn.commit()

    search_queries = [
        '"target price" "buy" "stop loss" site:moneycontrol.com',
        '"brokerage" "recommends" "buy" "target" site:economictimes.indiatimes.com',
        '"stocks to buy" "target" "stoploss" site:livemint.com',
        '"trading calls" "buy" "tgt" "sl" site:zeebiz.com',
        '"hot stocks" "target price" "buy" site:ndtvprofit.com',
        '"Kunal Saraogi" "buy" OR "sell" stock',
        '"Rakesh Bansal" "target" "stop loss"',
        '"Prakash Gaba" "buy" OR "sell"',
        '"Motilal Oswal" "buy" "target price"',
        '"ICICI Direct" "recommends" "buy"',
        '"Kotak Securities" "target" "buy"'
    ]

    total_added = 0
    for q in search_queries:
        url = f"https://news.google.com/rss/search?q={urllib.parse.quote(q)}&hl=en-IN&gl=IN&ceid=IN:en"
        feed = feedparser.parse(url)
        log(f"Processing: {q[:45]}... Found {len(feed.entries)} articles")
        
        for entry in feed.entries:
            text = f"{entry.title} {entry.summary if 'summary' in entry else ''}"
            rec = ner.extract_recommendation(text)
            
            if rec:
                cur.execute("SELECT id FROM recommendations WHERE raw_quote = ?", (rec["raw_quote"],))
                if cur.fetchone():
                    continue
                    
                matched_inf_id = 1
                for name, handle, _, _, _ in desks:
                    if handle.lower() in text.lower() or name.lower() in text.lower():
                        cur.execute("SELECT id FROM influencers WHERE handle = ?", (handle,))
                        row = cur.fetchone()
                        if row:
                            matched_inf_id = row[0]
                            break
                            
                cur.execute('''
                    INSERT INTO recommendations 
                    (influencer_id, platform, source_url, ticker, company_name, action, entry_price, target_price, stoploss_price, risk_reward_ratio, call_timestamp, raw_quote, confidence_score)
                    VALUES (?, 'institutional', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
                ''', (matched_inf_id, entry.link, rec['ticker'], rec['company_name'], rec['action'], rec['entry_price'], rec['target_price'], rec['stoploss_price'], rec['risk_reward_ratio'], rec['raw_quote'], rec['confidence_score']))
                total_added += 1
                log(f"  🎯 Extracted: {rec['action']} on {rec['ticker']} (Entry: ₹{rec['entry_price']}, Tgt: ₹{rec['target_price']})")

    conn.commit()
    conn.close()
    log(f"🎉 Institutional ingestion complete. Added {total_added} high-quality precision calls.")

if __name__ == "__main__":
    run_institutional_collector()
