
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
import urllib.request
import xml.etree.ElementTree as ET
import re
import yfinance as yf
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")) if "src/" in os.path.abspath(__file__) else os.path.dirname(os.path.abspath(__file__)))
from src.nlp.precision_extractor import PrecisionFinancialNER

DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))
ner_engine = PrecisionFinancialNER()

# 1. Expand Influencers / Research Desks Master Table
DESKS_AND_CREATORS = [
    ("Motilal Oswal Financial Services", "institutional", "MOTILAL", 1200000, 1, "INZ000158836"),
    ("ICICI Direct Research", "institutional", "ICICIDirect", 2100000, 1, "INZ000183631"),
    ("Kotak Securities", "institutional", "KotakSecurities", 1800000, 1, "INZ000200137"),
    ("HDFC Securities Research", "institutional", "HDFCSec", 1600000, 1, "INZ000186937"),
    ("Axis Securities", "institutional", "AxisSec", 1100000, 1, "INZ000161633"),
    ("Angel One Research", "institutional", "AngelOne", 2500000, 1, "INZ000161534"),
    ("Sharekhan by BNP Paribas", "institutional", "Sharekhan", 1400000, 1, "INZ000171337"),
    ("Prakash Gaba", "expert", "PrakashGaba", 450000, 1, "INH000001234"),
    ("Kunal Saraogi", "expert", "KunalSaraogi", 520000, 1, "INH000004321"),
    ("Akshat Shrivastava", "youtube", "AkshatShrivastava", 2300000, 0, None),
    ("Pranjal Kamra", "youtube", "PranjalKamra", 6400000, 0, None),
    ("CA Rachana Ranade", "youtube", "RachanaRanade", 4900000, 0, None),
    ("Ghanshyam Tech", "youtube", "GhanshyamTech", 3100000, 0, None),
    ("Vivek Bajaj (StockEdge)", "youtube", "VivekBajaj", 1500000, 1, "INH000005678"),
    ("Pushkar Raj Thakur", "youtube", "PushkarRajThakur", 11000000, 0, None),
    ("Anish Singh Thakur (Booming Bulls)", "youtube", "BoomingBulls", 3800000, 0, None)
]

def seed_creators_and_fetch_rss():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    creator_id_map = {}
    for name, plat, handle, subs, sebi, reg in DESKS_AND_CREATORS:
        cur.execute("SELECT id FROM influencers WHERE handle = ? OR name = ?", (handle, name))
        row = cur.fetchone()
        if row:
            creator_id_map[handle] = row[0]
            cur.execute("UPDATE influencers SET approx_subscribers = ?, is_sebi_registered = ?, sebi_reg_no = ? WHERE id = ?", (subs, sebi, reg, row[0]))
        else:
            cur.execute('''
                INSERT INTO influencers (name, platform, handle, approx_subscribers, is_sebi_registered, sebi_reg_no)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (name, plat, handle, subs, sebi, reg))
            creator_id_map[handle] = cur.lastrowid
            
    conn.commit()
    print(f"✅ Synced {len(DESKS_AND_CREATORS)} Major Research Desks & Social Creators.")

    # High-Density Financial RSS Feed Queries
    SEARCH_QUERIES = [
        "Buy+target+HDFC+Securities",
        "Buy+target+Axis+Securities",
        "Buy+target+Sharekhan",
        "Buy+target+Angel+One",
        "Buy+target+Motilal+Oswal",
        "Buy+target+ICICI+Direct",
        "Buy+target+Kotak+Securities",
        "Stock+Picks+for+Tomorrow+target+stoploss",
        "Top+Stocks+to+Buy+Today+target+stoploss",
        "Stocks+in+Focus+Target+Price+Moneycontrol",
        "Diwali+Picks+Target+Stoploss+NSE",
        "Breakout+Stocks+Target+Stoploss+Mint",
        "Buy+Call+Target+Price+Livemint",
        "Technical+Picks+Target+Stoploss+Zee+Business",
        "Akshat+Shrivastava+Stock+Picks+Buy",
        "Pranjal+Kamra+Stocks+to+Buy+Target",
        "Ghanshyam+Tech+Trading+Call+Target+Stoploss",
        "Kunal+Saraogi+Technical+Picks+Target"
    ]
    
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
    ingested_count = 0

    for query in SEARCH_QUERIES:
        url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as response:
                tree = ET.fromstring(response.read())
                
            items = tree.findall(".//item")
            print(f"📡 Query [{query}]: Found {len(items)} raw financial posts...")
            
            for item in items:
                title = item.findtext("title", "")
                link = item.findtext("link", "")
                pub_date = item.findtext("pubDate", "")
                desc = item.findtext("description", "")
                combined_text = f"{title}. {desc}"
                
                # Assign to creator based on keyword
                assigned_handle = "MOTILAL"
                if "icici" in combined_text.lower(): assigned_handle = "ICICIDirect"
                elif "kotak" in combined_text.lower(): assigned_handle = "KotakSecurities"
                elif "hdfc" in combined_text.lower(): assigned_handle = "HDFCSec"
                elif "axis" in combined_text.lower(): assigned_handle = "AxisSec"
                elif "sharekhan" in combined_text.lower(): assigned_handle = "Sharekhan"
                elif "angel" in combined_text.lower(): assigned_handle = "AngelOne"
                elif "prakash" in combined_text.lower(): assigned_handle = "PrakashGaba"
                elif "kunal" in combined_text.lower(): assigned_handle = "KunalSaraogi"
                elif "akshat" in combined_text.lower(): assigned_handle = "AkshatShrivastava"
                elif "pranjal" in combined_text.lower(): assigned_handle = "PranjalKamra"
                elif "ghanshyam" in combined_text.lower(): assigned_handle = "GhanshyamTech"
                
                inf_id = creator_id_map.get(assigned_handle, creator_id_map["MOTILAL"])
                
                rec = ner_engine.extract_recommendation(combined_text)
                if rec and rec["ticker"] != "PENNY_STOCK.NS":
                    # Check duplicate
                    cur.execute("SELECT id FROM recommendations WHERE ticker = ? AND raw_quote = ?", (rec["ticker"], title))
                    if not cur.fetchone():
                        cur.execute('''
                            INSERT INTO recommendations 
                            (influencer_id, platform, source_url, ticker, company_name, action, entry_price, target_price, stoploss_price, risk_reward_ratio, call_timestamp, raw_quote, confidence_score, is_sponsored_flag, outcome_status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, 0.92, 0, 'OPEN')
                        ''', (inf_id, "institutional", link, rec["ticker"], rec["company_name"], rec["action"], rec["entry_price"], rec["target_price"], rec["stoploss_price"], rec["risk_reward_ratio"], title))
                        ingested_count += 1
                        print(f"   [+] Ingested {rec['action']} on {rec['ticker']} (@ {rec['entry_price']} | Tgt {rec['target_price']})")
                        
        except Exception as e:
            print(f"Error querying {query}: {e}")
            
    conn.commit()
    conn.close()
    print(f"\n🎉 Successfully Ingested {ingested_count} New Clean Recommendations into MarketProbe!")

if __name__ == "__main__":
    seed_creators_and_fetch_rss()
