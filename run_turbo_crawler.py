
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
import re
import time
import io
import requests
import pandas as pd
from rapidfuzz import process, fuzz
import yfinance as yf
from youtube_transcript_api import YouTubeTranscriptApi

DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))
LOG_PATH = os.path.join(PROJECT_ROOT, "overnight.log")

def log(msg):
    t = time.strftime("[%Y-%m-%d %H:%M:%S]")
    line = f"{t} {msg}"
    print(line)
    with open(LOG_PATH, "a") as f:
        f.write(line + "\n")

def get_requests_session():
    s = requests.Session()
    proxy = os.environ.get("PROXY_URL") or os.environ.get("HTTPS_PROXY") or os.environ.get("HTTP_PROXY")
    if proxy:
        s.proxies = {"http": proxy, "https": proxy}
    s.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    })
    return s

def run_turbo_loop():
    log("🔥 TURBO INGESTION & TRAINING ENGINE STARTED (Target: Max Scale by 7:00 AM IST)")
    proxy = os.environ.get("PROXY_URL") or os.environ.get("HTTPS_PROXY")
    proxies = {"http": proxy, "https": proxy} if proxy else None
    
    # 50 High-Volume Search Themes to scrape maximum recommendations
    search_themes = [
        "top breakout stocks to buy this week target stoploss",
        "multibagger stocks for 2026 buy now",
        "swing trading stock recommendations for tomorrow",
        "nifty bank nifty best shares to buy",
        "top dividend growth stocks India buy",
        "penny stocks high return buy sell",
        "best smallcap midcap stocks to buy now",
        "F&O stock calls for tomorrow target stoploss",
        "SEBI registered stock recommendations",
        "stocks hitting 52 week high buy or sell",
        "defence railway solar stocks to buy",
        "IT banking auto shares analysis buy target",
        "short term trading stocks with target",
        "high momentum breakout stocks for tomorrow",
        "undervalued shares to buy in stock market"
    ]
    
    sponsor_terms = ['sponsored', 'partner', 'collab', 'paid promotion', 'download link', 'use code', 'referral', 'promoted', 'exclusive bonus', 'telegram channel link', 'join our premium', 'demat account open']

    while True:
        try:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            
            # 1. Ingest from Search Themes with Exponential Backoff
            for theme in search_themes:
                log(f"Searching Theme: {theme}...")
                backoff_delay = 2.0
                try:
                    url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(theme)}"
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
                    
                    try:
                        html = urllib.request.urlopen(req, timeout=12).read().decode('utf-8')
                    except urllib.error.HTTPError as http_err:
                        if http_err.code in [429, 403]:
                            log(f"⚠️ Rate limited (HTTP {http_err.code}) on theme '{theme}'. Backing off {backoff_delay * 2:.1f}s...")
                            time.sleep(backoff_delay * 2)
                        continue

                    vids = list(set(re.findall(r'watch\?v=([a-zA-Z0-9_-]{11})', html)))
                    
                    for vid in vids[:10]:
                        cur.execute("SELECT id FROM raw_content WHERE video_or_post_id = ?", (vid,))
                        if cur.fetchone():
                            continue
                            
                        try:
                            res = api.fetch(vid, languages=['hi', 'en', 'en-IN', 'hi-Latn'])
                            text = ' '.join([s.text for s in res.snippets if s.text])
                            if len(text.split()) < 30:
                                continue
                                
                            has_sponsor = any(term in text.lower() for term in sponsor_terms)
                            found_terms = [t for t in sponsor_terms if t in text.lower()]
                            
                            cur.execute('''
                                INSERT OR REPLACE INTO raw_content 
                                (influencer_id, platform, video_or_post_id, title, raw_transcript, has_sponsor_flag, sponsor_keywords, url)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            ''', (1, 'youtube', vid, f"Market Analysis {vid}", text, 1 if has_sponsor else 0, ', '.join(found_terms), f"https://youtube.com/watch?v={vid}"))
                            conn.commit()
                            log(f"  ✅ Ingested Transcript: {vid} ({len(text.split())} words)")
                            time.sleep(1.5) # Anti-ban rate pacing
                        except Exception as t_err:
                            # Transient transcript fetch issue
                            time.sleep(0.5)
                    time.sleep(2.0)
                except Exception as e:
                    log(f"Search error on {theme}: {e}")
                    time.sleep(3.0)

            # 2. Extract structured recommendations
            log("Running Batch NLP Extractor...")
            cur.execute("SELECT symbol, company_name FROM nse_equities")
            equities = cur.fetchall()
            
            equity_dict = {sym.upper(): (sym, cname) for sym, cname in equities}
            for sym, cname in equities:
                equity_dict[cname.upper()] = (sym, cname)
            choices = list(equity_dict.keys())

            STOP_SYMBOLS = {'IT', 'BE', 'ALL', 'AT', 'CAN', 'FOR', 'NEW', 'NOW', 'SET', 'TOP', 'YES', 'SEE', 'KEY', 'ON', 'GO', 'SO', 'BY', 'RUN', 'OUT', 'HIGH', 'LOW', 'MID'}
            buy_kw = ['buy', 'khareedo', 'kharid', 'accumulate', 'long', 'bullish', 'entry', 'breakout', 'target', 'levels']
            sell_kw = ['sell', 'becho', 'short', 'exit', 'bearish', 'stop loss', 'cut loss']

            cur.execute("SELECT id, influencer_id, raw_transcript, has_sponsor_flag FROM raw_content")
            transcripts = cur.fetchall()

            for row_id, inf_id, text, is_sponsored in transcripts:
                sentences = re.split(r'[.!?\n]+', text)
                for s in sentences:
                    s_clean = s.strip()
                    if len(s_clean) < 15:
                        continue
                    words = re.findall(r'\b[A-Z0-9a-z]{3,15}\b', s_clean)
                    for w in words:
                        w_u = w.upper()
                        if w_u in STOP_SYMBOLS:
                            continue
                        matched_sym = None
                        company = None
                        if w_u in equity_dict:
                            matched_sym, company = equity_dict[w_u]
                        elif len(w) >= 5:
                            m = process.extractOne(w_u, choices, scorer=fuzz.ratio, score_cutoff=92)
                            if m:
                                matched_sym, company = equity_dict[m[0]]
                                
                        if matched_sym and matched_sym not in STOP_SYMBOLS:
                            s_low = s_clean.lower()
                            is_b = any(b in s_low for b in buy_kw)
                            is_s = any(sl in s_low for sl in sell_kw)
                            if is_b or is_s:
                                action = 'BUY' if is_b else 'SELL'
                                nums = [float(n) for n in re.findall(r'\b\d{2,5}(?:\.\d{1,2})?\b', s_clean) if 10 <= float(n) <= 50000]
                                entry_p = nums[0] if len(nums) >= 1 else None
                                tgt_p = nums[1] if len(nums) >= 2 else (entry_p * 1.08 if entry_p and action == 'BUY' else None)
                                sl_p = nums[2] if len(nums) >= 3 else (entry_p * 0.95 if entry_p and action == 'BUY' else None)
                                
                                cur.execute('''
                                    INSERT OR IGNORE INTO recommendations 
                                    (content_id, influencer_id, ticker, company_name, action, entry_price, target_price, stoploss_price, raw_quote, confidence_score, is_sponsored_flag)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                ''', (row_id, inf_id, f'{matched_sym}.NS', company, action, entry_p, tgt_p, sl_p, s_clean[:250], 0.85, is_sponsored))
                                break
            conn.commit()

            # 3. Calculate P&L from live price data
            log("Calculating real P&L outcomes...")
            cur.execute("SELECT id, ticker, action, entry_price, target_price, stoploss_price FROM recommendations WHERE outcome_status = 'OPEN'")
            open_recs = cur.fetchall()
            for r_id, ticker, action, entry_p, tgt_p, sl_p in open_recs:
                try:
                    df = yf.download(ticker, period='1mo', interval='1d', progress=False)
                    if df.empty:
                        continue
                    curr_c = float(df['Close'].iloc[-1].item())
                    base_e = entry_p if (entry_p and entry_p > 0) else float(df['Open'].iloc[0].item())
                    peak_h = float(df['High'].max().item())
                    tr_l = float(df['Low'].min().item())
                    t_val = tgt_p if tgt_p else base_e * 1.05
                    sl_val = sl_p if sl_p else base_e * 0.95
                    
                    # Chronological day-by-day path evaluation
                    status = 'OPEN'
                    ret = ((curr_c - base_e) / base_e) * 100 if action == 'BUY' else ((base_e - curr_c) / base_e) * 100
                    exit_price = curr_c
                    days_taken = len(df)

                    for day_idx, (_, row) in enumerate(df.iterrows()):
                        bar_high = float(row['High'].item() if hasattr(row['High'], 'item') else row['High'])
                        bar_low = float(row['Low'].item() if hasattr(row['Low'], 'item') else row['Low'])

                        if action == 'BUY':
                            # Stop loss breach takes priority if both are hit on same day, or check sequence
                            if bar_low <= sl_val:
                                status = 'MISS'
                                exit_price = sl_val
                                ret = ((sl_val - base_e) / base_e) * 100
                                days_taken = day_idx + 1
                                break
                            elif bar_high >= t_val:
                                status = 'HIT'
                                exit_price = t_val
                                ret = ((t_val - base_e) / base_e) * 100
                                days_taken = day_idx + 1
                                break
                        else: # SELL
                            if bar_high >= sl_val:
                                status = 'MISS'
                                exit_price = sl_val
                                ret = ((base_e - sl_val) / base_e) * 100
                                days_taken = day_idx + 1
                                break
                            elif bar_low <= t_val:
                                status = 'HIT'
                                exit_price = t_val
                                ret = ((base_e - t_val) / base_e) * 100
                                days_taken = day_idx + 1
                                break
                    cur.execute('''
                        UPDATE recommendations 
                        SET entry_price = ?, target_price = ?, stoploss_price = ?, 
                            outcome_status = ?, actual_peak_return_pct = ?, actual_exit_price = ?, days_to_outcome = 14, labeled_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ''', (round(base_e, 2), round(t_val, 2), round(sl_val, 2), status, round(ret, 2), round(curr_c, 2), r_id))
                except Exception:
                    pass
            conn.commit()

            cur.execute("SELECT COUNT(*) FROM raw_content")
            t_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM recommendations")
            r_count = cur.fetchone()[0]
            log(f"📊 MILESTONE: {t_count} Transcripts Ingested | {r_count} Total Recommendations Labeled")
            
            conn.close()
            time.sleep(30) # Continuous rapid cycling
        except Exception as err:
            log(f"Global loop error: {err}")
            time.sleep(30)

if __name__ == "__main__":
    run_turbo_loop()
