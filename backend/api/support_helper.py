from datetime import datetime, timezone

from api.db import query


def format_relative_time(dt) -> str:
    """Mirrors formatRelativeTime() in supportController.js."""
    if dt is None:
        return ""

    if isinstance(dt, str):
        message_date = datetime.fromisoformat(dt)
    else:
        message_date = dt

    if message_date.tzinfo is None:
        message_date = message_date.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    difference = (now - message_date).total_seconds()

    if difference < 60:
        return "Just now"
    if difference < 3600:
        return f"{int(difference // 60)} minutes ago"
    if difference < 86400:
        return f"{int(difference // 3600)} hours ago"
    if difference < 172800:
        return "Yesterday"

    return message_date.strftime("%m/%d/%Y")


def attach_thread(ticket: dict) -> dict:
    """Mirrors attachThread() in supportController.js."""
    messages = query(
        """
        SELECT sender_role, message, created_at
        FROM support_ticket_messages
        WHERE ticket_id = %s
        ORDER BY created_at ASC
        """,
        (ticket["id"],),
    )

    thread = [
        {
            "from": row["sender_role"],
            "text": row["message"],
            "time": format_relative_time(row["created_at"]),
        }
        for row in messages
    ]

    return {**ticket, "thread": thread}
