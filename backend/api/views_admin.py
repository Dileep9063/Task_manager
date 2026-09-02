from datetime import datetime, timedelta, timezone

from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.db import query, query_one
from api.email_utils import generate_otp, send_email
from api.errors import ApiError
from api.notifications_helper import create_user_notification
from api.security import get_current_user, hash_password, require_admin
from api.support_helper import attach_thread

# NOTE: In the original Express app, most of these admin endpoints
# (dashboard, users, tasks, reports, notifications) were NOT protected by
# verifyToken/isAdmin middleware - only profile/system-settings/
# change-password/support routes were. That gap has been closed here:
# every admin endpoint now calls require_admin(request) up front, which
# validates the JWT and checks role == "admin" before doing anything else.


def _otp_expired(otp_expiry) -> bool:
    if otp_expiry is None:
        return True
    now = datetime.now(timezone.utc)
    if otp_expiry.tzinfo is None:
        otp_expiry = otp_expiry.replace(tzinfo=timezone.utc)
    return now > otp_expiry


# ================= Dashboard =================

@api_view(["GET"])
def get_dashboard_stats(request):
    require_admin(request)

    users = query_one("SELECT COUNT(*) FROM users WHERE LOWER(role)='user'")
    tasks = query_one("SELECT COUNT(*) FROM tasks")
    completed = query_one("SELECT COUNT(*) FROM tasks WHERE LOWER(status)='completed'")
    pending = query_one("SELECT COUNT(*) FROM tasks WHERE LOWER(status)='pending'")

    return Response({
        "totalUsers": int(users["count"]),
        "totalTasks": int(tasks["count"]),
        "completed": int(completed["count"]),
        "pending": int(pending["count"]),
    })


@api_view(["GET"])
def get_dashboard_data(request):
    require_admin(request)

    users = query_one("SELECT COUNT(*) FROM users WHERE LOWER(role)='user'")
    tasks = query_one("SELECT COUNT(*) FROM tasks")
    completed = query_one("SELECT COUNT(*) FROM tasks WHERE LOWER(status)='completed'")
    pending = query_one("SELECT COUNT(*) FROM tasks WHERE LOWER(status)='pending'")

    growth = query(
        """
        SELECT TO_CHAR(created_at,'Mon') AS month, COUNT(*)::INT AS users
        FROM users
        WHERE LOWER(role)='user'
        GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at,'Mon')
        ORDER BY EXTRACT(MONTH FROM created_at)
        """
    )

    recent_users = query(
        """
        SELECT id, name, created_at FROM users
        WHERE LOWER(role)='user'
        ORDER BY created_at DESC
        LIMIT 5
        """
    )

    recent_tasks = query(
        """
        SELECT id, title, status, created_at FROM tasks
        ORDER BY created_at DESC
        LIMIT 5
        """
    )

    activities = []
    for u in recent_users:
        activities.append({
            "id": u["id"],
            "entityType": "user",
            "message": f"{u['name']} registered",
            "time": u["created_at"],
        })

    for t in recent_tasks:
        message = f"{t['title']} completed" if (t["status"] or "").lower() == "completed" else f"{t['title']} created"
        activities.append({
            "id": t["id"],
            "entityType": "task",
            "message": message,
            "time": t["created_at"],
        })

    activities.sort(key=lambda a: a["time"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

    return Response({
        "totalUsers": int(users["count"]),
        "totalTasks": int(tasks["count"]),
        "completed": int(completed["count"]),
        "pending": int(pending["count"]),
        "monthlyGrowth": growth,
        "recentActivities": activities,
    })


# ================= Reports =================

@api_view(["GET"])
def get_reports(request):
    require_admin(request)

    users = query_one("SELECT COUNT(*) FROM users WHERE LOWER(role)='user'")
    tasks = query_one("SELECT COUNT(*) FROM tasks")
    completed = query_one("SELECT COUNT(*) FROM tasks WHERE LOWER(status)='completed'")
    pending = query_one("SELECT COUNT(*) FROM tasks WHERE LOWER(status)='pending'")

    return Response({
        "totalUsers": int(users["count"]),
        "totalTasks": int(tasks["count"]),
        "completedTasks": int(completed["count"]),
        "pendingTasks": int(pending["count"]),
    })


# ================= Users =================

@api_view(["GET"])
def get_all_users(request):
    require_admin(request)

    return Response(query(
        """
        SELECT id, name, email, role, created_at, status
        FROM users
        WHERE LOWER(role)='user'
        ORDER BY id ASC
        """
    ))


@api_view(["PUT"])
def mark_users_seen(request):
    require_admin(request)

    query(
        """
        UPDATE users SET is_seen_by_admin = true
        WHERE is_seen_by_admin = false AND LOWER(role)='user'
        """
    )
    return Response({"message": "Users marked as seen"})


@api_view(["PUT"])
def update_user_status(request, user_id: int):
    require_admin(request)

    new_status = request.data.get("status")
    row = query_one(
        "UPDATE users SET status=%s WHERE id=%s RETURNING id, name, email, status",
        (new_status, user_id),
    )
    return Response({"message": "User status updated successfully", "user": row})


@api_view(["DELETE"])
def delete_user(request, user_id: int):
    require_admin(request)

    query("DELETE FROM users WHERE id=%s", (user_id,))
    return Response({"message": "User deleted successfully"})


# ================= Tasks =================

@api_view(["GET"])
def get_all_tasks(request):
    require_admin(request)

    return Response(query(
        """
        SELECT
            tasks.id, tasks.title, tasks.description, tasks.status,
            tasks.due_date, tasks.created_at,
            users.name AS username, users.email
        FROM tasks
        JOIN users ON tasks.user_id = users.id
        ORDER BY tasks.id ASC
        """
    ))


@api_view(["PUT"])
def mark_tasks_seen(request):
    require_admin(request)

    query("UPDATE tasks SET is_seen_by_admin = true WHERE is_seen_by_admin = false")
    return Response({"message": "Tasks marked as seen"})


@api_view(["PUT", "DELETE"])
def admin_task_by_id(request, task_id: int):
    if request.method == "DELETE":
        return delete_task(request, task_id)
    return update_task(request, task_id)


def delete_task(request, task_id: int):
    require_admin(request)

    query("DELETE FROM tasks WHERE id=%s", (task_id,))
    return Response({"message": "Task deleted successfully"})


def update_task(request, task_id: int):
    require_admin(request)

    body = request.data
    row = query_one(
        """
        UPDATE tasks
        SET title=%s, description=%s, status=%s, due_date=%s
        WHERE id=%s
        RETURNING *
        """,
        (body.get("title"), body.get("description"), body.get("status"), body.get("due_date"), task_id),
    )
    return Response({"message": "Task updated successfully", "task": row})


# ================= Notifications =================

@api_view(["DELETE"])
def delete_notification(request, notification_id: int):
    require_admin(request)

    query("DELETE FROM notifications WHERE id=%s", (notification_id,))
    return Response({"message": "Notification deleted"})


@api_view(["GET"])
def get_notifications(request):
    require_admin(request)

    return Response(query(
        """
        SELECT id, type, title, message, is_read, created_at
        FROM notifications
        ORDER BY created_at DESC
        """
    ))


@api_view(["GET"])
def get_notification_counts(request):
    require_admin(request)

    users = query_one("SELECT COUNT(*) FROM users WHERE is_seen_by_admin = false AND LOWER(role)='user'")
    tasks = query_one("SELECT COUNT(*) FROM tasks WHERE is_seen_by_admin = false")
    notifications = query_one("SELECT COUNT(*) FROM notifications WHERE is_read = false")
    support = query_one("SELECT COUNT(*) FROM support_tickets WHERE LOWER(status) = 'submitted'")

    return Response({
        "users": int(users["count"]),
        "tasks": int(tasks["count"]),
        "notifications": int(notifications["count"]),
        "support": int(support["count"]),
    })


@api_view(["PUT"])
def mark_notifications_read(request):
    require_admin(request)

    query("UPDATE notifications SET is_read=true WHERE is_read=false")
    return Response({"message": "Notifications marked as read"})


# ================= Admin Profile =================

@api_view(["GET", "PUT"])
def admin_profile(request):
    if request.method == "PUT":
        return update_admin_profile(request)
    return get_admin_profile(request)


def get_admin_profile(request):
    admin = require_admin(request)

    row = query_one("SELECT id, name, email FROM users WHERE id = %s", (admin["id"],))
    if not row:
        raise ApiError(404, "Admin not found")
    return Response(row)


def update_admin_profile(request):
    admin = require_admin(request)
    body = request.data

    row = query_one(
        "UPDATE users SET name = %s, email = %s WHERE id = %s RETURNING id, name, email",
        (body.get("name"), body.get("email"), admin["id"]),
    )
    if not row:
        raise ApiError(404, "Admin not found")
    return Response({"message": "Profile updated successfully", "admin": row})


# ================= System Settings =================

@api_view(["GET", "PUT"])
def system_settings(request):
    if request.method == "PUT":
        return update_system_settings(request)
    return get_system_settings(request)


def get_system_settings(request):
    require_admin(request)

    row = query_one("SELECT allow_registration, maintenance_mode, updated_at FROM settings WHERE id=1")
    return Response(row)


def update_system_settings(request):
    require_admin(request)
    body = request.data

    row = query_one(
        """
        UPDATE settings
        SET allow_registration=%s, maintenance_mode=%s, updated_at=NOW()
        WHERE id=1
        RETURNING *
        """,
        (body.get("allow_registration"), body.get("maintenance_mode")),
    )
    return Response({"message": "System settings updated successfully", "settings": row})


# ================= Admin Change Password (OTP flow) =================

@api_view(["POST"])
def send_admin_change_password_otp(request):
    admin = require_admin(request)
    admin_id = admin["id"]
    email = request.data.get("email")

    row = query_one("SELECT id, email FROM users WHERE id = %s", (admin_id,))
    if not row:
        raise ApiError(404, "Admin not found")

    if email and email.lower() != (row.get("email") or "").lower():
        raise ApiError(400, "Email does not match your account.")

    otp = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    query("UPDATE users SET otp=%s, otp_expiry=%s WHERE id=%s", (otp, otp_expiry, admin_id))
    send_email(row["email"], "Task Manager - Change Password OTP", f"Your OTP is {otp}. It is valid for 10 minutes.")

    return Response({"message": "OTP sent successfully"})


@api_view(["PUT"])
def change_admin_password(request):
    admin = require_admin(request)
    admin_id = admin["id"]
    otp = request.data.get("otp")
    new_password = request.data.get("newPassword")

    if not otp or not new_password:
        raise ApiError(400, "OTP and new password are required.")

    if len(new_password) < 6:
        raise ApiError(400, "New password must be at least 6 characters.")

    row = query_one("SELECT otp, otp_expiry FROM users WHERE id = %s", (admin_id,))
    if not row:
        raise ApiError(404, "Admin not found")

    if not row.get("otp") or not row.get("otp_expiry"):
        raise ApiError(400, "Please request a new OTP.")

    if row.get("otp") != otp:
        raise ApiError(400, "Invalid OTP")

    if _otp_expired(row.get("otp_expiry")):
        raise ApiError(400, "OTP Expired")

    hashed = hash_password(new_password)
    query("UPDATE users SET password=%s, otp=NULL, otp_expiry=NULL WHERE id=%s", (hashed, admin_id))

    return Response({"message": "Password changed successfully"})


# ================= Support Tickets (Admin) =================

@api_view(["GET"])
def get_all_support_tickets(request):
    require_admin(request)

    tickets = query(
        """
        SELECT
            support_tickets.id, support_tickets.title, support_tickets.description,
            support_tickets.category, support_tickets.priority, support_tickets.status,
            support_tickets.created_at, support_tickets.updated_at,
            users.id AS user_id, users.name AS user_name, users.email AS user_email
        FROM support_tickets
        JOIN users ON support_tickets.user_id = users.id
        ORDER BY support_tickets.created_at DESC
        """
    )
    return Response([attach_thread(t) for t in tickets])


@api_view(["PATCH"])
def update_support_ticket(request, ticket_id: int):
    require_admin(request)
    body = request.data

    current = query_one("SELECT * FROM support_tickets WHERE id=%s", (ticket_id,))
    if not current:
        raise ApiError(404, "Ticket not found")

    row = query_one(
        """
        UPDATE support_tickets
        SET status=%s, priority=%s, updated_at=NOW()
        WHERE id=%s
        RETURNING *
        """,
        (body.get("status") or current["status"], body.get("priority") or current["priority"], ticket_id),
    )
    return Response({"message": "Ticket updated successfully", "ticket": row})


@api_view(["POST"])
def reply_support_ticket_as_admin(request, ticket_id: int):
    require_admin(request)
    message = request.data.get("message")

    if not message or message.strip() == "":
        raise ApiError(400, "Reply message cannot be empty.")

    ticket = query_one("SELECT * FROM support_tickets WHERE id=%s", (ticket_id,))
    if not ticket:
        raise ApiError(404, "Ticket not found")

    query(
        """
        INSERT INTO support_ticket_messages (ticket_id, sender_role, message, created_at)
        VALUES (%s, 'admin', %s, NOW())
        """,
        (ticket_id, message),
    )

    updated_ticket = query_one(
        "UPDATE support_tickets SET updated_at = NOW() WHERE id = %s RETURNING *",
        (ticket_id,),
    )

    create_user_notification(ticket["user_id"], f'Support replied to your ticket "{ticket["title"]}"')

    return Response({"message": "Reply sent", "ticket": attach_thread(updated_ticket)})
