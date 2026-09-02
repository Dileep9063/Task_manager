import io
from collections import Counter
from datetime import datetime

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
)


def _status_of(task):
    return (task.get("status") or "").lower()


def _priority_of(task):
    return (task.get("priority") or "").lower()


def _doughnut(labels, values, colors_, title):
    fig, ax = plt.subplots(figsize=(3.4, 2.6))
    if sum(values) == 0:
        values = [1]
        labels = ["No data"]
        colors_ = ["#e5e7eb"]
    ax.pie(values, labels=labels, colors=colors_, wedgeprops=dict(width=0.45), autopct="%1.0f%%", textprops={"fontsize": 7})
    ax.set_title(title, fontsize=10)
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=150)
    plt.close(fig)
    buf.seek(0)
    return buf


def _bar(labels, values, title):
    fig, ax = plt.subplots(figsize=(3.4, 2.6))
    ax.bar(labels, values, color="#3b82f6")
    ax.set_title(title, fontsize=10)
    ax.tick_params(axis="x", labelsize=7)
    ax.tick_params(axis="y", labelsize=7)
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=150)
    plt.close(fig)
    buf.seek(0)
    return buf


def build_user_export_pdf(user: dict, tasks: list, notifications: list) -> bytes:
    total_tasks = len(tasks)
    completed = sum(1 for t in tasks if _status_of(t) == "completed")
    pending = sum(1 for t in tasks if _status_of(t) == "pending")
    progress = sum(1 for t in tasks if _status_of(t) == "in progress")
    high = sum(1 for t in tasks if _priority_of(t) == "high")
    medium = sum(1 for t in tasks if _priority_of(t) == "medium")
    low = sum(1 for t in tasks if _priority_of(t) == "low")

    month_count = Counter()
    for t in tasks:
        created = t.get("created_at")
        if created:
            if isinstance(created, str):
                try:
                    created = datetime.fromisoformat(created)
                except ValueError:
                    created = None
            if created:
                month_count[created.strftime("%b")] += 1

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=50, bottomMargin=50, leftMargin=50, rightMargin=50)
    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle("TitleCenter", parent=styles["Title"], alignment=1)
    small_gray = ParagraphStyle("SmallGray", parent=styles["Normal"], alignment=1, textColor=colors.gray, fontSize=9)

    elements.append(Paragraph("My Data Export", title_style))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", small_gray))
    elements.append(Spacer(1, 20))

    # ---------------- Profile ----------------
    elements.append(Paragraph("Profile", styles["Heading2"]))
    elements.append(Spacer(1, 6))
    for label, value in [
        ("Name", user.get("name")),
        ("Email", user.get("email")),
        ("Role", user.get("role")),
        ("Phone", user.get("phone")),
        ("Address", user.get("address")),
    ]:
        elements.append(Paragraph(f"<b>{label}:</b> {value or '-'}", styles["Normal"]))
    elements.append(Spacer(1, 20))

    # ---------------- Report / Charts ----------------
    elements.append(Paragraph("Report", styles["Heading2"]))
    elements.append(Spacer(1, 6))

    status_img = _doughnut(
        ["Pending", "In Progress", "Completed"],
        [pending, progress, completed],
        ["#f59e0b", "#3b82f6", "#22c55e"],
        "Task Status",
    )
    priority_img = _doughnut(
        ["Low", "Medium", "High"],
        [low, medium, high],
        ["#22c55e", "#f59e0b", "#ef4444"],
        "Task Priority",
    )
    completion_img = _doughnut(
        ["Completed", "Remaining"],
        [completed, max(total_tasks - completed, 0)],
        ["#22c55e", "#94a3b8"],
        "Completion Rate",
    )

    chart_row1 = [Image(status_img, width=2.4 * inch, height=1.8 * inch), Image(priority_img, width=2.4 * inch, height=1.8 * inch)]

    if month_count:
        monthly_img = _bar(list(month_count.keys()), list(month_count.values()), "Monthly Task Creation")
        chart_row2 = [Image(completion_img, width=2.4 * inch, height=1.8 * inch), Image(monthly_img, width=2.4 * inch, height=1.8 * inch)]
    else:
        chart_row2 = [Image(completion_img, width=2.4 * inch, height=1.8 * inch), ""]

    elements.append(Table([chart_row1]))
    elements.append(Spacer(1, 10))
    elements.append(Table([chart_row2]))
    elements.append(Spacer(1, 20))

    # ---------------- Tasks ----------------
    elements.append(Paragraph("Tasks", styles["Heading2"]))
    elements.append(Spacer(1, 6))

    if not tasks:
        elements.append(Paragraph("No tasks found.", styles["Normal"]))
    else:
        for i, task in enumerate(tasks, start=1):
            elements.append(Paragraph(f"<b>{i}. {task.get('title')}</b>", styles["Normal"]))
            if task.get("description"):
                elements.append(Paragraph(f"Description: {task['description']}", styles["Normal"]))
            elements.append(Paragraph(f"Priority: {task.get('priority') or '-'}", styles["Normal"]))
            elements.append(Paragraph(f"Status: {task.get('status') or '-'}", styles["Normal"]))
            due = task.get("due_date")
            elements.append(Paragraph(f"Due Date: {due if due else '-'}", styles["Normal"]))
            created = task.get("created_at")
            elements.append(Paragraph(f"Created: {created if created else '-'}", styles["Normal"]))
            elements.append(Spacer(1, 8))

    elements.append(Spacer(1, 14))

    # ---------------- Notifications ----------------
    elements.append(Paragraph("Notifications", styles["Heading2"]))
    elements.append(Spacer(1, 6))

    if not notifications:
        elements.append(Paragraph("No notifications found.", styles["Normal"]))
    else:
        for i, note in enumerate(notifications, start=1):
            label = "[Read]" if note.get("is_read") else "[Unread]"
            elements.append(Paragraph(f"<b>{i}. {label}</b>", styles["Normal"]))
            elements.append(Paragraph(str(note.get("message") or ""), styles["Normal"]))
            created = note.get("created_at")
            elements.append(Paragraph(f"Created: {created if created else '-'}", styles["Normal"]))
            elements.append(Spacer(1, 8))

    doc.build(elements)
    return buf.getvalue()
