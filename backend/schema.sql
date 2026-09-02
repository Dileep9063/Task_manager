-- ============================================================
-- Task Manager - PostgreSQL schema
--
-- This is inferred from the SQL queries in the original app and
-- is provided only as a reference for setting up a FRESH database.
-- If you already have a Postgres database from the PERN version,
-- you do NOT need to run this - just point the Django backend's
-- .env at that same database and everything will work as-is.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    email            VARCHAR(255) UNIQUE NOT NULL,
    password         VARCHAR(255),                 -- nullable: Google-only accounts have no password
    google_id        VARCHAR(255),
    role             VARCHAR(50)  NOT NULL DEFAULT 'user',
    status           VARCHAR(50)  NOT NULL DEFAULT 'active',
    phone            VARCHAR(50),
    address          TEXT,
    otp              VARCHAR(10),
    otp_expiry       TIMESTAMP,
    is_seen_by_admin BOOLEAN      NOT NULL DEFAULT false,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    priority         VARCHAR(50),
    status           VARCHAR(50) NOT NULL DEFAULT 'Pending',
    due_date         DATE,
    is_seen_by_admin BOOLEAN NOT NULL DEFAULT false,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message    TEXT NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Admin-facing global notifications (new registrations, etc.)
CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    type       VARCHAR(50),
    title      VARCHAR(255),
    message    TEXT,
    is_read    BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
    id                 INTEGER PRIMARY KEY DEFAULT 1,
    allow_registration BOOLEAN NOT NULL DEFAULT true,
    maintenance_mode   BOOLEAN NOT NULL DEFAULT false,
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO settings (id, allow_registration, maintenance_mode)
VALUES (1, true, false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS support_tickets (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category    VARCHAR(100),
    priority    VARCHAR(50),
    status      VARCHAR(50) NOT NULL DEFAULT 'submitted',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id          SERIAL PRIMARY KEY,
    ticket_id   INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL, -- 'user' or 'admin'
    message     TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Example admin account (password: Admin@123 - CHANGE THIS)
-- Generate a real bcrypt hash before using this in production, e.g.:
--   python -c "import bcrypt; print(bcrypt.hashpw(b'Admin@123', bcrypt.gensalt()).decode())"
-- INSERT INTO users (name, email, password, role)
-- VALUES ('Admin', 'admin@example.com', '<bcrypt-hash-here>', 'admin');
