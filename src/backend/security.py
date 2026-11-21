"""
MarketProbe Enterprise Security, Database-Backed Auth, JWT Session Revocation & RBAC Subsystem.

Implements:
- Real SQLite / PostgreSQL `users` & `user_sessions` persistence (zero fake in-memory bypasses)
- PBKDF2-HMAC-SHA256 password hashing (120,000 iterations + 16-byte cryptographic salt)
- HS256 JWT access tokens with per-session `jti` persisted in `user_sessions` for true logout revocation
- Database-verified `X-API-KEY` and Bearer JWT authentication (`require_auth`)
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any, Dict, Optional

from fastapi import HTTPException, Request, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.backend.db_adapter import get_app_db_connection

SECRET_KEY = os.environ.get("MARKETPROBE_SECRET_KEY", "marketprobe-local-dev-secret-change-in-prod")
IS_PRODUCTION = os.environ.get("ENV", "").lower() == "production" or os.environ.get("RENDER", "").lower() == "true"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 86400 * 7  # 7 days
PBKDF2_ITERATIONS = 120_000

security_bearer = HTTPBearer(auto_error=False)

# Dual-Engine User Persistence Setup (PostgreSQL via DATABASE_URL in prod, SQLite locally)
DB_PATH = os.environ.get(
    "MARKETPROBE_DB_PATH",
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "marketprobe.db"),
)

# Kept strictly as empty dict for backwards symbol import compatibility — NEVER used for auth bypass
USER_DB: Dict[str, Dict[str, Any]] = {}


def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = base64.b64encode(secrets.token_bytes(16)).decode("utf-8")
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    )
    return f"pbkdf2$sha256${PBKDF2_ITERATIONS}${salt}${base64.b64encode(key).decode('utf-8')}"


def verify_password(plain_password: str, hashed: str) -> bool:
    try:
        parts = str(hashed or "").split("$")
        if len(parts) != 5 or parts[0] != "pbkdf2":
            return False
        iterations = int(parts[2])
        salt = parts[3]
        expected_key = parts[4]
        key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        )
        return hmac.compare_digest(base64.b64encode(key).decode("utf-8"), expected_key)
    except Exception:
        return False


def init_user_db() -> None:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'pro_trader',
                tier TEXT DEFAULT 'free',
                provider TEXT DEFAULT 'email',
                api_key TEXT,
                last_login_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        # Ensure last_login_at column exists on migrated SQLite databases
        if conn.backend == "sqlite":
            cols = {r["name"] for r in cur.execute("PRAGMA table_info(users)").fetchall()}
            if "last_login_at" not in cols:
                cur.execute("ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP")

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                jti TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at INTEGER NOT NULL,
                revoked INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_uid ON user_sessions(user_id);")

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS user_watchlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                notes TEXT,
                alert_above REAL,
                alert_below REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, symbol)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS saved_calls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                call_id TEXT NOT NULL,
                saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, call_id)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS subscriptions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                gateway TEXT NOT NULL,
                tier TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                order_id TEXT,
                payment_id TEXT,
                amount REAL,
                currency TEXT DEFAULT 'INR',
                valid_until TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS user_alert_configs (
                user_id TEXT PRIMARY KEY,
                telegram_chat_id TEXT,
                whatsapp_phone TEXT,
                telegram_enabled INTEGER DEFAULT 0,
                whatsapp_enabled INTEGER DEFAULT 0,
                min_conviction REAL DEFAULT 60.0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[SECURITY] Warning initializing user tables: {e}")


init_user_db()


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
        row = cur.fetchone()
        conn.close()
        if row:
            return dict(row)
    except Exception:
        pass
    return None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        conn.close()
        if row:
            return dict(row)
    except Exception:
        pass
    return None


def get_user_by_api_key(api_key: str) -> Optional[Dict[str, Any]]:
    if not api_key:
        return None
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE api_key = ?", (api_key.strip(),))
        row = cur.fetchone()
        conn.close()
        if row:
            return dict(row)
    except Exception:
        pass
    return None


def save_user(user: Dict[str, Any]) -> None:
    conn = get_app_db_connection(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO users (id, email, name, password_hash, role, tier, provider, api_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
            name = excluded.name,
            password_hash = excluded.password_hash,
            role = excluded.role,
            tier = excluded.tier,
            provider = excluded.provider,
            api_key = excluded.api_key
        """,
        (
            user["id"],
            user["email"].strip().lower(),
            user.get("name", user["email"].split("@")[0].capitalize()),
            user["password_hash"],
            user.get("role", "pro_trader"),
            user.get("tier", "free"),
            user.get("provider", "email"),
            user.get("api_key") or f"mp_live_{secrets.token_hex(16)}",
        ),
    )
    conn.commit()
    conn.close()


def record_user_login(user_id: str) -> None:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
    except Exception:
        pass


def persist_session(jti: str, user_id: str, expires_at: int) -> None:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute(
            """
            INSERT OR IGNORE INTO user_sessions (jti, user_id, expires_at, revoked)
            VALUES (?, ?, ?, 0)
            """,
            (jti, user_id, int(expires_at)),
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[SECURITY] Error persisting session: {e}")


def revoke_session(jti: str) -> bool:
    if not jti:
        return False
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute("UPDATE user_sessions SET revoked = 1 WHERE jti = ?", (jti,))
        conn.commit()
        conn.close()
        return True
    except Exception:
        return False


def is_session_active(jti: str) -> bool:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT revoked, expires_at FROM user_sessions WHERE jti = ?", (jti,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return False
        revoked = row["revoked"] if isinstance(row, dict) else row[0]
        exp = row["expires_at"] if isinstance(row, dict) else row[1]
        return int(revoked or 0) == 0 and int(exp or 0) > int(time.time())
    except Exception:
        return False


def get_user_alert_config(user_id: str) -> dict:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT * FROM user_alert_configs WHERE user_id = ?", (user_id,))
        row = cur.fetchone()
        conn.close()
        if row:
            return dict(row)
    except Exception as e:
        print(f"[SECURITY] Error getting alert config: {e}")
    return {
        "user_id": user_id,
        "telegram_chat_id": "@marketprobe_alerts",
        "whatsapp_phone": "",
        "telegram_enabled": 1,
        "whatsapp_enabled": 0,
        "min_conviction": 65.0,
    }


def update_user_alert_config(user_id: str, cfg: dict) -> dict:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO user_alert_configs (user_id, telegram_chat_id, whatsapp_phone, telegram_enabled, whatsapp_enabled, min_conviction)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                telegram_chat_id = excluded.telegram_chat_id,
                whatsapp_phone = excluded.whatsapp_phone,
                telegram_enabled = excluded.telegram_enabled,
                whatsapp_enabled = excluded.whatsapp_enabled,
                min_conviction = excluded.min_conviction
            """,
            (
                user_id,
                cfg.get("telegram_chat_id", "@marketprobe_alerts"),
                cfg.get("whatsapp_phone", ""),
                1 if cfg.get("telegram_enabled") else 0,
                1 if cfg.get("whatsapp_enabled") else 0,
                float(cfg.get("min_conviction", 60.0)),
            ),
        )
        conn.commit()
        conn.close()
        return {"status": "success", "config": cfg}
    except Exception as e:
        print(f"[SECURITY] Error updating alert config: {e}")
        return {"status": "error", "message": str(e)}


def get_user_watchlist(user_id: str) -> list:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute(
            "SELECT symbol, notes, alert_above, alert_below, created_at FROM user_watchlists WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        )
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        print(f"[SECURITY] Error fetching watchlist: {e}")
        return []


def toggle_watchlist_item(user_id: str, symbol: str, notes: str = "") -> dict:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id FROM user_watchlists WHERE user_id = ? AND symbol = ?", (user_id, symbol.upper()))
        existing = cur.fetchone()
        if existing:
            cur.execute("DELETE FROM user_watchlists WHERE user_id = ? AND symbol = ?", (user_id, symbol.upper()))
            conn.commit()
            conn.close()
            return {"symbol": symbol.upper(), "action": "removed"}
        cur.execute(
            "INSERT INTO user_watchlists (user_id, symbol, notes) VALUES (?, ?, ?)",
            (user_id, symbol.upper(), notes),
        )
        conn.commit()
        conn.close()
        return {"symbol": symbol.upper(), "action": "added"}
    except Exception as e:
        print(f"[SECURITY] Error toggling watchlist: {e}")
        return {"symbol": symbol.upper(), "error": str(e)}


def get_user_saved_calls(user_id: str) -> list:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT call_id, saved_at FROM saved_calls WHERE user_id = ? ORDER BY saved_at DESC", (user_id,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        print(f"[SECURITY] Error fetching saved calls: {e}")
        return []


def toggle_saved_call(user_id: str, call_id: str) -> dict:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id FROM saved_calls WHERE user_id = ? AND call_id = ?", (user_id, str(call_id)))
        existing = cur.fetchone()
        if existing:
            cur.execute("DELETE FROM saved_calls WHERE user_id = ? AND call_id = ?", (user_id, str(call_id)))
            conn.commit()
            conn.close()
            return {"call_id": str(call_id), "action": "unsaved"}
        cur.execute("INSERT INTO saved_calls (user_id, call_id) VALUES (?, ?)", (user_id, str(call_id)))
        conn.commit()
        conn.close()
        return {"call_id": str(call_id), "action": "saved"}
    except Exception as e:
        print(f"[SECURITY] Error toggling saved call: {e}")
        return {"call_id": str(call_id), "error": str(e)}


def record_subscription(
    user_id: str,
    gateway: str,
    tier: str,
    amount: float,
    order_id: str,
    payment_id: str,
    currency: str = "INR",
) -> dict:
    try:
        conn = get_app_db_connection(DB_PATH)
        cur = conn.cursor()
        sub_id = f"sub_{int(time.time())}_{secrets.token_hex(4)}"
        cur.execute(
            """
            INSERT INTO subscriptions (id, user_id, gateway, tier, status, order_id, payment_id, amount, currency)
            VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)
            """,
            (sub_id, user_id, gateway, tier, order_id, payment_id, amount, currency),
        )
        new_role = "enterprise_trader" if tier == "enterprise" else "pro_trader"
        cur.execute("UPDATE users SET tier = ?, role = ? WHERE id = ?", (tier, new_role, user_id))
        conn.commit()
        conn.close()
        return {"status": "success", "subscription_id": sub_id, "tier": tier, "role": new_role}
    except Exception as e:
        print(f"[SECURITY] Error recording subscription: {e}")
        return {"status": "error", "message": str(e)}


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(data: str) -> bytes:
    pad = len(data) % 4
    if pad:
        data += "=" * (4 - pad)
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def create_jwt_token(payload: Dict[str, Any], persist: bool = True) -> str:
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    now = int(time.time())
    claims = payload.copy()
    claims.setdefault("iat", now)
    claims.setdefault("exp", now + ACCESS_TOKEN_EXPIRE_SECONDS)
    claims.setdefault("jti", secrets.token_hex(16))

    if persist and claims.get("sub"):
        persist_session(str(claims["jti"]), str(claims["sub"]), int(claims["exp"]))

    encoded_header = _base64url_encode(json.dumps(header).encode("utf-8"))
    encoded_payload = _base64url_encode(json.dumps(claims).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    encoded_signature = _base64url_encode(signature)
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def verify_jwt_token(token: str) -> Dict[str, Any]:
    try:
        parts = str(token or "").split(".")
        if len(parts) != 3:
            raise ValueError("Malformed token")

        signing_input = f"{parts[0]}.{parts[1]}".encode("utf-8")
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(parts[2])

        if not hmac.compare_digest(expected_sig, actual_sig):
            raise ValueError("Signature mismatch")

        payload = json.loads(_base64url_decode(parts[1]).decode("utf-8"))
        if payload.get("exp") and float(payload["exp"]) < time.time():
            raise ValueError("Token expired")

        jti = payload.get("jti")
        if jti and not is_session_active(str(jti)):
            raise ValueError("Session revoked or expired")

        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired JWT token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
) -> Dict[str, Any]:
    # 1. Check real DB-backed API Key header
    api_key = request.headers.get("X-API-KEY")
    if api_key:
        db_user = get_user_by_api_key(api_key)
        if db_user:
            return {
                "id": db_user["id"],
                "email": db_user["email"],
                "name": db_user.get("name") or db_user["email"],
                "role": db_user.get("role", "pro_trader"),
                "tier": db_user.get("tier", "free"),
                "api_key": db_user.get("api_key"),
                "auth_type": "api_key",
            }
        raise HTTPException(status_code=401, detail="Invalid API Key")

    # 2. Check real DB-backed Bearer JWT + active session
    if credentials:
        try:
            payload = verify_jwt_token(credentials.credentials)
            sub = payload.get("sub")
            db_user = get_user_by_id(str(sub)) if sub else None
            if not db_user and payload.get("email"):
                db_user = get_user_by_email(str(payload["email"]))
            if db_user:
                return {
                    "id": db_user["id"],
                    "email": db_user["email"],
                    "name": db_user.get("name") or db_user["email"],
                    "role": db_user.get("role", "pro_trader"),
                    "tier": db_user.get("tier", "free"),
                    "api_key": db_user.get("api_key"),
                    "jti": payload.get("jti"),
                    "auth_type": "jwt",
                }
        except HTTPException:
            pass

    # 3. Unauthenticated guest
    return {
        "id": "anon_client",
        "email": "anonymous@marketprobe.local",
        "role": "anonymous",
        "tier": "free",
        "auth_type": "public",
    }


def require_auth(user: Dict[str, Any] = Security(get_current_user_optional)) -> Dict[str, Any]:
    if user["role"] == "anonymous":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in with a verified MarketProbe account.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
