"""
Tool functions exposed to the AI agent.

Each tool is a plain Python function that mirrors the same DB operations
used by the regular REST endpoints (see views_tasks.py / views_admin.py),
so the agent can never do anything a real user/admin couldn't already do
through the normal UI — it's just doing it via chat instead of clicks.

User-scoped tools always filter by the calling user's own user_id.
Admin-scoped tools operate globally and are only ever registered for
requests from an authenticated admin (see ai_agent.py).
"""

from api.db import query, query_one
from api.notifications_helper import create_user_notification


# ================= User-scoped tools =================

def user_list_tasks(user_id, status=None):
    if status:
        rows = query(
            """
            SELECT id, title, description, priority, status, due_date, created_at
            FROM tasks
            WHERE user_id = %s AND LOWER(status) = LOWER(%s)
            ORDER BY created_at DESC
            """,
            (user_id, status),
        )
    else:
        rows = query(
            """
            SELECT id, title, description, priority, status, due_date, created_at
            FROM tasks
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
    return {"tasks": rows, "count": len(rows)}


def user_create_task(user_id, title, description=None, priority=None, due_date=None):
    if not title or not title.strip():
        return {"error": "Task title is required."}

    task = query_one(
        """
        INSERT INTO tasks (user_id, title, description, priority, status, due_date, created_at, is_seen_by_admin)
        VALUES (%s, %s, %s, %s, 'Pending', %s, NOW(), false)
        RETURNING *
        """,
        (user_id, title, description, priority, due_date or None),
    )
    create_user_notification(user_id, f'New task "{task["title"]}" has been created')
    return {"task": task}


def user_update_task(user_id, task_id, title=None, description=None, priority=None, status=None, due_date=None):
    existing = query_one("SELECT * FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
    if not existing:
        return {"error": f"Task {task_id} not found for this user."}

    task = query_one(
        """
        UPDATE tasks
        SET title = COALESCE(%s, title),
            description = COALESCE(%s, description),
            priority = COALESCE(%s, priority),
            status = COALESCE(%s, status),
            due_date = COALESCE(%s, due_date),
            updated_at = NOW()
        WHERE id = %s AND user_id = %s
        RETURNING *
        """,
        (title, description, priority, status, due_date, task_id, user_id),
    )

    if status and existing.get("status", "").lower() != status.lower():
        if status.lower() == "completed":
            create_user_notification(user_id, f'Task "{task["title"]}" has been completed')
        else:
            create_user_notification(user_id, f'Task "{task["title"]}" status changed to {status}')

    return {"task": task}


def user_delete_task(user_id, task_id):
    result = query("DELETE FROM tasks WHERE id = %s AND user_id = %s RETURNING id, title", (task_id, user_id))
    if not result:
        return {"error": f"Task {task_id} not found for this user."}
    return {"deleted": result[0]}


def user_complete_task(user_id, task_id):
    return user_update_task(user_id, task_id, status="Completed")


def user_get_dashboard_summary(user_id):
    stats = query_one(
        """
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE LOWER(status) = 'completed') AS completed,
            COUNT(*) FILTER (WHERE LOWER(status) = 'pending') AS pending,
            COUNT(*) FILTER (WHERE LOWER(status) = 'in progress') AS in_progress
        FROM tasks
        WHERE user_id = %s
        """,
        (user_id,),
    )
    return {"stats": stats}


USER_TOOL_FUNCTIONS = {
    "list_tasks": user_list_tasks,
    "create_task": user_create_task,
    "update_task": user_update_task,
    "delete_task": user_delete_task,
    "complete_task": user_complete_task,
    "get_dashboard_summary": user_get_dashboard_summary,
}


# ================= Admin-scoped tools =================

def admin_list_users(status=None):
    if status:
        rows = query(
            "SELECT id, name, email, role, status, created_at FROM users WHERE LOWER(role)='user' AND LOWER(status)=LOWER(%s) ORDER BY id",
            (status,),
        )
    else:
        rows = query(
            "SELECT id, name, email, role, status, created_at FROM users WHERE LOWER(role)='user' ORDER BY id"
        )
    return {"users": rows, "count": len(rows)}


def admin_update_user_status(user_id, status):
    row = query_one(
        "UPDATE users SET status=%s WHERE id=%s RETURNING id, name, email, status",
        (status, user_id),
    )
    if not row:
        return {"error": f"User {user_id} not found."}
    return {"user": row}


def admin_delete_user(user_id):
    result = query("DELETE FROM users WHERE id=%s RETURNING id", (user_id,))
    if not result:
        return {"error": f"User {user_id} not found."}
    return {"deleted_user_id": user_id}


def admin_list_all_tasks(status=None):
    if status:
        rows = query(
            """
            SELECT tasks.id, tasks.title, tasks.status, tasks.due_date, tasks.created_at,
                   users.name AS username, users.email
            FROM tasks JOIN users ON tasks.user_id = users.id
            WHERE LOWER(tasks.status) = LOWER(%s)
            ORDER BY tasks.id DESC
            """,
            (status,),
        )
    else:
        rows = query(
            """
            SELECT tasks.id, tasks.title, tasks.status, tasks.due_date, tasks.created_at,
                   users.name AS username, users.email
            FROM tasks JOIN users ON tasks.user_id = users.id
            ORDER BY tasks.id DESC
            """
        )
    return {"tasks": rows, "count": len(rows)}


def admin_update_task(task_id, title=None, description=None, status=None, due_date=None):
    existing = query_one("SELECT * FROM tasks WHERE id=%s", (task_id,))
    if not existing:
        return {"error": f"Task {task_id} not found."}

    row = query_one(
        """
        UPDATE tasks
        SET title = COALESCE(%s, title),
            description = COALESCE(%s, description),
            status = COALESCE(%s, status),
            due_date = COALESCE(%s, due_date)
        WHERE id=%s
        RETURNING *
        """,
        (title, description, status, due_date, task_id),
    )
    return {"task": row}


def admin_delete_task(task_id):
    result = query("DELETE FROM tasks WHERE id=%s RETURNING id, title", (task_id,))
    if not result:
        return {"error": f"Task {task_id} not found."}
    return {"deleted": result[0]}


def admin_get_stats():
    users = query_one("SELECT COUNT(*) FROM users WHERE LOWER(role)='user'")
    tasks = query_one("SELECT COUNT(*) FROM tasks")
    completed = query_one("SELECT COUNT(*) FROM tasks WHERE LOWER(status)='completed'")
    pending = query_one("SELECT COUNT(*) FROM tasks WHERE LOWER(status)='pending'")
    return {
        "totalUsers": int(users["count"]),
        "totalTasks": int(tasks["count"]),
        "completed": int(completed["count"]),
        "pending": int(pending["count"]),
    }


ADMIN_TOOL_FUNCTIONS = {
    "list_users": admin_list_users,
    "update_user_status": admin_update_user_status,
    "delete_user": admin_delete_user,
    "list_all_tasks": admin_list_all_tasks,
    "update_task_admin": admin_update_task,
    "delete_task_admin": admin_delete_task,
    "get_admin_stats": admin_get_stats,
}
