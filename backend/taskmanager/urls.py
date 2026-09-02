from django.http import HttpResponse, JsonResponse
from django.urls import include, path

from api.db import check_connection


def home(request):
    return HttpResponse("Task Manager Backend Running...")


def status(request):
    try:
        check_connection()
        return JsonResponse({"success": True, "message": "Database Connected"})
    except Exception as err:
        print(err)
        return JsonResponse({"success": False, "message": "Database Not Connected"}, status=500)


urlpatterns = [
    path("", home),
    path("api/status", status),
    path("", include("api.urls")),
]
