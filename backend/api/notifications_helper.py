from api.db import query


def create_user_notification(user_id: int, message: str):
    """Mirrors createUserNotification() in userController.js / notificationController.js."""
    try:
        query(
            """
            INSERT INTO user_notifications (user_id, message, is_read)
            VALUES (%s, %s, false)
            """,
            (user_id, message),
        )
    except Exception as error:
        print("Notification Error:", error)
