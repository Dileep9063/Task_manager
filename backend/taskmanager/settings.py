import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


def _env_bool(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def _env_list(name: str, default: list[str]) -> list[str]:
    val = os.getenv(name)
    if not val:
        return default
    return [item.strip() for item in val.split(",") if item.strip()]


# ================= Core / Security =================

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-secret-key")
DEBUG = _env_bool("DJANGO_DEBUG", True)

# In production, set DJANGO_ALLOWED_HOSTS to a comma-separated list of your
# real domain(s), e.g. "api.example.com,example.com". Falls back to "*"
# only in DEBUG mode for local development convenience.
ALLOWED_HOSTS = _env_list("DJANGO_ALLOWED_HOSTS", ["*"] if DEBUG else [])

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "corsheaders",
    "api",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "taskmanager.urls"
WSGI_APPLICATION = "taskmanager.wsgi.application"

# ================= CORS =================
# In development this stays wide open (mirrors app.use(cors()) in the
# original server.js). In production, set DJANGO_CORS_ALLOWED_ORIGINS to a
# comma-separated list of the exact origin(s) your frontend is served from,
# e.g. "https://app.example.com". Wildcards are not allowed for credentialed
# requests, so an explicit allow-list is required once DEBUG is off.
_cors_origins = _env_list("DJANGO_CORS_ALLOWED_ORIGINS", [])
if DEBUG and not _cors_origins:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = _cors_origins
CORS_ALLOW_CREDENTIALS = True

# ================= Database =================
# Same PostgreSQL database as the original PERN app - just point these
# at your existing DB and all existing data/users keep working.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "NAME": os.getenv("DB_NAME", "task_manager"),
        "CONN_MAX_AGE": int(os.getenv("DB_CONN_MAX_AGE", "60")),
    }
}

# This project talks to the existing hand-designed schema via raw SQL
# (see api/db.py) rather than Django ORM models/migrations, so the table
# structure created by the original Node/Express app is left untouched.
MIGRATION_MODULES = {
    "api": None,
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": [],
    "EXCEPTION_HANDLER": "api.exceptions.express_style_exception_handler",
}

JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# ================= AI Assistant (Groq) =================
# Used by api/ai_agent.py for the admin AI chat feature. Both values are
# read from the .env file already loaded via load_dotenv() above.
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

USE_TZ = True

# ================= Cache (used for rate limiting) =================
# Local-memory cache works fine for a single-process dev server. If you
# deploy with multiple Gunicorn workers/machines, point this at Redis
# instead (see docker-compose.yml) so rate limits are shared across
# processes rather than tracked separately per worker.
REDIS_URL = os.getenv("REDIS_URL")
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }

# ================= Production hardening =================
# These only kick in when DEBUG is False, so local development is
# unaffected. Set DJANGO_DEBUG=False and serve over HTTPS in production
# for these to take effect.
if not DEBUG:
    SECURE_SSL_REDIRECT = _env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    # If you're behind a reverse proxy (Nginx, a load balancer, etc.) that
    # terminates TLS and forwards plain HTTP, uncomment this so Django
    # correctly detects the original request was HTTPS:
    # SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")