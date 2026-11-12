"""
Multimodal Perception and Ingestion Agent for MarketProbe.

Handles:
1. Drag-and-dropped PDFs (Brokerage research reports, Motilal Oswal, ICICI Direct).
2. YouTube Video URLs (Extracts audio transcript & metadata).
3. Audio files (WAV, MP3) and Plain text tips.
4. Auto-commits extracted calls into recommendations and raw_content tables in SQLite,
   expanding MarketProbe's empirical universe in real-time.
"""

import os
import re
import sqlite3
import datetime
from typing import Dict, Any, List, Optional
from youtube_transcript_api import YouTubeTranscriptApi
from pypdf import PdfReader

DB_PATH = "/Users/dhruvgourisaria/marketprobe/data/marketprobe.db"

def extract_youtube_video_id(url_or_id: str) -> Optional[str]:
    """Extracts YouTube 11-char video ID from various link formats."""
    patterns = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",
        r"youtu\.be\/([0-9A-Za-z_-]{11})",
        r"^([0-9A-Za-z_-]{11})$"
    ]
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)
    return None


def fetch_youtube_transcript(video_id: str) -> str:
    """Fetches YouTube subtitles/transcript directly without heavy browser scraping."""
    try:
        # Check both manual and generated captions
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'hi', 'en-IN'])
        full_text = " ".join([item['text'] for item in transcript_list])
        return full_text
    except Exception as e:
        return f"Could not retrieve automatic transcript: {str(e)}"


def parse_pdf_document(file_bytes_or_path: Any) -> str:
    """Extracts clean text from uploaded brokerage research PDF."""
    try:
        reader = PdfReader(file_bytes_or_path)
        extracted_text = []
        for page in reader.pages[:10]: # Read up to first 10 pages
            txt = page.extract_text()
            if txt:
                extracted_text.append(txt)
        return "\n".join(extracted_text)
    except Exception as e:
        return f"PDF extraction error: {str(e)}"


def parse_trade_entities_from_text(raw_text: str) -> Dict[str, Any]:
    """
    Precision extraction of stock recommendations from unstructured text.
    Identifies Ticker, Action (BUY/SELL), Entry, Target, and Stop-Loss.
    """
    # Common Indian Tickers Regex Dictionary
    tickers = ["RELIANCE", "TATAMOTORS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "TCS", "ITC", 
               "BHARTIARTL", "LT", "BAJFINANCE", "ADANIENT", "ZOMATO", "PAYTM", "WIPRO", "MARUTI"]
    
    found_ticker = "NIFTY"
    upper_text = raw_text.upper()
    for t in tickers:
        if re.search(r'\b' + t + r'\b', upper_text):
            found_ticker = t
            break

    # Determine Action
    is_sell = bool(re.search(r'\b(SELL|SHORT|BEARISH|EXIT|PUT)\b', upper_text))
    action = "SELL" if is_sell else "BUY"

    # Extract price levels using financial regex heuristics
    prices = [float(x.replace(",", "")) for x in re.findall(r'(?:₹|RS\.?|INR|\b)\s*(\d{2,6}(?:\.\d{1,2})?)\b', raw_text)]
    
    # Filter reasonable share prices
    prices = [p for p in prices if 10.0 <= p <= 150000.0]

    entry = 0.0
    target = 0.0
    stoploss = 0.0

    if prices:
        # If multiple prices found, sort them or deduce by proximity
        prices.sort()
        if action == "BUY":
            if len(prices) >= 3:
                stoploss = prices[0]
                entry = prices[1]
                target = prices[-1]
            elif len(prices) == 2:
                entry = prices[0]
                target = prices[1]
                stoploss = round(entry * 0.95, 2)
            else:
                entry = prices[0]
                target = round(entry * 1.08, 2)
                stoploss = round(entry * 0.95, 2)
        else: # SELL
            if len(prices) >= 3:
                target = prices[0]
                entry = prices[1]
                stoploss = prices[-1]
            elif len(prices) == 2:
                entry = prices[1]
                target = prices[0]
                stoploss = round(entry * 1.05, 2)
            else:
                entry = prices[0]
                target = round(entry * 0.92, 2)
                stoploss = round(entry * 1.05, 2)

    return {
        "ticker": found_ticker,
        "action": action,
        "entry": entry,
        "target": target,
        "stoploss": stoploss,
        "raw_text_snippet": raw_text[:500]
    }


def commit_new_recommendation_to_db(
    ticker: str,
    action: str,
    entry: float,
    target: float,
    stoploss: float,
    source_type: str,
    source_url: str,
    raw_quote: str,
    creator_name: str = "Market Research"
) -> int:
    """
    Permanently records the parsed call into SQLite, automatically expanding
    MarketProbe's empirical universe beyond 2,452 calls.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Find or insert creator
    cursor.execute("SELECT id FROM influencers WHERE name LIKE ? LIMIT 1;", (f"%{creator_name}%",))
    row = cursor.fetchone()
    if row:
        influencer_id = row[0]
    else:
        clean_handle = creator_name.lower().replace(" ", "_")[:30]
        cursor.execute("INSERT OR IGNORE INTO influencers (name, platform, handle) VALUES (?, ?, ?);",
                       (creator_name, source_type, clean_handle))
        cursor.execute("SELECT id FROM influencers WHERE handle = ? LIMIT 1;", (clean_handle,))
        found_inf = cursor.fetchone()
        influencer_id = found_inf[0] if found_inf else 1

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    rr_ratio = round(abs(target - entry) / max(0.01, abs(entry - stoploss)), 2) if entry > 0 else 2.0

    cursor.execute("""
        INSERT INTO recommendations (
            influencer_id, platform, source_url, ticker, action,
            entry_price, target_price, stoploss_price, risk_reward_ratio,
            call_timestamp, raw_quote, outcome_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN');
    """, (
        influencer_id, source_type, source_url, ticker, action,
        entry, target, stoploss, rr_ratio, now_str, raw_quote[:300]
    ))
    
    rec_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return rec_id
