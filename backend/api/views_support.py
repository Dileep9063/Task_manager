from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.db import query, query_one
from api.errors import ApiError
from api.notifications_helper import create_user_notification
from api.security import get_current_user
from api.support_helper import attach_thread


@api_view(["GET", "POST"])
def user_support_tickets(request):
    if request.method == "POST":
        return create_support_ticket(request)
    return get_user_support_tickets(request)


def get_user_support_tickets(request):
    user_id = get_current_user(request)["id"]

    tickets = query(
        """
        SELECT id, title, description, category, priority, status, created_at, updated_at
        FROM support_tickets
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,),
    )
    return Response([attach_thread(t) for t in tickets])


def create_support_ticket(request):
    user_id = get_current_user(request)["id"]
    body = request.data

    title = body.get("title")
    description = body.get("description")

    if not title or title.strip() == "":
        raise ApiError(400, "Title is required.")

    if not description or description.strip() == "":
        raise ApiError(400, "Please describe what happened.")

    ticket = query_one(
        """
        INSERT INTO support_tickets
            (user_id, title, description, category, priority, status, created_at, updated_at)
        VALUES
            (%s, %s, %s, %s, %s, 'submitted', NOW(), NOW())
        RETURNING *
        """,
        (user_id, title, description, body.get("category"), body.get("priority")),
    )

    create_user_notification(user_id, f'Your complaint "{ticket["title"]}" has been submitted')

    return Response(
        {"message": "Complaint raised successfully", "ticket": {**ticket, "thread": []}},
        status=201,
    )


@api_view(["POST"])
def reply_support_ticket(request, ticket_id: int):
    user_id = get_current_user(request)["id"]
    message = request.data.get("message")

    if not message or message.strip() == "":
        raise ApiError(400, "Reply message cannot be empty.")

    ticket = query_one(
        "SELECT * FROM support_tickets WHERE id = %s AND user_id = %s",
        (ticket_id, user_id),
    )
    if not ticket:
        raise ApiError(404, "Ticket not found")

    query(
        """
        INSERT INTO support_ticket_messages (ticket_id, sender_role, message, created_at)
        VALUES (%s, 'user', %s, NOW())
        """,
        (ticket_id, message),
    )

    updated_ticket = query_one(
        "UPDATE support_tickets SET updated_at = NOW() WHERE id = %s RETURNING *",
        (ticket_id,),
    )

    return Response({"message": "Reply sent", "ticket": attach_thread(updated_ticket)})
