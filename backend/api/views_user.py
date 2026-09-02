from datetime import date, datetime

from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.db import atomic, query, query_one
from api.errors import ApiError
from api.notifications_helper import create_user_notification
from api.security import get_current_user, hash_password, verify_password


# ================= User Dashboard =================

@api_view(["GET"])
def get_user_dashboard(request):
    user_id = get_current_user(request)["id"]

    user_row = query_one("SELECT name, email FROM users WHERE id = %s", (user_id,))

    stats = query_one(
        """
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER(WHERE LOWER(status) = 'completed') AS completed,
            COUNT(*) FILTER(WHERE LOWER(status) = 'pending') AS pending,
            COUNT(*) FILTER(WHERE LOWER(status) = 'in progress') AS progress
        FROM tasks
        WHERE user_id = %s
        """,
        (user_id,),
    )

    recent_tasks = query(
        """
        SELECT id, title, description, status, priority, due_date, created_at
        FROM tasks
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 5
        """,
        (user_id,),
    )

    return Response({"user": user_row, "stats": stats, "recentTasks": recent_tasks})


# ================= Get User Tasks =================

@api_view(["GET", "POST"])
def user_tasks(request):
    if request.method == "POST":
        return create_task(request)
    return get_user_tasks(request)


def get_user_tasks(request):
    user_id = get_current_user(request)["id"]

    rows = query(
        """
        SELECT id, title, description, priority, status, due_date, created_at
        FROM tasks
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,),
    )
    return Response(rows)


# ================= Create Task =================

def create_task(request):
    user_id = get_current_user(request)["id"]
    body = request.data

    title = body.get("title")
    due_date = body.get("dueDate")

    if not title or title.strip() == "":
        raise ApiError(400, "Task title is required.")

    if due_date:
        try:
            selected = datetime.fromisoformat(str(due_date).replace("Z", "")).date()
        except ValueError:
            selected = None

        if selected is not None and selected < date.today():
            raise ApiError(400, "Due date cannot be in the past.")

    task = query_one(
        """
        INSERT INTO tasks
            (user_id, title, description, priority, status, due_date, created_at, is_seen_by_admin)
        VALUES
            (%s, %s, %s, %s, 'Pending', %s, NOW(), false)
        RETURNING *
        """,
        (user_id, title, body.get("description"), body.get("priority"), due_date or None),
    )

    create_user_notification(user_id, f'New task "{task["title"]}" has been created')

    return Response({"success": True, "message": "Task created successfully", "task": task}, status=201)


# ================= Notifications =================

@api_view(["GET"])
def get_user_notifications(request):
    user_id = get_current_user(request)["id"]

    rows = query(
        """
        SELECT id, message, is_read, created_at
        FROM user_notifications
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,),
    )
    return Response(rows)


@api_view(["PATCH"])
def mark_notification_read(request, notification_id: int):
    user_id = get_current_user(request)["id"]

    query(
        "UPDATE user_notifications SET is_read = true WHERE id = %s AND user_id = %s",
        (notification_id, user_id),
    )
    return Response({"message": "Notification marked as read"})


@api_view(["DELETE"])
def delete_notification(request, notification_id: int):
    user_id = get_current_user(request)["id"]

    result = query(
        "DELETE FROM user_notifications WHERE id = %s AND user_id = %s RETURNING id",
        (notification_id, user_id),
    )
    if not result:
        raise ApiError(404, "Notification not found")
    return Response({"message": "Notification deleted successfully"})


@api_view(["PATCH"])
def mark_all_notifications_read(request):
    user_id = get_current_user(request)["id"]

    query(
        "UPDATE user_notifications SET is_read = true WHERE user_id = %s AND is_read = false",
        (user_id,),
    )
    return Response({"message": "All notifications marked as read"})


# ================= Test Routes =================

@api_view(["GET"])
def test_route(request):
    return Response({"message": "User route working"})


@api_view(["GET"])
def route_test(request):
    return Response({"message": "USER ROUTES ARE LOADED"})


# ================= Profile =================

@api_view(["GET", "PUT"])
def user_profile(request):
    if request.method == "PUT":
        return update_user_profile(request)
    return get_user_profile(request)


def get_user_profile(request):
    user_id = get_current_user(request)["id"]

    row = query_one(
        "SELECT id, name, email, role, phone, address FROM users WHERE id = %s",
        (user_id,),
    )
    if not row:
        raise ApiError(404, "User not found")
    return Response(row)


def update_user_profile(request):
    user_id = get_current_user(request)["id"]
    body = request.data

    row = query_one(
        """
        UPDATE users
        SET name = %s, phone = %s, address = %s
        WHERE id = %s
        RETURNING id, name, email, role, phone, address
        """,
        (body.get("name"), body.get("phone"), body.get("address"), user_id),
    )
    if not row:
        raise ApiError(404, "User not found")
    return Response({"message": "Profile updated successfully", "user": row})


# ================= Change Password =================

@api_view(["PUT"])
def change_user_password(request):
    user_id = get_current_user(request)["id"]
    current_password = request.data.get("currentPassword")
    new_password = request.data.get("newPassword")

    if not current_password or not new_password:
        raise ApiError(400, "Current password and new password are required.")

    if len(new_password) < 6:
        raise ApiError(400, "New password must be at least 6 characters.")

    row = query_one("SELECT password FROM users WHERE id = %s", (user_id,))
    if not row:
        raise ApiError(404, "User not found.")

    if not verify_password(current_password, row.get("password") or ""):
        raise ApiError(401, "Current password is incorrect.")

    hashed = hash_password(new_password)
    updated = query_one("UPDATE users SET password = %s WHERE id = %s RETURNING id", (hashed, user_id))
    if not updated:
        raise ApiError(404, "Password could not be updated.")

    return Response({"message": "Password changed successfully."})


# ================= Delete Account =================

@api_view(["DELETE"])
def delete_user_account(request):
    user_id = get_current_user(request)["id"]

    try:
        with atomic():
            query("DELETE FROM tasks WHERE user_id = %s", (user_id,))
            query("DELETE FROM user_notifications WHERE user_id = %s", (user_id,))
            result = query("DELETE FROM users WHERE id = %s RETURNING id", (user_id,))

            if not result:
                raise ApiError(404, "User not found.")
    except ApiError:
        raise
    except Exception as error:
        print("Delete Account Error:", error)
        raise ApiError(500, "Internal Server Error")

    return Response({"message": "Account and all associated data deleted successfully."})


# ================= Export User Data (PDF) =================

@api_view(["GET"])
def export_user_data(request):
    from api.pdf_export import build_user_export_pdf

    user_id = get_current_user(request)["id"]

    user_row = query_one(
        "SELECT id, name, email, role, phone, address FROM users WHERE id = %s",
        (user_id,),
    )
    if not user_row:
        raise ApiError(404, "User not found")

    tasks = query(
        """
        SELECT id, title, description, priority, status, due_date, created_at
        FROM tasks
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,),
    )

    notifications = query(
        """
        SELECT id, message, is_read, created_at
        FROM user_notifications
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,),
    )

    pdf_bytes = build_user_export_pdf(user_row, tasks, notifications)

    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="user-data-export-{user_id}.pdf"'
    return response
