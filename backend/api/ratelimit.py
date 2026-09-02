import time

from django.core.cache import cache

from api.errors import ApiError


def _client_ip(request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # First entry is the original client when behind a reverse proxy.
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def rate_limit(key: str, limit: int, window_seconds: int):
    """Decorator: allow at most `limit` requests per `window_seconds` per
    client IP for the decorated view. Raises 429 once the limit is hit.

    Uses Django's cache framework (see CACHES in settings.py) as the
    counter store. LocMemCache (the dev default) only tracks counts within
    a single process — fine for one `runserver`/one Gunicorn worker, but
    for multiple workers/machines in production set REDIS_URL so all
    workers share the same counters.
    """

    def decorator(view_func):
        def wrapped(request, *args, **kwargs):
            ip = _client_ip(request)
            cache_key = f"ratelimit:{key}:{ip}"

            current = cache.get(cache_key)
            if current is None:
                cache.set(cache_key, 1, timeout=window_seconds)
            elif current >= limit:
                raise ApiError(429, "Too many requests. Please try again later.")
            else:
                try:
                    cache.incr(cache_key)
                except ValueError:
                    # Key expired between get() and incr() - start fresh.
                    cache.set(cache_key, 1, timeout=window_seconds)

            return view_func(request, *args, **kwargs)

        wrapped.__name__ = getattr(view_func, "__name__", "wrapped")
        return wrapped

    return decorator
