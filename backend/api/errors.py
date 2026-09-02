from rest_framework.exceptions import APIException


class ApiError(APIException):
    """Raise this anywhere in a view to short-circuit with a given HTTP
    status code and message, e.g. `raise ApiError(404, "Task not found")`."""

    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        super().__init__(detail=message)
