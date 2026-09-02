from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.db import query, query_one
from api.errors import ApiError
from api.notifications_helper import create_user_notification
from api.security import get_current_user


# ================= Create Task =================

@api_view(["POST"])
def create_task(request):
    user_id = get_current_user(request)["id"]
    body = request.data

    task = query_one(
        """
        INSERT INTO tasks
            (user_id, title, description, priority, status, due_date, created_at)
        VALUES
            (%s, %s, %s, %s, 'Pending', %s, NOW())
        RETURNING *
        """,
        (user_id, body.get("title"), body.get("description"), body.get("priority"), body.get("dueDate")),
    )

    create_user_notification(user_id, f'New task "{task["title"]}" has been created')

    return Response({"message": "Task created successfully", "task": task}, status=201)


# ================= Get User Tasks =================

@api_view(["GET"])
def get_user_tasks(request):
    user_id = get_current_user(request)["id"]

    rows = query(
        """
        SELECT id, title, description, priority, due_date, status, user_id
        FROM tasks
        WHERE user_id = %s
        ORDER BY id DESC
        """,
        (user_id,),
    )
    return Response(rows)


# ================= Update Task =================

@api_view(["PUT", "DELETE"])
def task_by_id(request, task_id: int):
    if request.method == "DELETE":
        return delete_task(request, task_id)
    return update_task(request, task_id)


def update_task(request, task_id: int):
    user_id = get_current_user(request)["id"]
    body = request.data

    old_task = query_one(
        "SELECT id, title, status FROM tasks WHERE id = %s AND user_id = %s",
        (task_id, user_id),
    )
    if not old_task:
        raise ApiError(404, "Task not found")

    status = body.get("status")
    updated_task = query_one(
        """
        UPDATE tasks
        SET title = %s, description = %s, priority = %s, status = %s, due_date = %s, updated_at = NOW()
        WHERE id = %s AND user_id = %s
        RETURNING *
        """,
        (body.get("title"), body.get("description"), body.get("priority"), status, body.get("due_date"), task_id, user_id),
    )

    if old_task.get("status") and status and old_task["status"].lower() != status.lower():
        if status.lower() == "completed":
            create_user_notification(user_id, f'Task "{updated_task["title"]}" has been completed')
        else:
            create_user_notification(user_id, f'Task "{updated_task["title"]}" status changed to {status}')

    return Response({"message": "Task updated successfully", "task": updated_task})


# ================= Delete Task =================

def delete_task(request, task_id: int):
    user_id = get_current_user(request)["id"]

    result = query(
        "DELETE FROM tasks WHERE id = %s AND user_id = %s RETURNING *",
        (task_id, user_id),
    )
    if not result:
        raise ApiError(404, "Task not found")

    return Response({"message": "Task deleted successfully"})


# ================= Update Task Status (mark completed) =================

@api_view(["PATCH"])
def update_task_status(request, task_id: int):
    user_id = get_current_user(request)["id"]

    old_task = query_one(
        "SELECT id, title, status FROM tasks WHERE id = %s AND user_id = %s",
        (task_id, user_id),
    )
    if not old_task:
        raise ApiError(404, "Task not found")

    task = query_one(
        """
        UPDATE tasks
        SET status = 'Completed', updated_at = NOW()
        WHERE id = %s AND user_id = %s
        RETURNING *
        """,
        (task_id, user_id),
    )

    if (old_task.get("status") or "").lower() != "completed":
        create_user_notification(user_id, f'Task "{task["title"]}" has been completed')

    return Response(task)


# ================= Completed Tasks =================

@api_view(["GET"])
def get_completed_tasks(request):
    user_id = get_current_user(request)["id"]

    rows = query(
        """
        SELECT id, title, description, priority, status, due_date, created_at, updated_at
        FROM tasks
        WHERE user_id = %s AND LOWER(status) = 'completed'
        ORDER BY updated_at DESC
        """,
        (user_id,),
    )
    return Response(rows)


# ================= Reports =================

@api_view(["GET"])
def get_user_report_tasks(request):
    user_id = get_current_user(request)["id"]

    rows = query(
        """
        SELECT id, title, description, priority, status, created_at, due_date
        FROM tasks
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,),
    )
    return Response(rows)
