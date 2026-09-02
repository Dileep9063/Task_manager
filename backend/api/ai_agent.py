import json

import requests
from django.conf import settings

from api.ai_tool_schemas import ADMIN_TOOL_SCHEMAS, USER_TOOL_SCHEMAS
from api.ai_tools import ADMIN_TOOL_FUNCTIONS, USER_TOOL_FUNCTIONS
from api.errors import ApiError

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

MAX_TOOL_ITERATIONS = 6
MAX_HISTORY_MESSAGES = 20

USER_SYSTEM_PROMPT = """You are the in-app task assistant for a Task Manager application, \
talking to a regular (non-admin) user. You can view, create, update, complete, and delete \
THIS USER's own tasks using the tools provided — you cannot see or affect other users' data.

Guidelines:
- Take action directly using the tools when the user asks you to (e.g. "create a task to
  buy groceries tomorrow" -> just create it, don't ask for confirmation for routine actions).
- For destructive actions (delete_task) where the user's intent is ambiguous (e.g. "delete
  my tasks" with no specifics), ask a brief clarifying question first instead of guessing.
- Always resolve relative dates ("tomorrow", "next Friday") to an actual ISO date
  (YYYY-MM-DD) before calling a tool — figure out the date yourself from context, don't ask
  the user to spell it out.
- After acting, reply with a short, friendly confirmation of what you did (not a raw dump of
  tool output).
- If asked something outside task management, politely redirect to what you can help with.
- Keep replies concise — a sentence or two, plus a short list only when it genuinely helps.
"""

ADMIN_SYSTEM_PROMPT = """You are the in-app admin assistant for a Task Manager application, \
talking to an administrator. You can view and manage ALL users and ALL tasks in the system \
using the tools provided.

Guidelines:
- Take action directly using the tools for routine requests (e.g. "block user 5" -> just do
  it).
- For irreversible, high-impact actions (delete_user, delete_task_admin) where intent is
  ambiguous or broad (e.g. "delete all blocked users"), ask a brief clarifying question and
  confirm scope before proceeding, since these actions cannot be undone.
- Always resolve relative dates to an actual ISO date (YYYY-MM-DD) yourself.
- After acting, reply with a short, clear confirmation of what changed (not a raw data dump).
- Keep replies concise.
"""


def _extract_upstream_error(response) -> str:
    """Pull the most useful error detail out of a non-OK Groq response body,
    falling back to raw text if it isn't JSON (or has an unexpected shape)."""
    try:
        body = response.json()
        # Groq (OpenAI-compatible) error shape: {"error": {"message": "...", "type": "...", "code": "..."}}
        err = body.get("error")
        if isinstance(err, dict) and err.get("message"):
            return err["message"]
        return json.dumps(body)
    except (ValueError, AttributeError):
        return (response.text or "")[:500]


def _call_groq(messages, tools):
    if not settings.GROQ_API_KEY:
        raise ApiError(
            503,
            "AI assistant is not configured. Set GROQ_API_KEY in the backend .env "
            "(get a free key at https://console.groq.com) to enable it.",
        )

    try:
        response = requests.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.GROQ_MODEL,
                "messages": messages,
                "tools": tools,
                "tool_choice": "auto",
                "temperature": 0.3,
            },
            timeout=30,
        )
    except requests.exceptions.RequestException as e:
        raise ApiError(502, f"AI assistant could not reach Groq: {e}")

    if response.status_code == 401:
        raise ApiError(503, "AI assistant rejected the configured GROQ_API_KEY. Check the key is valid.")
    if response.status_code == 429:
        raise ApiError(429, "AI assistant is rate-limited right now. Please try again in a moment.")
    if not response.ok:
        detail = _extract_upstream_error(response)
        raise ApiError(502, f"AI assistant upstream error ({response.status_code}): {detail}")

    return response.json()


def run_agent(history, role, actor_id):
    """
    history: list of {"role": "user"|"assistant", "content": str} from the frontend
             (system/tool messages are added internally, not passed in).
    role: "admin" or "user"
    actor_id: the calling user's id (used to scope user-side tools)
    Returns: {"reply": str, "actions": [ {tool, arguments, result}, ... ]}
    """

    is_admin = role == "admin"
    tool_schemas = ADMIN_TOOL_SCHEMAS if is_admin else USER_TOOL_SCHEMAS
    tool_functions = ADMIN_TOOL_FUNCTIONS if is_admin else USER_TOOL_FUNCTIONS
    system_prompt = ADMIN_SYSTEM_PROMPT if is_admin else USER_SYSTEM_PROMPT

    trimmed_history = history[-MAX_HISTORY_MESSAGES:]
    messages = [{"role": "system", "content": system_prompt}] + [
        {"role": m["role"], "content": m["content"]} for m in trimmed_history
    ]

    actions_taken = []

    for _ in range(MAX_TOOL_ITERATIONS):
        data = _call_groq(messages, tool_schemas)

        choice = data["choices"][0]
        message = choice["message"]
        tool_calls = message.get("tool_calls")

        if not tool_calls:
            return {"reply": message.get("content") or "", "actions": actions_taken}

        # The assistant's tool-call message must be included before the tool results.
        messages.append(message)

        for call in tool_calls:
            fn_name = call["function"]["name"]
            try:
                fn_args = json.loads(call["function"]["arguments"] or "{}")
            except json.JSONDecodeError:
                fn_args = {}

            fn = tool_functions.get(fn_name)

            if fn is None:
                result = {"error": f"Unknown tool '{fn_name}'."}
            else:
                try:
                    if is_admin:
                        result = fn(**fn_args)
                    else:
                        result = fn(actor_id, **fn_args)
                except TypeError as e:
                    result = {"error": f"Invalid arguments for {fn_name}: {e}"}
                except Exception as e:
                    result = {"error": f"Tool '{fn_name}' failed: {e}"}

            actions_taken.append({"tool": fn_name, "arguments": fn_args, "result": result})

            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "content": json.dumps(result, default=str),
                }
            )

    return {
        "reply": "I took several actions but hit my step limit before finishing — here's what I did so far.",
        "actions": actions_taken,
    }