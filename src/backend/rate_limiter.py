"""
MarketProbe Sliding-Window Token Bucket Rate Limiter
Prevents scraping, abuse, and API exhaustion with tiered limits:
- Anonymous: 120 req/min
- Pro: 1,200 req/min
- Enterprise: 10,000 req/min
"""

import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status

RATE_LIMITS = {
    "free": {"capacity": 120, "window_seconds": 60},
    "anonymous": {"capacity": 120, "window_seconds": 60},
    "pro": {"capacity": 1200, "window_seconds": 60},
    "enterprise": {"capacity": 10000, "window_seconds": 60}
}

# Key: (client_identifier, endpoint_bucket) -> (tokens_remaining, last_update_timestamp)
BUCKET_STORE: Dict[Tuple[str, str], Tuple[float, float]] = {}

def check_rate_limit(request: Request, user_tier: str = "anonymous", bucket_name: str = "default"):
    client_ip = request.client.host if request.client else "127.0.0.1"
    key = (client_ip, bucket_name)
    now = time.time()
    
    cfg = RATE_LIMITS.get(user_tier, RATE_LIMITS["anonymous"])
    capacity = float(cfg["capacity"])
    refill_rate = capacity / cfg["window_seconds"]
    
    if key in BUCKET_STORE:
        current_tokens, last_update = BUCKET_STORE[key]
        elapsed = now - last_update
        current_tokens = min(capacity, current_tokens + (elapsed * refill_rate))
    else:
        current_tokens = capacity

    if current_tokens < 1.0:
        retry_after = round((1.0 - current_tokens) / refill_rate, 1)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Tier: {user_tier}. Retry in {retry_after}s.",
            headers={"Retry-After": str(int(retry_after) + 1)}
        )

    BUCKET_STORE[key] = (current_tokens - 1.0, now)
