"""OpenAI-compatible tool (function) schemas for the AI agent, by role.

NOTE: Groq's strict tool-call schema validation rejects `null` for a plain
`"type": "string"` field. When the model chooses to omit an optional
argument, it sometimes still sends it explicitly as `null` rather than
leaving the key out entirely — so every OPTIONAL (non-required) property
below is typed as `["string", "null"]` (or `["integer", "null"]`) instead
of a bare `"string"`/`"integer"`. Required properties are left as-is since
the model must always supply a real value for those.
"""

USER_TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "List the current user's tasks, optionally filtered by status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": ["string", "null"],
                        "description": "Filter by status, e.g. 'Pending', 'In Progress', 'Completed'. Omit or pass null to list all tasks.",
                    }
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a new task for the current user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Short task title."},
                    "description": {"type": ["string", "null"], "description": "Optional longer description."},
                    "priority": {"type": ["string", "null"], "description": "Low, Medium, or High."},
                    "due_date": {"type": ["string", "null"], "description": "ISO date YYYY-MM-DD, optional."},
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update an existing task belonging to the current user. Only provide fields that should change.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "ID of the task to update."},
                    "title": {"type": ["string", "null"]},
                    "description": {"type": ["string", "null"]},
                    "priority": {"type": ["string", "null"], "description": "Low, Medium, or High."},
                    "status": {"type": ["string", "null"], "description": "Pending, In Progress, or Completed."},
                    "due_date": {"type": ["string", "null"], "description": "ISO date YYYY-MM-DD."},
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Permanently delete a task belonging to the current user.",
            "parameters": {
                "type": "object",
                "properties": {"task_id": {"type": "integer"}},
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": "Mark a task as Completed.",
            "parameters": {
                "type": "object",
                "properties": {"task_id": {"type": "integer"}},
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_dashboard_summary",
            "description": "Get the current user's task counts (total, completed, pending, in progress).",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


ADMIN_TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "list_users",
            "description": "List all regular (non-admin) users, optionally filtered by status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": ["string", "null"],
                        "description": "'active' or 'blocked'. Omit or pass null for all users.",
                    }
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_user_status",
            "description": "Block or unblock a user account.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "integer"},
                    "status": {"type": "string", "description": "'active' or 'blocked'."},
                },
                "required": ["user_id", "status"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_user",
            "description": "Permanently delete a user account and all their data. Destructive — only do this when clearly asked.",
            "parameters": {
                "type": "object",
                "properties": {"user_id": {"type": "integer"}},
                "required": ["user_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_all_tasks",
            "description": "List tasks across all users, optionally filtered by status.",
            "parameters": {
                "type": "object",
                "properties": {"status": {"type": ["string", "null"]}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_task_admin",
            "description": "Update any user's task (admin override). Only provide fields that should change.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer"},
                    "title": {"type": ["string", "null"]},
                    "description": {"type": ["string", "null"]},
                    "status": {"type": ["string", "null"]},
                    "due_date": {"type": ["string", "null"], "description": "ISO date YYYY-MM-DD."},
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task_admin",
            "description": "Permanently delete any user's task.",
            "parameters": {
                "type": "object",
                "properties": {"task_id": {"type": "integer"}},
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_admin_stats",
            "description": "Get overall system stats: total users, total tasks, completed, pending.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]