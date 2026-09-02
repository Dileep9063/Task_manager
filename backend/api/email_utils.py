import random
import smtplib
from email.mime.text import MIMEText

from django.conf import settings


def send_email(to: str, subject: str, text: str):
    """Mirrors src/utils/sendEmail.js (nodemailer + gmail service)."""
    if not settings.EMAIL_USER or not settings.EMAIL_PASS:
        print(f"[email disabled] Would send to {to}: {subject} - {text}")
        return

    msg = MIMEText(text)
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_USER
    msg["To"] = to

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(settings.EMAIL_USER, settings.EMAIL_PASS)
        server.sendmail(settings.EMAIL_USER, [to], msg.as_string())

    print("Email sent successfully")


def generate_otp(length: int = 6) -> str:
    """Mirrors otp-generator digits-only usage in authController.js / adminController.js."""
    return "".join(str(random.randint(0, 9)) for _ in range(length))
