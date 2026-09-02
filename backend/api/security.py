from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from django.conf import settings

from api.errors import ApiError


# ================= Password Hashing =================

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    if not plain or not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


# ================= JWT =================

def create_token(payload: dict, expires_in_days: int = 1) -> str:
    to_encode = dict(payload)
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(days=expires_in_days)
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])


# ================= Request Helpers =================
# Mirrors authMiddleware.js: reads "Authorization: Bearer <token>" and
# verifies it. Call this at the top of any view that needs a logged-in user.

def get_current_user(request) -> dict:
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header:
        parts = auth_header.split(" ")
        if len(parts) == 2:
            token = parts[1]

    if not token:
        raise ApiError(401, "No token provided")

    try:
        return decode_token(token)
    except jwt.PyJWTError:
        raise ApiError(401, "Invalid token")


# Mirrors isAdmin.js
def require_admin(request) -> dict:
    user = get_current_user(request)
    role = user.get("role") or ""
    if role.lower() != "admin":
        raise ApiError(403, "Admin access required")
    return user
