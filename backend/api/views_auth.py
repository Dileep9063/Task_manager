"""
================= Schema changes required =================
Run these migrations before deploying this file:

    ALTER TABLE users ADD COLUMN otp_attempts INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE users ADD COLUMN locked_until TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

Notes on token_version:
    This file bumps `token_version` whenever a password changes, and includes
    it in the JWT payload created by create_token(). To actually invalidate
    old tokens you also need to check `token_version` inside get_current_user()
    (or wherever tokens are decoded) against the current DB value, and reject
    the request if they don't match. That file wasn't included here, so this
    change is incomplete until you wire that check in.
"""

import re
from datetime import datetime, timedelta, timezone

import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.db import query, query_one
from api.email_utils import generate_otp, send_email
from api.errors import ApiError
from api.ratelimit import rate_limit
from api.security import create_token, get_current_user, hash_password, verify_password

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

MAX_OTP_ATTEMPTS = 5
MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 15


# ================= Shared helpers =================

def _otp_expired(otp_expiry) -> bool:
    if otp_expiry is None:
        return True
    now = datetime.now(timezone.utc)
    if otp_expiry.tzinfo is None:
        otp_expiry = otp_expiry.replace(tzinfo=timezone.utc)
    return now > otp_expiry


def _validate_password(password: str):
    """
    Policy: at least 8 characters, starts with an uppercase letter,
    contains at least one digit, and at least one special character.
    """
    if not password or not isinstance(password, str):
        raise ApiError(400, "Password is required.")

    if len(password) > 128:
        raise ApiError(400, "Password must be no more than 128 characters long.")

    if len(password) < 8:
        raise ApiError(400, "Password must be at least 8 characters long.")

    if not password[0].isupper():
        raise ApiError(400, "Password must start with an uppercase letter.")

    if not any(ch.isdigit() for ch in password):
        raise ApiError(400, "Password must contain at least one number.")

    if not any(not ch.isalnum() for ch in password):
        raise ApiError(400, "Password must contain at least one special character.")


def _validate_email(email: str):
    if not email or not isinstance(email, str) or not EMAIL_REGEX.match(email.strip()):
        raise ApiError(400, "A valid email address is required.")


def _validate_name(name: str):
    if not name or not isinstance(name, str) or not name.strip():
        raise ApiError(400, "Name is required.")


def _reject_password_reuse(new_password: str, current_hashed_password: str | None):
    """Block setting the new password equal to the one already on file."""
    if current_hashed_password and verify_password(new_password, current_hashed_password):
        raise ApiError(400, "New password must be different from your current password.")


def _issue_otp(user_id_or_email_column: str, id_value, email: str, subject: str):
    """
    Generates a plaintext OTP, stores only its hash + a fresh expiry + reset
    attempt counter, and emails the plaintext OTP to the user. If the email
    fails to send, the OTP fields are rolled back so the user isn't left
    holding an OTP that never arrived.
    """
    otp = generate_otp()
    hashed_otp = hash_password(otp)
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    query(
        f"UPDATE users SET otp=%s, otp_expiry=%s, otp_attempts=0 WHERE {user_id_or_email_column}=%s",
        (hashed_otp, otp_expiry, id_value),
    )

    try:
        send_email(email, subject, f"Your OTP is {otp}. It is valid for 10 minutes.")
    except Exception:
        query(
            f"UPDATE users SET otp=NULL, otp_expiry=NULL, otp_attempts=0 WHERE {user_id_or_email_column}=%s",
            (id_value,),
        )
        raise ApiError(500, "Failed to send OTP email. Please try again in a moment.")


def _check_and_consume_otp_attempt(db_user, submitted_otp: str):
    """
    Verifies submitted_otp against the stored hash. Tracks failed attempts
    per-user and locks further tries once MAX_OTP_ATTEMPTS is exceeded,
    regardless of route-level rate limiting.
    """
    user_id = db_user["id"]

    if not db_user.get("otp") or not db_user.get("otp_expiry"):
        raise ApiError(400, "Please request a new OTP.")

    if (db_user.get("otp_attempts") or 0) >= MAX_OTP_ATTEMPTS:
        raise ApiError(429, "Too many incorrect attempts. Please request a new OTP.")

    if _otp_expired(db_user.get("otp_expiry")):
        raise ApiError(400, "OTP Expired")

    if not verify_password(submitted_otp, db_user["otp"]):
        query("UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = %s", (user_id,))
        raise ApiError(400, "Invalid OTP")


def _notify(notif_type: str, title: str, message: str):
    query(
        "INSERT INTO notifications(type, title, message) VALUES(%s, %s, %s)",
        (notif_type, title, message),
    )


# ================= Register =================

@api_view(["POST"])
@rate_limit("register", limit=5, window_seconds=3600)
def register(request):
    body = request.data
    name = body.get("name")
    email = body.get("email")
    password = body.get("password")

    _validate_name(name)
    _validate_email(email)
    _validate_password(password)
    email = email.strip().lower()

    settings_row = query_one("SELECT allow_registration FROM settings WHERE id = 1")
    if settings_row is not None and settings_row.get("allow_registration") is False:
        raise ApiError(403, "New user registration is currently disabled by the administrator.")

    existing = query("SELECT * FROM users WHERE email = %s", (email,))
    if existing:
        raise ApiError(400, "User already exists")

    hashed = hash_password(password)
    new_user = query_one(
        "INSERT INTO users(name, email, password) VALUES(%s, %s, %s) RETURNING id, name",
        (name, email, hashed),
    )

    _notify("user", "New User Registered", f"{new_user['name']} has registered successfully.")

    return Response({"message": "User Registered Successfully"}, status=201)


# ================= Google Auth =================

@api_view(["POST"])
@rate_limit("google-auth", limit=15, window_seconds=900)
def google_auth(request):
    access_token = request.data.get("access_token")

    if not access_token:
        raise ApiError(400, "Missing Google access token")

    try:
        google_res = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        google_res.raise_for_status()
        profile = google_res.json()
    except requests.RequestException:
        raise ApiError(400, "Invalid Google token")

    email = profile.get("email")
    name = profile.get("name")
    google_id = profile.get("sub")
    email_verified = profile.get("email_verified")

    if not email_verified:
        raise ApiError(400, "Google email is not verified")

    _validate_email(email)
    email = email.strip().lower()

    existing = query("SELECT * FROM users WHERE email = %s", (email,))

    if not existing:
        settings_row = query_one("SELECT allow_registration FROM settings WHERE id = 1")
        if settings_row is not None and settings_row.get("allow_registration") is False:
            raise ApiError(403, "New user registration is currently disabled by the administrator.")

        user = query_one(
            """
            INSERT INTO users(name, email, google_id)
            VALUES(%s, %s, %s)
            RETURNING id, name, email, role
            """,
            (name, email, google_id),
        )

        _notify("user", "New User Registered", f"{user['name']} has registered successfully via Google.")
    else:
        user = existing[0]

        if user.get("status") and user["status"].lower() == "blocked":
            raise ApiError(403, "Your account has been blocked by the administrator.")

        if not user.get("google_id"):
            query("UPDATE users SET google_id = %s WHERE email = %s", (google_id, email))
            _notify(
                "security",
                "Google Account Linked",
                f"A Google account was linked to {user['email']}.",
            )

    token = create_token({
        "id": user["id"],
        "email": user["email"],
        "role": user.get("role"),
        "token_version": user.get("token_version", 0),
    })

    return Response({
        "message": "Signed in with Google successfully",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role"),
        },
    })


# ================= Login =================

@api_view(["POST"])
@rate_limit("login", limit=10, window_seconds=900)
def login(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        raise ApiError(400, "Invalid Email or Password")

    result = query("SELECT * FROM users WHERE email = %s", (email.strip().lower(),))
    if not result:
        raise ApiError(400, "Invalid Email or Password")

    user = result[0]

    if user.get("status") and user["status"].lower() == "blocked":
        raise ApiError(403, "Your account has been blocked by the administrator.")

    locked_until = user.get("locked_until")
    if locked_until:
        lu = locked_until if locked_until.tzinfo else locked_until.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < lu:
            raise ApiError(429, "Too many failed login attempts. Please try again later.")

    is_admin = bool(user.get("role") and user["role"].lower() == "admin")

    if not is_admin:
        settings_row = query_one("SELECT maintenance_mode FROM settings WHERE id = 1")
        if settings_row is not None and settings_row.get("maintenance_mode") is True:
            raise ApiError(503, "System is currently under maintenance. Please try again later.")

    if not user.get("password"):
        raise ApiError(400, "This account was created with Google. Please use 'Continue with Google' to sign in.")

    if not verify_password(password, user["password"]):
        attempts = (user.get("failed_login_attempts") or 0) + 1
        if attempts >= MAX_LOGIN_ATTEMPTS:
            locked_until_value = datetime.now(timezone.utc) + timedelta(minutes=LOGIN_LOCKOUT_MINUTES)
            query(
                "UPDATE users SET failed_login_attempts=%s, locked_until=%s WHERE id=%s",
                (attempts, locked_until_value, user["id"]),
            )
            _notify(
                "security",
                "Account Temporarily Locked",
                f"{user['email']} was locked for {LOGIN_LOCKOUT_MINUTES} minutes after repeated failed logins.",
            )
        else:
            query("UPDATE users SET failed_login_attempts=%s WHERE id=%s", (attempts, user["id"]))
        raise ApiError(400, "Invalid Email or Password")

    if user.get("failed_login_attempts") or user.get("locked_until"):
        query("UPDATE users SET failed_login_attempts=0, locked_until=NULL WHERE id=%s", (user["id"],))

    token = create_token({
        "id": user["id"],
        "email": user["email"],
        "role": user.get("role"),
        "token_version": user.get("token_version", 0),
    })

    return Response({
        "message": "Login Successful",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role"),
        },
    })


# ================= Forgot Password (logged-out flow) =================

@api_view(["POST"])
@rate_limit("forgot-password", limit=5, window_seconds=3600)
def forgot_password(request):
    email = request.data.get("email")
    _validate_email(email)
    email = email.strip().lower()

    generic_response = Response({"message": "If an account with that email exists, an OTP has been sent."})

    result = query("SELECT * FROM users WHERE email = %s", (email,))
    if not result:
        # Same response whether or not the account exists, to avoid leaking
        # which emails are registered.
        return generic_response

    user = result[0]
    _issue_otp("email", email, email, "Task Manager Password Reset OTP")

    return generic_response


# ================= Verify OTP =================

@api_view(["POST"])
@rate_limit("verify-otp", limit=10, window_seconds=3600)
def verify_otp(request):
    email = request.data.get("email")
    otp = request.data.get("otp")

    if not email or not otp:
        raise ApiError(400, "Email and OTP are required.")

    result = query("SELECT * FROM users WHERE email = %s", (email.strip().lower(),))
    if not result:
        raise ApiError(404, "User not found")

    user = result[0]
    _check_and_consume_otp_attempt(user, otp)

    return Response({"message": "OTP Verified Successfully"})


# ================= Reset Password (logged-out flow) =================

@api_view(["POST"])
@rate_limit("reset-password", limit=5, window_seconds=3600)
def reset_password(request):
    email = request.data.get("email")
    otp = request.data.get("otp")
    password = request.data.get("password")

    if not email or not otp or not password:
        raise ApiError(400, "Email, OTP and new password are required.")

    _validate_password(password)

    result = query("SELECT * FROM users WHERE email = %s", (email.strip().lower(),))
    if not result:
        raise ApiError(404, "User not found")

    user = result[0]
    _check_and_consume_otp_attempt(user, otp)
    _reject_password_reuse(password, user.get("password"))

    hashed = hash_password(password)
    query(
        """
        UPDATE users
        SET password=%s, otp=NULL, otp_expiry=NULL, otp_attempts=0,
            token_version = COALESCE(token_version, 0) + 1
        WHERE email=%s
        """,
        (hashed, user["email"]),
    )

    _notify("security", "Password Reset", f"{user['email']} reset their password via OTP.")

    return Response({"message": "Password Reset Successfully"})


# ================= Send OTP for Change Password (logged-in Settings flow) =================

@api_view(["POST"])
@rate_limit("send-change-password-otp", limit=5, window_seconds=3600)
def send_change_password_otp(request):
    user_ctx = get_current_user(request)
    user_id = user_ctx["id"]
    email = request.data.get("email")

    result = query("SELECT * FROM users WHERE id = %s", (user_id,))
    if not result:
        raise ApiError(404, "User not found")

    db_user = result[0]

    if email and email.strip().lower() != (db_user.get("email") or "").lower():
        raise ApiError(400, "Email does not match your account.")

    _issue_otp("id", user_id, db_user["email"], "Task Manager - Change Password OTP")

    return Response({"message": "OTP sent successfully"})


# ================= Change Password with OTP (logged-in Settings flow) =================

@api_view(["PUT"])
def change_password_with_otp(request):
    user_ctx = get_current_user(request)
    user_id = user_ctx["id"]
    otp = request.data.get("otp")
    new_password = request.data.get("newPassword")

    if not otp or not new_password:
        raise ApiError(400, "OTP and new password are required.")

    _validate_password(new_password)

    result = query("SELECT * FROM users WHERE id = %s", (user_id,))
    if not result:
        raise ApiError(404, "User not found")

    db_user = result[0]
    _check_and_consume_otp_attempt(db_user, otp)
    _reject_password_reuse(new_password, db_user.get("password"))

    hashed = hash_password(new_password)
    query(
        """
        UPDATE users
        SET password=%s, otp=NULL, otp_expiry=NULL, otp_attempts=0,
            token_version = COALESCE(token_version, 0) + 1
        WHERE id=%s
        """,
        (hashed, user_id),
    )

    _notify("security", "Password Changed", f"{db_user['email']} changed their password.")

    return Response({"message": "Password changed successfully"})