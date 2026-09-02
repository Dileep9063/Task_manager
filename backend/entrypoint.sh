#!/bin/sh
set -e

echo "Waiting for database at ${DB_HOST:-localhost}:${DB_PORT:-5432}..."

python - <<'PYEOF'
import os
import socket
import time

host = os.getenv("DB_HOST", "localhost")
port = int(os.getenv("DB_PORT", "5432"))

for attempt in range(30):
    try:
        with socket.create_connection((host, port), timeout=2):
            print("Database is accepting connections.")
            break
    except OSError:
        print(f"  ...not ready yet (attempt {attempt + 1}/30)")
        time.sleep(2)
else:
    raise SystemExit("Database did not become ready in time.")
PYEOF

echo "Running Django system checks..."
python manage.py check --deploy || python manage.py check

echo "Starting Gunicorn..."
exec gunicorn taskmanager.wsgi:application \
    --bind 0.0.0.0:"${PORT:-5000}" \
    --workers "${GUNICORN_WORKERS:-3}" \
    --timeout "${GUNICORN_TIMEOUT:-60}" \
    --access-logfile - \
    --error-logfile -
