from rest_framework.views import exception_handler


def express_style_exception_handler(exc, context):
    """Make DRF error responses look like Express's `{ message: "..." }`
    shape, since the React frontend reads `err.response.data.message`."""
    response = exception_handler(exc, context)

    if response is not None:
        detail = response.data
        if isinstance(detail, dict) and "detail" in detail and len(detail) == 1:
            response.data = {"message": str(detail["detail"])}
        elif isinstance(detail, dict) and "message" not in detail:
            response.data = {"message": detail}
        elif isinstance(detail, list):
            response.data = {"message": str(detail[0]) if detail else "Error"}

    return response
