"""Validate a PostgreSQL migration inside a transaction that is always rolled back."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from urllib.parse import unquote, urlparse

import psycopg2
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")


def connection_kwargs(database_url: str) -> dict[str, object]:
    parsed = urlparse(database_url)
    if not all((parsed.hostname, parsed.username, parsed.password, parsed.path[1:])):
        raise ValueError("DATABASE_URL is not a complete PostgreSQL connection URL.")
    return {
        "host": parsed.hostname,
        "port": parsed.port or 5432,
        "dbname": parsed.path[1:],
        "user": unquote(parsed.username),
        "password": unquote(parsed.password),
        "sslmode": "require",
        "connect_timeout": 10,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("migration", type=Path)
    args = parser.parse_args()

    migration = args.migration.resolve()
    migrations_root = (ROOT / "supabase" / "migrations").resolve()
    if migrations_root not in migration.parents or migration.suffix.lower() != ".sql":
        raise SystemExit("Migration must be a .sql file under supabase/migrations.")

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL is required in .env or the process environment.")

    sql = migration.read_text(encoding="utf-8")
    connection = psycopg2.connect(**connection_kwargs(database_url))
    try:
        connection.autocommit = False
        with connection.cursor() as cursor:
            cursor.execute("set local lock_timeout = '5s'")
            cursor.execute("set local statement_timeout = '30s'")
            cursor.execute(sql)
        connection.rollback()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

    print(f"Migration validated and rolled back: {migration.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
