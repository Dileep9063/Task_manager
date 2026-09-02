from django.urls import path

from api import (
    views_admin,
    views_ai,
    views_auth,
    views_notifications,
    views_support,
    views_tasks,
    views_user,
)

urlpatterns = [
    # ================= Auth (was authRoutes.js) =================
    path("api/auth/register", views_auth.register),
    path("api/auth/login", views_auth.login),
    path("api/auth/google", views_auth.google_auth),
    path("api/auth/forgot-password", views_auth.forgot_password),
    path("api/auth/verify-otp", views_auth.verify_otp),
    path("api/auth/reset-password", views_auth.reset_password),
    path("api/auth/send-change-password-otp", views_auth.send_change_password_otp),
    path("api/auth/change-password", views_auth.change_password_with_otp),

    # ================= Tasks (was taskRoutes.js) =================
    path("api/tasks", views_tasks.create_task),
    path("api/tasks/user", views_tasks.get_user_tasks),
    path("api/tasks/completed", views_tasks.get_completed_tasks),
    path("api/tasks/reports", views_tasks.get_user_report_tasks),
    path("api/tasks/<int:task_id>", views_tasks.task_by_id),  # PUT + DELETE
    path("api/tasks/<int:task_id>/status", views_tasks.update_task_status),

    # ================= Notifications (was notificationRoutes.js) =================
    path("api/notifications", views_notifications.get_user_notifications),

    # ================= User (was UserRoutes.js) =================
    path("api/user/dashboard", views_user.get_user_dashboard),
    path("api/user/tasks", views_user.user_tasks),  # GET + POST
    path("api/user/notifications", views_user.get_user_notifications),
    path("api/user/notifications/read-all", views_user.mark_all_notifications_read),
    path("api/user/notifications/<int:notification_id>/read", views_user.mark_notification_read),
    path("api/user/notifications/<int:notification_id>", views_user.delete_notification),
    path("api/user/test", views_user.test_route),
    path("api/user/route-test", views_user.route_test),
    path("api/user/profile", views_user.user_profile),  # GET + PUT
    path("api/user/change-password", views_user.change_user_password),
    path("api/user/account", views_user.delete_user_account),
    path("api/user/export", views_user.export_user_data),

    # ================= User Support (was Supportroutes.js) =================
    path("api/user/support/tickets", views_support.user_support_tickets),  # GET + POST
    path("api/user/support/tickets/<int:ticket_id>/reply", views_support.reply_support_ticket),

    # ================= Admin (was adminController.js / adminRoutes.js) =================
    path("api/admin/stats", views_admin.get_dashboard_stats),
    path("api/admin/dashboard", views_admin.get_dashboard_data),
    path("api/admin/reports", views_admin.get_reports),

    path("api/admin/users", views_admin.get_all_users),
    path("api/admin/users/seen", views_admin.mark_users_seen),
    path("api/admin/users/<int:user_id>/status", views_admin.update_user_status),
    path("api/admin/users/<int:user_id>", views_admin.delete_user),

    path("api/admin/tasks", views_admin.get_all_tasks),
    path("api/admin/tasks/seen", views_admin.mark_tasks_seen),
    path("api/admin/tasks/<int:task_id>", views_admin.admin_task_by_id),  # PUT + DELETE

    path("api/admin/notifications", views_admin.get_notifications),
    path("api/admin/notifications/read", views_admin.mark_notifications_read),
    path("api/admin/notifications/<int:notification_id>", views_admin.delete_notification),
    path("api/admin/notification-counts", views_admin.get_notification_counts),

    path("api/admin/profile", views_admin.admin_profile),  # GET + PUT

    path("api/admin/system-settings", views_admin.system_settings),  # GET + PUT

    path("api/admin/send-change-password-otp", views_admin.send_admin_change_password_otp),
    path("api/admin/change-password", views_admin.change_admin_password),

    path("api/admin/support/tickets", views_admin.get_all_support_tickets),
    path("api/admin/support/tickets/<int:ticket_id>", views_admin.update_support_ticket),
    path("api/admin/support/tickets/<int:ticket_id>/reply", views_admin.reply_support_ticket_as_admin),

    # ================= AI Assistant =================
    path("api/user/ai/chat", views_ai.user_ai_chat),
    path("api/admin/ai/chat", views_ai.admin_ai_chat),
]
