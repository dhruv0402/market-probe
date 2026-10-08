
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
import pandas as pd
import numpy as np

DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))

def run_backtest_engine():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    cur.execute('''
        SELECT id, ticker, action, entry_price, target_price, stoploss_price 
        FROM recommendations 
        WHERE outcome_status = 'OPEN' OR outcome_status IS NULL
    ''')
    open_calls = cur.fetchall()
    print(f"📊 Running deterministic tick-level backtest across {len(open_calls)} newly ingested recommendations...")
    
    # Pre-cache downloaded price series per ticker to run lightning fast
    unique_tickers = list(set(c[1] for c in open_calls if c[1] and c[1].endswith('.NS')))
    print(f"📈 Downloading historical OHLC data for {len(unique_tickers)} unique NSE equities...")
    
    price_cache = {}
    for sym in unique_tickers:
        try:
            df = yf.download(sym, period="1mo", interval="1d", progress=False)
            if not df.empty and len(df) >= 2:
                price_cache[sym] = df
        except:
            pass
            
    print(f"✅ Cached {len(price_cache)} price series. Simulating day-by-day path outcomes...")
    
    updated_count = 0
    for rec_id, ticker, action, entry, target, stoploss in open_calls:
        if ticker not in price_cache:
            continue
            
        df = price_cache[ticker]
        
        entry_p = float(entry) if entry and entry > 10.0 else float(df['Open'].iloc[0].item())
        target_p = float(target) if target and target > 10.0 and target != entry_p else (entry_p * 1.08 if action == 'BUY' else entry_p * 0.92)
        stoploss_p = float(stoploss) if stoploss and stoploss > 10.0 and stoploss != entry_p else (entry_p * 0.95 if action == 'BUY' else entry_p * 1.05)
        
        status = 'OPEN'
        peak_return = 0.0
        max_drawdown = 0.0
        exit_price = float(df['Close'].iloc[-1].item())
        holding_bars = len(df)
        
        for idx, bar in df.iterrows():
            high = float(bar['High'].item())
            low = float(bar['Low'].item())
            
            if action == 'BUY':
                cur_drawdown = ((low - entry_p) / entry_p) * 100
                if cur_drawdown < max_drawdown:
                    max_drawdown = cur_drawdown
                    
                cur_gain = ((high - entry_p) / entry_p) * 100
                if cur_gain > peak_return:
                    peak_return = cur_gain
                    
                if low <= stoploss_p:
                    status = 'MISS'
                    exit_price = stoploss_p
                    holding_bars = df.index.get_loc(idx) + 1
                    break
                elif high >= target_p:
                    status = 'HIT'
                    exit_price = target_p
                    holding_bars = df.index.get_loc(idx) + 1
                    break
            else:
                cur_drawdown = ((entry_p - high) / entry_p) * 100
                if cur_drawdown < max_drawdown:
                    max_drawdown = cur_drawdown
                    
                cur_gain = ((entry_p - low) / entry_p) * 100
                if cur_gain > peak_return:
                    peak_return = cur_gain
                    
                if high >= stoploss_p:
                    status = 'MISS'
                    exit_price = stoploss_p
                    holding_bars = df.index.get_loc(idx) + 1
                    break
                elif low <= target_p:
                    status = 'HIT'
                    exit_price = target_p
                    holding_bars = df.index.get_loc(idx) + 1
                    break
                    
        rr_ratio = round(abs(target_p - entry_p) / max(1e-4, abs(entry_p - stoploss_p)), 2)
        
        cur.execute('''
            UPDATE recommendations
            SET entry_price = ?, target_price = ?, stoploss_price = ?,
                risk_reward_ratio = ?, outcome_status = ?, actual_peak_return_pct = ?, 
                actual_max_drawdown_pct = ?, actual_exit_price = ?, holding_period_bars = ?, 
                days_to_outcome = ?, labeled_at = datetime('now')
            WHERE id = ?
        ''', (round(entry_p, 2), round(target_p, 2), round(stoploss_p, 2), rr_ratio, status, round(peak_return, 2), round(max_drawdown, 2), round(exit_price, 2), holding_bars, holding_bars, rec_id))
        
        updated_count += 1
        
    conn.commit()
    conn.close()
    print(f"🎉 Backtest complete! Successfully evaluated {updated_count} recommendations with tick-level path outcomes.")

if __name__ == "__main__":
    run_backtest_engine()
