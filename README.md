# Task Manager — Python (Django) + React + PostgreSQL

This is the original PERN (Postgres, Express, React, Node) Task Manager,
migrated to a **Django + React + Postgres** stack:

- **Backend:** Node.js/Express → **Python (Django + Django REST Framework)**,
  same routes, same request/response shapes, same JWT auth (HS256), same
  bcrypt password hashing — existing user accounts and data keep working
  unchanged.
- **Database:** unchanged. Point the new backend at your existing
  PostgreSQL database (same tables: `users`, `tasks`, `user_notifications`,
  `notifications`, `settings`, `support_tickets`, `support_ticket_messages`)
  and everything just works. The Django ORM is intentionally **not** used
  for these tables (no models/migrations) — views talk to the database with
  the same raw SQL the Express app used, so your existing schema is left
  exactly as-is.
- **Frontend:** unchanged React (Vite) app. It talks to
  `http://localhost:5000`, same as before — no frontend code was touched.

## Project structure

```
taskmanager-python/
├── backend/                    # Django backend (replaces the Express backend)
│   ├── manage.py
│   ├── taskmanager/
│   │   ├── settings.py         # DB config, JWT secret, CORS (was server.js config)
│   │   └── urls.py             # root routes: "/" and "/api/status"
│   ├── api/
│   │   ├── db.py               # raw SQL helpers over Django's DB connection (was config/db.js)
│   │   ├── security.py         # JWT + bcrypt + auth helpers (was authMiddleware.js, isAdmin.js)
│   │   ├── errors.py           # ApiError(status, message) -> {"message": ...} responses
│   │   ├── email_utils.py      # OTP + email sending (was utils/sendEmail.js)
│   │   ├── notifications_helper.py
│   │   ├── support_helper.py
│   │   ├── pdf_export.py       # user data export PDF (was pdfkit + chartjs-node-canvas)
│   │   ├── urls.py             # all /api/... routes (was the *Routes.js files)
│   │   ├── views_auth.py       # was controllers/authController.js
│   │   ├── views_admin.py      # was controllers/adminController.js
│   │   ├── views_user.py       # was controllers/UserController.js
│   │   ├── views_tasks.py      # was controllers/taskController.js
│   │   ├── views_notifications.py  # was controllers/notificationController.js
│   │   └── views_support.py    # was controllers/Supportcontroller.js
│   ├── requirements.txt
│   ├── .env.example
│   └── schema.sql              # reference schema for a FRESH database only
└── frontend/
    └── Task-manager/           # untouched React (Vite) app
```

## Setup

### 1. Database

You said you want to reuse the same database — just make sure your
PostgreSQL server is running and note its connection details. (If you're
starting fresh instead, create the schema with `backend/schema.sql`.)

### 2. Backend (Django)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env with your DB credentials, JWT_SECRET, email creds, etc.
# (these are the exact same values you used for the Node backend's .env)

python manage.py runserver 0.0.0.0:5000
```

The API will be available at `http://localhost:5000`.

> Note: `python manage.py migrate` is **not** needed for the app's own
> tables — those already exist in your database and are queried with raw
> SQL. Django will only mention "unapplied migrations" for its own
> internal `auth`/`contenttypes` bookkeeping tables, which this project
> doesn't use; you can safely ignore that message.

### 3. Frontend (unchanged)

```bash
cd frontend/Task-manager
npm install
npm run dev
```

The frontend is hardcoded to call `http://localhost:5000` by default (see
`.env.example` / `VITE_API_BASE_URL`), so as long as the Django backend is
running on port 5000 nothing else needs to change.

## Production deployment

### Option A: Docker Compose (recommended, one command)

```bash
cp .env.example .env
# edit .env: set real DJANGO_SECRET_KEY, JWT_SECRET, DB password, and your
# domain(s) in DJANGO_ALLOWED_HOSTS / DJANGO_CORS_ALLOWED_ORIGINS

docker compose up --build
```

This starts four containers wired together:
- **db** — PostgreSQL 16 (with `backend/schema.sql` auto-applied on first boot)
- **redis** — used for shared rate-limit counters across Gunicorn workers
- **backend** — Django app served by Gunicorn (3 workers by default), on port 5000
- **frontend** — the React app built for production and served by Nginx, on port 3000

If you already have your own PostgreSQL database (e.g. the same one your
original PERN app used) rather than the one in `docker-compose.yml`, remove
the `db` service and point `DB_HOST`/`DB_PORT`/etc. in `backend`'s
environment at your existing database instead.

### Option B: Manual (no Docker)

1. **Backend** — run behind Gunicorn instead of `runserver`:
   ```bash
   cd backend
   pip install -r requirements.txt
   export DJANGO_DEBUG=False
   export DJANGO_ALLOWED_HOSTS=yourdomain.com
   export DJANGO_CORS_ALLOWED_ORIGINS=https://yourdomain.com
   gunicorn taskmanager.wsgi:application --bind 0.0.0.0:5000 --workers 3
   ```
   Put this behind a reverse proxy (Nginx, Caddy, or your cloud provider's
   load balancer) that terminates HTTPS.

2. **Frontend** — build static files and serve them with any static host
   (Nginx, Vercel, Netlify, S3+CloudFront, etc.):
   ```bash
   cd frontend/Task-manager
   VITE_API_BASE_URL=https://api.yourdomain.com npm run build
   # deploy the resulting dist/ folder
   ```

## What changed vs. the original PERN backend

- **Runtime:** Node/Express → Python/Django + Django REST Framework.
- **Routing:** Express `router.get/post/put/delete/patch` → Django
  `urlpatterns` in `api/urls.py`. Since Django's URL resolver (unlike
  Express) doesn't dispatch by HTTP method on its own, endpoints that
  share one path but differ by method (e.g. `GET/POST /api/user/tasks`,
  `PUT/DELETE /api/tasks/:id`) are combined into a single dispatcher view
  that branches on `request.method` — same URL, same behavior per method.
- **DB driver:** `pg` → Django's `django.db.connection` (via
  `psycopg2`), using the exact same raw SQL queries (parameter style
  adapted from `$1,$2` to `%s`).
- **Auth:** `jsonwebtoken`/`bcrypt` (Node) → `PyJWT`/`bcrypt` (Python) —
  produces/reads the exact same token and hash formats, so existing
  logins and stored password hashes keep working.
- **PDF export / charts:** `pdfkit` + `chartjs-node-canvas` (Node) →
  `reportlab` + `matplotlib` (Python). Same four charts (status,
  priority, completion rate, monthly creation) and same PDF sections
  (profile, report, tasks, notifications).
- **Email/OTP:** `nodemailer` (Gmail SMTP) → Python's built-in `smtplib`
  (Gmail SMTP), same OTP flow and expiry (10 minutes).
- **Error responses:** a custom DRF exception handler
  (`api/exceptions.py`) normalizes errors to `{"message": "..."}`, the
  same shape the Express app returned, so the frontend's
  `err.response.data.message` reads work unchanged.
- **Everything else** (validation rules, status codes, response JSON
  shapes, notification messages, business logic) was ported line-for-line
  from the original controllers so the React frontend needs zero changes.

## Notes / known quirks from the original app

- The original Express app's admin routes (dashboard, users, tasks,
  reports, notifications) had **no auth middleware at all** — anyone could
  call them without logging in. This has been **fixed**: every
  `/api/admin/*` endpoint now requires a valid admin JWT via
  `require_admin()`, and the corresponding frontend admin pages have been
  updated to send their auth token on every one of those calls.
- A pre-existing case-sensitivity bug in the original frontend (import
  paths like `./components/user/...` pointing at a folder actually named
  `User/`, plus `Landingpage.jsx` vs `LandingPage` and `Layouts/` vs
  `layouts/`) has been fixed. This didn't matter on Windows/macOS
  (case-insensitive filesystems) but would have broken the production
  build on Linux, inside Docker, or on most hosting platforms.

## Production hardening included

- `DEBUG`, `ALLOWED_HOSTS`, and CORS origins are environment-driven, with
  safe defaults for local dev and strict behavior once `DJANGO_DEBUG=False`.
- HTTPS/HSTS/secure-cookie settings automatically enable in production mode.
- Rate limiting on `register`, `login`, `forgot-password`, `verify-otp`,
  `reset-password`, `send-change-password-otp`, and Google auth, backed by
  Django's cache framework (Redis in Docker Compose, in-memory for local
  dev).
- Served by Gunicorn (not the Django dev server) in both the Dockerfile
  and the manual deployment instructions above.
- Frontend API URL is configurable via `VITE_API_BASE_URL` instead of
  being hardcoded.

## Verified

This backend was smoke-tested end-to-end against a real PostgreSQL
database, including after the security hardening pass: register → login
→ create/update/delete/complete tasks → user dashboard/profile/
notifications → change password → account deletion → admin dashboard/
users/tasks/system-settings (confirmed 401 without a token, 200 with a
valid admin token) → rate limiting (confirmed 429 after repeated login
attempts) → support tickets with threaded replies → PDF data export →
served correctly under Gunicorn with multiple workers. The frontend was
also verified to build cleanly for production (`npm run build`) after
the case-sensitivity fixes.
