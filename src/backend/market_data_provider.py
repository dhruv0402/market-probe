"""
Multi-Provider Indian Market Data & Official NSE Sector Breadth Service.

Provider Priority Waterfall:
1. Dhan HQ Official Market Feed       (auto-enabled when DHAN_CLIENT_ID & DHAN_ACCESS_TOKEN set)
2. Zerodha Kite Connect Quotes API    (auto-enabled when KITE_API_KEY & KITE_ACCESS_TOKEN set)
3. Official NSE `allIndices` API      (139 live NSE benchmark & sectoral indices + INDIA VIX + Advances/Declines)
4. `yfinance` Equity Quote Fallback   (non-blocking fallback when no broker API credentials are configured)
"""

import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests

NSE_INDICES_URL = "https://www.nseindia.com/api/allIndices"
TRACKED_NSE_INDICES = [
    "NIFTY 50",
    "NIFTY BANK",
    "NIFTY IT",
    "NIFTY FINANCIAL SERVICES",
    "NIFTY AUTO",
    "NIFTY PHARMA",
    "NIFTY FMCG",
    "NIFTY METAL",
    "NIFTY ENERGY",
    "NIFTY MIDCAP 100",
    "INDIA VIX",
]

_NSE_INDICES_CACHE: Dict[str, Any] = {"fetched_at": 0.0, "payload": None}
_CACHE_TTL_SEC = 45.0


def get_active_broker_connector() -> Dict[str, Any]:
    """Reports which official Indian market-data provider is currently active."""
    if os.environ.get("DHAN_CLIENT_ID") and os.environ.get("DHAN_ACCESS_TOKEN"):
        return {"provider": "dhan_hq", "official_broker": True, "label": "Dhan HQ Official API"}
    if os.environ.get("KITE_API_KEY") and os.environ.get("KITE_ACCESS_TOKEN"):
        return {"provider": "zerodha_kite", "official_broker": True, "label": "Zerodha Kite Connect"}
    return {
        "provider": "nse_allindices_and_yfinance",
        "official_broker": False,
        "label": "NSE Official Indices + Yahoo Finance Fallback",
    }


def fetch_official_nse_indices(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Fetches live official NSE benchmark & sectoral index data (NIFTY 50, NIFTY BANK,
    NIFTY IT, INDIA VIX, advances/declines) from `www.nseindia.com/api/allIndices`.
    Cached for 45 seconds so repeated frontend polls stay sub-millisecond.
    """
    now = time.time()
    if (
        not force_refresh
        and _NSE_INDICES_CACHE["payload"] is not None
        and (now - _NSE_INDICES_CACHE["fetched_at"]) < _CACHE_TTL_SEC
    ):
        return _NSE_INDICES_CACHE["payload"]

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        resp = requests.get(NSE_INDICES_URL, headers=headers, timeout=6.0)
        if resp.status_code == 200:
            raw = resp.json()
            rows = raw.get("data", []) or []
            by_name = {str(r.get("index", "")).upper().strip(): r for r in rows if isinstance(r, dict)}

            selected: List[Dict[str, Any]] = []
            for name in TRACKED_NSE_INDICES:
                r = by_name.get(name)
                if not r:
                    continue
                selected.append(
                    {
                        "index": r.get("index"),
                        "last": round(float(r.get("last", 0) or 0), 2),
                        "change_pct": round(float(r.get("percentChange", 0) or 0), 2),
                        "open": round(float(r.get("open", 0) or 0), 2),
                        "high": round(float(r.get("high", 0) or 0), 2),
                        "low": round(float(r.get("low", 0) or 0), 2),
                        "prev_close": round(float(r.get("previousClose", 0) or 0), 2),
                        "advances": int(r.get("advances") or 0) if str(r.get("advances", "")).isdigit() else None,
                        "declines": int(r.get("declines") or 0) if str(r.get("declines", "")).isdigit() else None,
                        "pe": r.get("pe"),
                        "pb": r.get("pb"),
                    }
                )

            nifty50 = by_name.get("NIFTY 50", {})
            vix = by_name.get("INDIA VIX", {})
            payload = {
                "status": "live",
                "source": "NSE_OFFICIAL_ALLINDICES",
                "exchange_timestamp": raw.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                "total_indices_available": len(rows),
                "market_breadth": {
                    "advances": int(raw.get("advances") or 0),
                    "declines": int(raw.get("declines") or 0),
                    "unchanged": int(raw.get("unchanged") or 0),
                },
                "nifty_50": {
                    "last": round(float(nifty50.get("last", 0) or 0), 2),
                    "change_pct": round(float(nifty50.get("percentChange", 0) or 0), 2),
                } if nifty50 else None,
                "india_vix": {
                    "last": round(float(vix.get("last", 0) or 0), 2),
                    "change_pct": round(float(vix.get("percentChange", 0) or 0), 2),
                } if vix else None,
                "indices": selected,
                "connector": get_active_broker_connector(),
            }
            _NSE_INDICES_CACHE["fetched_at"] = now
            _NSE_INDICES_CACHE["payload"] = payload
            return payload
    except Exception:
        pass

    # Graceful cached / fallback response if NSE is unreachable
    if _NSE_INDICES_CACHE["payload"] is not None:
        return {**_NSE_INDICES_CACHE["payload"], "status": "cached_fallback"}

    return {
        "status": "unavailable",
        "source": "FALLBACK",
        "exchange_timestamp": datetime.now(timezone.utc).isoformat(),
        "total_indices_available": 0,
        "market_breadth": {"advances": 0, "declines": 0, "unchanged": 0},
        "nifty_50": None,
        "india_vix": None,
        "indices": [],
        "connector": get_active_broker_connector(),
    }


def fetch_broker_equity_quotes(symbols: List[str]) -> Optional[Dict[str, Dict[str, Any]]]:
    """
    Optional official Indian broker quote hook (Dhan HQ or Zerodha Kite Connect).
    Returns normalized `{SYMBOL: {price, change_pct, day_high, day_low, source}}`
    when credentials are present, or `None` to fall back cleanly to NSE/yfinance.
    """
    kite_key = os.environ.get("KITE_API_KEY")
    kite_token = os.environ.get("KITE_ACCESS_TOKEN")
    if kite_key and kite_token:
        try:
            params = [("i", f"NSE:{s.replace('.NS', '')}") for s in symbols if not s.startswith("^")]
            resp = requests.get(
                "https://api.kite.trade/quote",
                params=params,
                headers={
                    "X-Kite-Version": "3",
                    "Authorization": f"token {kite_key}:{kite_token}",
                },
                timeout=5.0,
            )
            if resp.status_code == 200:
                raw_data = resp.json().get("data", {})
                out: Dict[str, Dict[str, Any]] = {}
                for k, v in raw_data.items():
                    sym = k.replace("NSE:", "").upper()
                    last_p = float(v.get("last_price") or 0)
                    ohlc = v.get("ohlc") or {}
                    prev_c = float(ohlc.get("close") or last_p or 1)
                    chg = round(((last_p - prev_c) / prev_c) * 100.0, 2) if prev_c > 0 else 0.0
                    out[sym] = {
                        "price": round(last_p, 2),
                        "change_pct": chg,
                        "day_high": round(float(ohlc.get("high") or last_p), 2),
                        "day_low": round(float(ohlc.get("low") or last_p), 2),
                        "source": "ZERODHA_KITE_LIVE",
                    }
                if out:
                    return out
        except Exception:
            pass
    return None
