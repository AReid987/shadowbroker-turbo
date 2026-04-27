"""Simple in-memory cache with TTL."""
import time
from typing import Any, Optional

class TimedCache:
    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key not in self._store:
            return None
        value, expiry = self._store[key]
        if time.time() > expiry:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: float):
        self._store[key] = (value, time.time() + ttl_seconds)

    def delete(self, key: str):
        self._store.pop(key, None)

cache = TimedCache()
