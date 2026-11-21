"""
Dual-Engine Database Persistence Adapter (SQLite Local + PostgreSQL Production).

Automatically routes application state (users, subscriptions, watchlists, saved calls,
alert configs, synced SEC/SEBI insider transactions, and vocal stress audits) to:
- Managed PostgreSQL when `DATABASE_URL` (`postgresql://` / `postgres://`) is configured
  (e.g. Render `marketprobe-db` in production)
- Local SQLite (`data/marketprobe.db`) during local development & offline runs
"""

import os
import re
import sqlite3
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_SQLITE_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))


def get_database_url() -> str:
    raw = (os.environ.get("DATABASE_URL") or "").strip()
    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://") :]
    return raw


def is_postgres_enabled() -> bool:
    url = get_database_url()
    return url.startswith("postgresql://")


def get_database_backend_info() -> Dict[str, Any]:
    if is_postgres_enabled():
        return {"backend": "postgresql", "durable_cloud": True}
    return {"backend": "sqlite", "durable_cloud": False, "path": DEFAULT_SQLITE_PATH}


def _translate_sql_for_postgres(sql: str) -> str:
    """Translates standard SQLite DDL/DML syntax cleanly into PostgreSQL syntax."""
    s = sql.strip()
    s = re.sub(r"INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT", "SERIAL PRIMARY KEY", s, flags=re.IGNORECASE)
    s = re.sub(r"BOOLEAN\s+DEFAULT\s+0", "INTEGER DEFAULT 0", s, flags=re.IGNORECASE)
    s = re.sub(r"BOOLEAN\s+DEFAULT\s+1", "INTEGER DEFAULT 1", s, flags=re.IGNORECASE)

    # INSERT OR IGNORE INTO ... -> INSERT INTO ... ON CONFLICT DO NOTHING
    if re.search(r"INSERT\s+OR\s+IGNORE\s+INTO", s, flags=re.IGNORECASE):
        s = re.sub(r"INSERT\s+OR\s+IGNORE\s+INTO", "INSERT INTO", s, flags=re.IGNORECASE)
        s = s.rstrip(";") + " ON CONFLICT DO NOTHING"

    # Translate positional `?` placeholders to `%s` (ignoring question marks inside quotes)
    out = []
    in_single = False
    for ch in s:
        if ch == "'":
            in_single = not in_single
            out.append(ch)
        elif ch == "?" and not in_single:
            out.append("%s")
        else:
            out.append(ch)
    return "".join(out)


class UnifiedCursor:
    def __init__(self, raw_cursor: Any, backend: str):
        self._cur = raw_cursor
        self.backend = backend

    @property
    def rowcount(self) -> int:
        return int(getattr(self._cur, "rowcount", 0) or 0)

    def execute(self, sql: str, params: Optional[Sequence[Any]] = None) -> "UnifiedCursor":
        query = _translate_sql_for_postgres(sql) if self.backend == "postgresql" else sql
        if params is not None:
            self._cur.execute(query, params)
        else:
            self._cur.execute(query)
        return self

    def executemany(self, sql: str, seq_of_params: Iterable[Sequence[Any]]) -> "UnifiedCursor":
        query = _translate_sql_for_postgres(sql) if self.backend == "postgresql" else sql
        self._cur.executemany(query, seq_of_params)
        return self

    def fetchone(self) -> Optional[Any]:
        return self._cur.fetchone()

    def fetchall(self) -> List[Any]:
        return self._cur.fetchall()


class UnifiedConnection:
    """Thin DB-API 2.0 wrapper supporting identical SQLite & PostgreSQL usage."""

    def __init__(self, raw_conn: Any, backend: str):
        self._conn = raw_conn
        self.backend = backend

    def cursor(self) -> UnifiedCursor:
        if self.backend == "postgresql":
            import psycopg2.extras

            return UnifiedCursor(self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor), "postgresql")
        return UnifiedCursor(self._conn.cursor(), "sqlite")

    def execute(self, sql: str, params: Optional[Sequence[Any]] = None) -> UnifiedCursor:
        cur = self.cursor()
        return cur.execute(sql, params)

    def executemany(self, sql: str, seq_of_params: Iterable[Sequence[Any]]) -> UnifiedCursor:
        cur = self.cursor()
        return cur.executemany(sql, seq_of_params)

    def commit(self) -> None:
        self._conn.commit()

    def rollback(self) -> None:
        self._conn.rollback()

    def close(self) -> None:
        self._conn.close()

    def __enter__(self) -> "UnifiedConnection":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type:
            try:
                self.rollback()
            except Exception:
                pass
        self.close()


def get_app_db_connection(sqlite_path: Optional[str] = None) -> UnifiedConnection:
    """
    Returns a PostgreSQL connection if `DATABASE_URL` is configured and reachable;
    otherwise returns a local SQLite connection with `sqlite3.Row`.
    """
    if is_postgres_enabled():
        try:
            import psycopg2

            pg_conn = psycopg2.connect(get_database_url(), connect_timeout=5)
            return UnifiedConnection(pg_conn, "postgresql")
        except Exception as e:
            print(f"[DB ADAPTER] PostgreSQL connect failed ({e}); falling back to SQLite.")

    target = sqlite_path or DEFAULT_SQLITE_PATH
    conn = sqlite3.connect(target, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return UnifiedConnection(conn, "sqlite")
