"""
SaaS Authentication, Razorpay/Stripe Billing, User Watchlists, Saved Calls & Alert Channels Router.
"""

import hashlib
import hmac
import os
import sqlite3
import time
from datetime import datetime
from typing import Any, Callable, Dict, Optional

import yfinance as yf
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.backend.security import (
    USER_DB,
    create_jwt_token,
    get_current_user_optional,
    get_user_alert_config,
    get_user_by_email,
    get_user_saved_calls,
    get_user_watchlist,
    hash_password,
    record_subscription,
    require_auth,
    save_user,
    toggle_saved_call,
    toggle_watchlist_item,
    update_user_alert_config,
    verify_password,
)


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class OAuthRequest(BaseModel):
    provider: str
    code: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None


class CreateOrderRequest(BaseModel):
    tier: str
    gateway: str = "razorpay"
    currency: str = "INR"


class VerifyPaymentRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: Optional[str] = None
    gateway: str = "razorpay"
    tier: str = "pro"
    amount: float = 1499.0


class WatchlistToggleRequest(BaseModel):
    symbol: str
    notes: Optional[str] = ""


class SavedCallToggleRequest(BaseModel):
    call_id: str


class AlertConfigRequest(BaseModel):
    telegram_chat_id: Optional[str] = "@marketprobe_alerts"
    whatsapp_phone: Optional[str] = ""
    telegram_enabled: bool = True
    whatsapp_enabled: bool = False
    min_conviction: float = 65.0


PRICING_CATALOG = {
    "pro": {
        "name": "Quant Pro Trader",
        "inr_price": 1499.0,
        "usd_price": 19.0,
        "features": [
            "Sub-second LiveTape Polling",
            "Telegram Scraping Alerts",
            "Bayesian Shrinkage Filter",
            "Unlimited Watchlists",
        ],
    },
    "enterprise": {
        "name": "Institutional Admin & Hedge Fund",
        "inr_price": 9999.0,
        "usd_price": 129.0,
        "features": [
            "High-Throughput REST & WebSocket API",
            "Dedicated Worker Threadpool",
            "Bulk Vectorized Ingestion",
            "X-API-KEY Enterprise SLA",
        ],
    },
}


def create_auth_billing_router(
    db_path: str,
    get_live_quotes_cache: Callable[[], Dict[str, Any]],
) -> APIRouter:
    router = APIRouter(tags=["Auth, Billing & User Workspace"])

    @router.post("/api/auth/login")
    def login_user(req: LoginRequest):
        email_clean = req.email.strip().lower()
        user = get_user_by_email(email_clean) or USER_DB.get(email_clean)

        if email_clean == "demo@marketprobe.in":
            if not user:
                user = {
                    "id": "usr_demo_001",
                    "email": "demo@marketprobe.in",
                    "name": "MarketProbe Demo Trader",
                    "password_hash": hash_password("demo123"),
                    "role": "pro_trader",
                    "tier": "pro",
                    "provider": "email",
                    "api_key": "mp_live_demo_992837418293847",
                }
                save_user(user)
            if req.password != "demo123" and not verify_password(req.password, user.get("password_hash", "")):
                raise HTTPException(status_code=401, detail="Invalid credentials for demo account.")
        else:
            if not user:
                raise HTTPException(status_code=401, detail="No account found with this email. Please sign up first.")
            if not verify_password(req.password, user.get("password_hash", "")):
                raise HTTPException(status_code=401, detail="Incorrect password. Please verify your credentials.")

        token = create_jwt_token(
            {"sub": user["id"], "email": user["email"], "role": user["role"], "tier": user["tier"]}
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user.get("name", user["email"]),
                "role": user["role"],
                "tier": user["tier"],
                "api_key": user.get("api_key"),
            },
        }

    @router.post("/api/auth/register")
    def register_user(req: RegisterRequest):
        existing = get_user_by_email(req.email) or USER_DB.get(req.email)
        if existing:
            raise HTTPException(status_code=400, detail="Account with this email already exists.")
        user = {
            "id": f"usr_{int(time.time())}",
            "email": req.email.lower(),
            "name": req.name,
            "password_hash": hash_password(req.password),
            "role": "pro_trader",
            "tier": "pro",
            "provider": "email",
            "api_key": f"mp_live_{abs(hash(req.email))}",
        }
        USER_DB[req.email] = user
        save_user(user)
        token = create_jwt_token(
            {"sub": user["id"], "email": user["email"], "role": user["role"], "tier": user["tier"]}
        )
        return {
            "status": "success",
            "access_token": token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "tier": user["tier"],
                "api_key": user["api_key"],
            },
        }

    @router.post("/api/auth/oauth")
    def oauth_login(req: OAuthRequest):
        provider = req.provider.lower()
        email = (req.email or f"trader_{provider}@marketprobe.finance").lower()
        name = req.name or f"{provider.capitalize()} Trader"

        user = get_user_by_email(email) or USER_DB.get(email)
        if not user:
            user = {
                "id": f"usr_{provider}_{int(time.time())}",
                "email": email,
                "name": name,
                "password_hash": hash_password(f"oauth_{provider}_{time.time()}"),
                "role": "pro_trader",
                "tier": "pro",
                "provider": provider,
                "api_key": f"mp_live_{abs(hash(email))}",
            }
            USER_DB[email] = user
            save_user(user)
        else:
            user["provider"] = provider
            if req.name:
                user["name"] = req.name
            save_user(user)

        token = create_jwt_token(
            {
                "sub": user["id"],
                "email": user["email"],
                "role": user["role"],
                "tier": user["tier"],
                "provider": provider,
            }
        )
        return {
            "status": "success",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "tier": user["tier"],
                "provider": provider,
                "api_key": user.get("api_key"),
            },
        }

    @router.get("/api/auth/me")
    def get_current_user_profile(user: dict = Depends(get_current_user_optional)):
        return {
            "user": user,
            "status": "authenticated" if user["role"] != "anonymous" else "guest",
        }

    @router.get("/api/billing/plans")
    def get_pricing_plans():
        return {
            "status": "success",
            "plans": PRICING_CATALOG,
            "supported_gateways": ["razorpay", "stripe", "upi_direct"],
        }

    @router.post("/api/billing/create-order")
    def create_checkout_order(req: CreateOrderRequest, user: dict = Depends(require_auth)):
        plan = PRICING_CATALOG.get(req.tier.lower())
        if not plan:
            raise HTTPException(status_code=400, detail="Invalid tier requested.")

        order_id = f"order_{req.gateway}_{int(time.time())}_{abs(hash(user['email'])) % 10000}"
        amount = plan["inr_price"] if req.currency == "INR" else plan["usd_price"]

        if req.gateway == "razorpay":
            key_id = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_marketprobe")
        elif req.gateway == "stripe":
            key_id = os.environ.get("STRIPE_PUBLISHABLE_KEY", "pk_test_marketprobe")
        else:
            key_id = "upi_direct_marketprobe"

        return {
            "status": "success",
            "gateway": req.gateway,
            "order_id": order_id,
            "tier": req.tier.lower(),
            "amount": amount,
            "currency": req.currency,
            "key_id": key_id,
            "user": {"name": user.get("name", "Trader"), "email": user["email"]},
        }

    @router.post("/api/billing/verify-payment")
    def verify_payment(req: VerifyPaymentRequest, user: dict = Depends(require_auth)):
        razorpay_secret = os.environ.get("RAZORPAY_KEY_SECRET")
        stripe_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
        is_prod = os.environ.get("ENV", "").lower() == "production" or os.environ.get("RENDER", "").lower() == "true"
        allow_demo_billing = os.environ.get("MARKETPROBE_DEMO_MODE", "false" if is_prod else "true").lower() == "true"

        if req.gateway == "razorpay":
            if razorpay_secret:
                if not req.signature:
                    raise HTTPException(status_code=400, detail="Missing required Razorpay HMAC signature.")
                msg = f"{req.order_id}|{req.payment_id}".encode("utf-8")
                expected_sig = hmac.new(razorpay_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
                if not hmac.compare_digest(expected_sig, req.signature):
                    raise HTTPException(status_code=400, detail="Invalid Razorpay payment signature.")
            elif not allow_demo_billing:
                raise HTTPException(status_code=503, detail="Razorpay secret not configured for production checkout.")
        elif req.gateway == "stripe":
            if stripe_secret:
                if not req.signature:
                    raise HTTPException(status_code=400, detail="Missing required Stripe payment signature.")
                expected_sig = hmac.new(stripe_secret.encode("utf-8"), req.payment_id.encode("utf-8"), hashlib.sha256).hexdigest()
                if not hmac.compare_digest(expected_sig, req.signature):
                    raise HTTPException(status_code=400, detail="Invalid Stripe payment signature.")
            elif not allow_demo_billing:
                raise HTTPException(status_code=503, detail="Stripe webhook secret not configured for production checkout.")

        res = record_subscription(
            user_id=user["id"],
            gateway=req.gateway,
            tier=req.tier,
            amount=req.amount,
            order_id=req.order_id,
            payment_id=req.payment_id,
            currency="INR" if req.gateway == "razorpay" else "USD",
        )
        if res.get("status") == "error":
            raise HTTPException(status_code=500, detail=res.get("message"))

        new_token = create_jwt_token(
            {"sub": user["id"], "email": user["email"], "role": res["role"], "tier": res["tier"]}
        )
        return {
            "status": "success",
            "message": f"Successfully activated {req.tier.upper()} subscription!",
            "access_token": new_token,
            "user_tier": res["tier"],
            "user_role": res["role"],
            "subscription_id": res.get("subscription_id"),
        }

    @router.get("/api/user/watchlist")
    def get_watchlist(user: dict = Depends(require_auth)):
        items = get_user_watchlist(user["id"])
        live_cache = get_live_quotes_cache()
        conn = None
        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
        except Exception:
            pass

        enriched = []
        for item in items:
            sym = item["symbol"].upper().replace(".NS", "")
            sym_ns = f"{sym}.NS"

            quote = live_cache.get(sym) or live_cache.get(sym_ns)
            price = None
            change_pct = None
            day_high = None
            day_low = None
            source = "EXCHANGE_CACHE"

            if quote:
                price = quote.get("price")
                change_pct = quote.get("change_pct")
                day_high = quote.get("day_high")
                day_low = quote.get("day_low")
            else:
                try:
                    t = yf.Ticker(sym_ns)
                    fi = t.fast_info
                    last_p = getattr(fi, "last_price", None)
                    prev_c = getattr(fi, "previous_close", None)
                    if last_p is not None:
                        price = round(float(last_p), 2)
                        day_high = round(float(getattr(fi, "day_high", last_p)), 2) if getattr(fi, "day_high", None) else None
                        day_low = round(float(getattr(fi, "day_low", last_p)), 2) if getattr(fi, "day_low", None) else None
                        if prev_c and prev_c > 0:
                            change_pct = round(((price - float(prev_c)) / float(prev_c)) * 100, 2)
                        source = "LIVE_NSE_TICK"
                        live_cache[sym] = {
                            "ticker": sym,
                            "price": price,
                            "change_pct": change_pct or 0.0,
                            "day_high": day_high,
                            "day_low": day_low,
                            "timestamp": datetime.now().isoformat(),
                        }
                except Exception:
                    source = "OFFLINE"

            calls_count = 0
            buy_calls = 0
            avg_target = None
            creator_names = []
            if conn:
                try:
                    cur = conn.cursor()
                    cur.execute(
                        """SELECT r.action, r.target_price, i.name as influencer_name
                           FROM recommendations r
                           LEFT JOIN influencers i ON r.influencer_id = i.id
                           WHERE r.ticker = ? OR r.ticker = ?""",
                        (sym, sym_ns),
                    )
                    rec_rows = cur.fetchall()
                    calls_count = len(rec_rows)
                    targets = []
                    for r in rec_rows:
                        if r["action"] and r["action"].upper() == "BUY":
                            buy_calls += 1
                        if r["target_price"] and r["target_price"] > 0:
                            targets.append(r["target_price"])
                        if r["influencer_name"] and r["influencer_name"] not in creator_names:
                            creator_names.append(r["influencer_name"])
                    if targets:
                        avg_target = round(sum(targets) / len(targets), 2)
                except Exception:
                    pass

            consensus_verdict = "NEUTRAL"
            if calls_count > 0:
                buy_ratio = buy_calls / calls_count
                if buy_ratio >= 0.7:
                    consensus_verdict = "HIGH_BULLISH_CONSENSUS"
                elif buy_ratio >= 0.5:
                    consensus_verdict = "MODERATE_BULLISH"
                else:
                    consensus_verdict = "CAUTIOUS_CONSENSUS"

            enriched.append(
                {
                    **item,
                    "symbol": sym,
                    "current_price": price,
                    "change_pct": change_pct,
                    "day_high": day_high,
                    "day_low": day_low,
                    "exchange_source": source,
                    "audited_calls_count": calls_count,
                    "consensus_verdict": consensus_verdict,
                    "avg_target": avg_target,
                    "tracked_creators": creator_names[:3],
                }
            )

        if conn:
            conn.close()
        return {"status": "success", "watchlist": enriched, "count": len(enriched)}

    @router.post("/api/user/watchlist/toggle")
    def toggle_watchlist(req: WatchlistToggleRequest, user: dict = Depends(require_auth)):
        result = toggle_watchlist_item(user["id"], req.symbol, req.notes or "")
        return {"status": "success", **result}

    @router.get("/api/user/saved-calls")
    def get_saved_calls(user: dict = Depends(require_auth)):
        items = get_user_saved_calls(user["id"])
        saved_ids = {str(item["call_id"]) for item in items}

        calls_enriched = []
        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM recommendations ORDER BY call_timestamp DESC")
            for row in cur.fetchall():
                rec = dict(row)
                if str(rec.get("id")) in saved_ids:
                    calls_enriched.append(rec)
            conn.close()
        except Exception as e:
            print(f"Error enriching saved calls: {e}")

        return {"status": "success", "saved_calls": calls_enriched, "count": len(calls_enriched)}

    @router.post("/api/user/saved-calls/toggle")
    def toggle_saved(req: SavedCallToggleRequest, user: dict = Depends(require_auth)):
        result = toggle_saved_call(user["id"], req.call_id)
        return {"status": "success", **result}

    @router.get("/api/user/alerts/config")
    def get_alert_config(user: dict = Depends(require_auth)):
        cfg = get_user_alert_config(user["id"])
        return {"status": "success", "config": cfg}

    @router.post("/api/user/alerts/config")
    def save_alert_config(req: AlertConfigRequest, user: dict = Depends(require_auth)):
        res = update_user_alert_config(user["id"], req.model_dump())
        return {"status": "success", **res}

    return router
