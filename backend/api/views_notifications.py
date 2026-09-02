from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.db import query
from api.security import get_current_user


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
