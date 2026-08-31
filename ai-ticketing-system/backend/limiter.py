"""
Rate Limiter Configuration for FastAPI via slowapi.
Supports distributed Redis backend via REDIS_URL or in-memory fallback.
"""

import os
from slowapi import Limiter
from slowapi.util import get_remote_address

storage_uri = os.getenv("REDIS_URL", "memory://")

# Global default: 100 requests per minute per IP
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri=storage_uri,
)
