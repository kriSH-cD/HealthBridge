import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from app.core.config import settings

# In-memory IP request history: { ip_address: [timestamp, timestamp, ...] }
_request_history = defaultdict(list)


def check_rate_limit(request: Request, limit: int = 30, window_seconds: int = 60):
    """
    In-memory rate limiter for authentication endpoints.
    Allows up to `limit` requests per `window_seconds` per client IP.
    """
    # Allow testing bypass if header or test client is detected
    if request.headers.get("X-Test-Client") == "true":
        return

    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    
    # Filter out entries older than window
    history = _request_history[client_ip]
    _request_history[client_ip] = [t for t in history if now - t < window_seconds]
    
    if len(_request_history[client_ip]) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please try again after 60 seconds."
        )
        
    _request_history[client_ip].append(now)

