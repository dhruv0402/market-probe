
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
import requests
import json
import urllib.parse
from datetime import datetime, timedelta
import yfinance as yf
from rapidfuzz import process, fuzz
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

class MultiPlatformCollector:
    def __init__(self):
        self.ner = PrecisionFinancialNER()
        
    def get_db(self):
        return sqlite3.connect(DB_PATH)

    def scrape_fintwit_calls(self):
        """
        Scrape formatted stock calls from Twitter/X financial analysts via targeted Google News RSS queries
        """
        log("🐦 INGESTING FIN-TWIT & TRADING CALLS...")
        queries = [
            'site:twitter.com "BUY" "TGT" "SL" "NSE"',
            'site:twitter.com "CMP" "Target" "Stoploss" "Nifty"',
            'site:twitter.com "Breakout" "Buy at" "SL" "Nifty50"',
            'site:twitter.com "Swing trade" "Target" "Stop loss" stock',
            'site:twitter.com "SEBI RA" "BUY" "TGT"'
        ]
        
        conn = self.get_db()
        cur = conn.cursor()
        total_extracted = 0

        for q in queries:
            url = f"https://news.google.com/rss/search?q={urllib.parse.quote(q)}&hl=en-IN&gl=IN&ceid=IN:en"
            feed = feedparser.parse(url)
            
            for entry in feed.entries:
                text = f"{entry.title} {entry.summary if 'summary' in entry else ''}"
                rec = self.ner.extract_recommendation(text)
                
                if rec:
                    # Check if already present
                    cur.execute("SELECT id FROM recommendations WHERE raw_quote = ?", (rec["raw_quote"],))
                    if cur.fetchone():
                        continue
                        
                    # Find or associate influencer
                    influencer_name = "FinTwit Technical Desk"
                    if "@" in entry.title:
                        handle_match = re.search(r'(@[A-Za-z0-9_]+)', entry.title)
                        if handle_match:
                            influencer_name = handle_match.group(1)
                            
                    cur.execute('''
                        INSERT OR IGNORE INTO influencers (name, platform, handle, approx_subscribers, is_sebi_registered)
                        VALUES (?, 'twitter', ?, 50000, 1)
                    ''', (influencer_name, influencer_name))
                    
                    cur.execute("SELECT id FROM influencers WHERE handle = ?", (influencer_name,))
                    inf_id = cur.fetchone()[0]
                    
                    # Store raw content & recommendation
                    cur.execute('''
                        INSERT INTO recommendations 
                        (influencer_id, platform, source_url, ticker, company_name, action, entry_price, target_price, stoploss_price, risk_reward_ratio, call_timestamp, raw_quote, confidence_score)
                        VALUES (?, 'twitter', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
                    ''', (inf_id, entry.link, rec['ticker'], rec['company_name'], rec['action'], rec['entry_price'], rec['target_price'], rec['stoploss_price'], rec['risk_reward_ratio'], rec['raw_quote'], rec['confidence_score']))
                    
                    total_extracted += 1
                    log(f"  [X/TWITTER] Extracted {rec['action']} on {rec['ticker']} (Entry: ₹{rec['entry_price']}, Tgt: ₹{rec['target_price']}, SL: ₹{rec['stoploss_price']})")
        
        conn.commit()
        conn.close()
        log(f"✅ Extracted {total_extracted} precision FinTwit calls.")

    def scrape_sebi_ra_broadcasts(self):
        """
        Ingest structured research recommendations from certified SEBI RAs and institutional desks
        """
        log("📢 INGESTING SEBI RA & INSTITUTIONAL BROKERAGE DESKS...")
        analysts = [
            ("Motilal Oswal Financial Services", "MOTILAL", 1200000, 1, "INZ000158836"),
            ("HDFC Securities Institutional Desk", "HDFCLTD", 1500000, 1, "INZ000186937"),
            ("ICICI Direct Research", "ICICIDIRECT", 2100000, 1, "INZ000183631"),
            ("Kotak Securities Research", "KOTAKSEC", 1800000, 1, "INZ000200137"),
            ("Kunal Saraogi (Equityrush)", "KunalSaraogi", 1180000, 1, "INH000000277"),
            ("Dr. Rakesh Bansal (RakeshBansalVentures)", "DrRakeshBansal", 510000, 1, "INH000008432"),
            ("Nooresh Merani (AnalyzeIndia)", "NooreshMerani", 180000, 1, "INH000001234")
        ]
        
        conn = self.get_db()
        cur = conn.cursor()
        
        for name, handle, subs, is_sebi, sebi_no in analysts:
            cur.execute('''
                INSERT OR REPLACE INTO influencers (name, platform, handle, approx_subscribers, is_sebi_registered, sebi_reg_no)
                VALUES (?, 'institutional', ?, ?, ?, ?)
            ''', (name, handle, subs, is_sebi, sebi_no))
            
            # Query official reports & calls
            q = f'"{name}" "Buy" OR "Target" stock price NSE'
            url = f"https://news.google.com/rss/search?q={urllib.parse.quote(q)}&hl=en-IN&gl=IN&ceid=IN:en"
            feed = feedparser.parse(url)
            
            cur.execute("SELECT id FROM influencers WHERE handle = ?", (handle,))
            inf_id = cur.fetchone()[0]
            
            for entry in feed.entries:
                text = f"{entry.title} {entry.summary if 'summary' in entry else ''}"
                rec = self.ner.extract_recommendation(text)
                if rec:
                    cur.execute("SELECT id FROM recommendations WHERE raw_quote = ?", (rec["raw_quote"],))
                    if cur.fetchone():
                        continue
                    cur.execute('''
                        INSERT INTO recommendations 
                        (influencer_id, platform, source_url, ticker, company_name, action, entry_price, target_price, stoploss_price, risk_reward_ratio, call_timestamp, raw_quote, confidence_score)
                        VALUES (?, 'institutional', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
                    ''', (inf_id, entry.link, rec['ticker'], rec['company_name'], rec['action'], rec['entry_price'], rec['target_price'], rec['stoploss_price'], rec['risk_reward_ratio'], rec['raw_quote'], rec['confidence_score']))
                    log(f"  [SEBI RA] {name}: {rec['action']} on {rec['ticker']} @ ₹{rec['entry_price']} (Tgt: ₹{rec['target_price']})")
                    
        conn.commit()
        conn.close()

if __name__ == "__main__":
    collector = MultiPlatformCollector()
    collector.scrape_fintwit_calls()
    collector.scrape_sebi_ra_broadcasts()
