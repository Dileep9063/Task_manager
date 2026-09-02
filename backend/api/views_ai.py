from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.ai_agent import run_agent
from api.errors import ApiError
from api.ratelimit import rate_limit
from api.security import get_current_user, require_admin


def _validate_history(body):
    history = body.get("messages")
    if not isinstance(history, list) or not history:
        raise ApiError(400, "A non-empty 'messages' array is required.")

    cleaned = []
    for m in history:
        if not isinstance(m, dict) or m.get("role") not in ("user", "assistant") or "content" not in m:
            raise ApiError(400, "Each message must have role 'user' or 'assistant' and a 'content' string.")
        cleaned.append({"role": m["role"], "content": str(m["content"])[:4000]})

    return cleaned


@api_view(["POST"])
@rate_limit("ai-chat-user", limit=30, window_seconds=3600)
def user_ai_chat(request):
    user = get_current_user(request)
    history = _validate_history(request.data)

    result = run_agent(history, role="user", actor_id=user["id"])
    return Response(result)


@api_view(["POST"])
@rate_limit("ai-chat-admin", limit=30, window_seconds=3600)
def admin_ai_chat(request):
    admin = require_admin(request)
    history = _validate_history(request.data)

    result = run_agent(history, role="admin", actor_id=admin["id"])
    return Response(result)
