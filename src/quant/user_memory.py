"""
Customer Memory, Profile Tracking & Behavioral Intelligence Engine
Maintains persistent conversational & trading memory across sessions:
- Preferred asset classes & holding horizons (Swing, Intraday, Long-term)
- Risk tolerance & drawdown comfort levels
- Tracked tickers, watchlist bias & favorite influencers
- Automatic behavioral extraction from chat queries (LLM & Heuristic)
- Memory recall & dynamic injection into prompt contexts
"""

import os
import sqlite3
import json
import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(PROJECT_ROOT, "data", "marketprobe.db")

def _init_memory_tables():
    """Initializes customer memory and session interaction tables."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS customer_memory (
            user_id TEXT PRIMARY KEY,
            risk_profile TEXT DEFAULT 'Moderate / Balanced Growth',
            trading_style TEXT DEFAULT 'Swing Breakout & Quality Delivery',
            max_portfolio_loss_pct REAL DEFAULT 15.0,
            favorite_tickers TEXT DEFAULT '["TATAMOTORS", "RELIANCE", "TCS"]',
            favorite_creators TEXT DEFAULT '[]',
            frequently_asked_topics TEXT DEFAULT '["Swing Breakouts", "Tax Loss Harvesting", "MPT Frontier"]',
            capital_bracket TEXT DEFAULT '₹5L - ₹25L',
            total_interactions INTEGER DEFAULT 0,
            last_interaction_at TEXT,
            raw_memory_notes TEXT DEFAULT '[]'
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS conversational_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL
        );
    """)
    conn.commit()
    conn.close()

_init_memory_tables()

class CustomerMemoryEngine:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path

    def get_or_create_profile(self, user_id: str = "demo-user") -> Dict[str, Any]:
        """Retrieves or creates a persistent customer profile."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM customer_memory WHERE user_id = ?", (user_id,))
        row = cur.fetchone()
        if not row:
            now_iso = datetime.now(timezone.utc).isoformat()
            cur.execute("""
                INSERT INTO customer_memory (user_id, last_interaction_at)
                VALUES (?, ?)
            """, (user_id, now_iso))
            conn.commit()
            cur.execute("SELECT * FROM customer_memory WHERE user_id = ?", (user_id,))
            row = cur.fetchone()

        profile = dict(row)
        conn.close()

        # Parse JSON fields safely
        for k in ["favorite_tickers", "favorite_creators", "frequently_asked_topics", "raw_memory_notes"]:
            try:
                profile[k] = json.loads(profile.get(k) or "[]")
            except Exception:
                profile[k] = []
        return profile

    def update_profile_field(self, user_id: str, field: str, value: Any):
        """Updates a specific memory field for the customer."""
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        val_str = json.dumps(value) if isinstance(value, (list, dict)) else str(value)
        cur.execute(f"UPDATE customer_memory SET {field} = ? WHERE user_id = ?", (val_str, user_id))
        conn.commit()
        conn.close()

    def add_interaction(self, user_id: str, role: str, message: str):
        """Logs chat messages for conversational recall."""
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        now_iso = datetime.now(timezone.utc).isoformat()
        cur.execute("""
            INSERT INTO conversational_history (user_id, role, message, timestamp)
            VALUES (?, ?, ?, ?)
        """, (user_id, role, message, now_iso))
        cur.execute("""
            UPDATE customer_memory 
            SET total_interactions = total_interactions + 1, last_interaction_at = ?
            WHERE user_id = ?
        """, (now_iso, user_id))
        conn.commit()
        conn.close()

    def get_recent_history(self, user_id: str = "demo-user", limit: int = 5) -> List[Dict[str, str]]:
        """Fetches last N conversational turns for context injection."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("""
            SELECT role, message, timestamp FROM conversational_history
            WHERE user_id = ?
            ORDER BY id DESC LIMIT ?
        """, (user_id, limit))
        rows = cur.fetchall()
        conn.close()
        return [{"role": r["role"], "message": r["message"]} for r in reversed(rows)]

    def extract_and_learn_patterns(self, user_id: str, user_message: str):
        """
        Passive behavioral learning:
        Detects tickers, risk hints, capital sizing, and trading styles directly from user prompt.
        """
        profile = self.get_or_create_profile(user_id)
        msg_low = user_message.lower()

        # 1. Learn Ticker Preferences
        tickers_found = re.findall(r'\b(RELIANCE|TCS|INFY|TATAMOTORS|HDFCBANK|ICICIBANK|SBIN|ITC|WIPRO|LT|BAJFINANCE|TITAN)\b', user_message, re.IGNORECASE)
        if tickers_found:
            favs = set(profile.get("favorite_tickers", []))
            for t in tickers_found:
                favs.add(t.upper())
            self.update_profile_field(user_id, "favorite_tickers", list(favs)[:8])

        # 2. Learn Risk Profiles
        if any(w in msg_low for w in ["conservative", "capital preservation", "low risk", "safety"]):
            self.update_profile_field(user_id, "risk_profile", "Conservative Capital Preservation")
            self.update_profile_field(user_id, "max_portfolio_loss_pct", 8.0)
        elif any(w in msg_low for w in ["aggressive", "multibagger", "high risk", "options", "f&o"]):
            self.update_profile_field(user_id, "risk_profile", "Aggressive High-Alpha Compounding")
            self.update_profile_field(user_id, "max_portfolio_loss_pct", 25.0)
        elif any(w in msg_low for w in ["moderate", "swing", "balanced"]):
            self.update_profile_field(user_id, "risk_profile", "Moderate Swing & Growth")

        # 3. Learn Trading Style
        if any(w in msg_low for w in ["intraday", "scalp"]):
            self.update_profile_field(user_id, "trading_style", "Intraday & Momentum Scalping")
        elif any(w in msg_low for w in ["swing", "breakout"]):
            self.update_profile_field(user_id, "trading_style", "Swing Breakout & Pattern Continuation")
        elif any(w in msg_low for w in ["sip", "long term", "compounding", "holding"]):
            self.update_profile_field(user_id, "trading_style", "Long-Term Wealth Compounding")

        # 4. Append specific notes
        if any(w in msg_low for w in ["i prefer", "i usually", "my capital is", "my budget is"]):
            notes = profile.get("raw_memory_notes", [])
            notes.append(user_message.strip())
            self.update_profile_field(user_id, "raw_memory_notes", notes[-5:])

    def build_memory_prompt_context(self, user_id: str = "demo-user") -> str:
        """
        Builds institutional context string describing the customer's behavioral DNA.
        """
        profile = self.get_or_create_profile(user_id)
        fav_t = ", ".join(profile.get("favorite_tickers", [])) or "None logged yet"
        notes_str = "; ".join(profile.get("raw_memory_notes", [])) if profile.get("raw_memory_notes") else "No direct quotes recorded."
        
        return (
            f"CUSTOMER BEHAVIORAL PROFILE & MEMORY:\n"
            f"- User Risk Appetite: {profile.get('risk_profile')}\n"
            f"- Preferred Trading Style: {profile.get('trading_style')}\n"
            f"- Max Drawdown Tolerance: {profile.get('max_portfolio_loss_pct')}%\n"
            f"- Frequently Watched Tickers: {fav_t}\n"
            f"- Approximate Capital Bracket: {profile.get('capital_bracket')}\n"
            f"- Total Interactions: {profile.get('total_interactions')}\n"
            f"- Customer Quotes & Preferences: {notes_str}\n"
            f"Instruction: Tailor all risk warnings, position sizing recommendations, and stock assessments to fit this specific customer's risk profile and favorite assets."
        )

_customer_memory_singleton = None
def get_customer_memory() -> CustomerMemoryEngine:
    global _customer_memory_singleton
    if _customer_memory_singleton is None:
        _customer_memory_singleton = CustomerMemoryEngine()
    return _customer_memory_singleton
