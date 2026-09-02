from django.db import connection, transaction


def _dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def query(sql: str, params: tuple = ()):
    """Run SQL (SELECT / INSERT..RETURNING / UPDATE..RETURNING / DELETE..RETURNING)
    and return a list[dict] of rows, mirroring node-postgres's pool.query().rows."""
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        if cursor.description is None:
            return []
        return _dictfetchall(cursor)


def query_one(sql: str, params: tuple = ()):
    rows = query(sql, params)
    return rows[0] if rows else None


def check_connection():
    with connection.cursor() as cursor:
        cursor.execute("SELECT NOW()")
        row = cursor.fetchone()
        return row


# Re-exported so views can run multi-statement transactions
# (used by delete_user_account) the same way client.query("BEGIN"/"COMMIT")
# was used in the original Node code.
atomic = transaction.atomic
