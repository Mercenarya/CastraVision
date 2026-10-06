"""Read-only audit for the remote CastraVision Supabase schema."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

import psycopg2
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

EXPECTED_BUSINESS_TABLES = {
    "profiles",
    "workspaces",
    "workspace_members",
    "business_profiles",
    "campaign_performance",
    "strategies",
    "strategy_context_embeddings",
    "ad_contents",
    "budget_proposals",
    "approvals",
    "notifications",
    "audit_logs",
    "competitor_insights",
    "reports",
}

EXPECTED_POLICY_COMMANDS = {
    "profiles": {"SELECT", "INSERT", "UPDATE"},
    "workspaces": {"SELECT", "UPDATE"},
    "workspace_members": {"SELECT", "INSERT", "UPDATE", "DELETE"},
    "business_profiles": {"SELECT", "INSERT", "UPDATE", "DELETE"},
    "campaign_performance": {"SELECT", "INSERT", "UPDATE", "DELETE"},
    "strategies": {"SELECT", "INSERT", "UPDATE", "DELETE"},
    "strategy_context_embeddings": {"ALL"},
    "ad_contents": {"SELECT", "INSERT", "UPDATE", "DELETE"},
    "budget_proposals": {"SELECT", "INSERT", "UPDATE", "DELETE"},
    "approvals": {"SELECT", "INSERT", "UPDATE", "DELETE"},
    "notifications": {"SELECT", "INSERT", "UPDATE", "DELETE"},
    "audit_logs": {"SELECT"},
    "competitor_insights": {"SELECT", "INSERT", "UPDATE", "DELETE"},
    "reports": {"SELECT", "INSERT", "UPDATE"},
}

EXPECTED_SECURITY_FUNCTIONS = {
    "is_workspace_member",
    "workspace_role",
    "has_workspace_role",
    "create_workspace_with_admin",
    "protect_workspace_admin",
    "validate_workspace_reference",
    "match_strategy_context",
}


def main() -> int:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL is required in .env or the process environment.")

    failures: list[str] = []
    parsed = urlparse(database_url)
    if not all((parsed.hostname, parsed.username, parsed.password, parsed.path[1:])):
        raise SystemExit("DATABASE_URL is not a complete PostgreSQL connection URL.")

    # Pass discrete fields so libpq does not misread reserved URL characters.
    with psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        dbname=parsed.path[1:],
        user=unquote(parsed.username),
        password=unquote(parsed.password),
        sslmode="require",
        connect_timeout=10,
    ) as connection:
        connection.set_session(readonly=True)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select c.relname,
                       c.relrowsecurity,
                       c.relforcerowsecurity,
                       count(p.policyname)::int
                from pg_class c
                join pg_namespace n on n.oid = c.relnamespace
                left join pg_policies p
                  on p.schemaname = n.nspname and p.tablename = c.relname
                where n.nspname = 'public' and c.relkind in ('r', 'p')
                group by c.relname, c.relrowsecurity, c.relforcerowsecurity
                order by c.relname
                """
            )
            tables = cursor.fetchall()

            found_tables = {row[0] for row in tables}
            print("Public table security:")
            for table, rls_enabled, rls_forced, policy_count in tables:
                access = "policies" if policy_count else "deny-all"
                print(
                    f"  {table}: RLS={'on' if rls_enabled else 'OFF'}, "
                    f"forced={'yes' if rls_forced else 'no'}, "
                    f"policies={policy_count} ({access})"
                )
                if not rls_enabled:
                    failures.append(f"{table}: RLS disabled")
                if table in EXPECTED_BUSINESS_TABLES and policy_count == 0:
                    failures.append(f"{table}: no policies")

            for missing_table in sorted(EXPECTED_BUSINESS_TABLES - found_tables):
                failures.append(f"{missing_table}: table missing")

            cursor.execute(
                """
                select tablename, policyname, cmd, roles,
                       coalesce(qual, ''), coalesce(with_check, '')
                from pg_policies
                where schemaname = 'public'
                order by tablename, policyname
                """
            )
            print("Policies:")
            observed_commands: dict[str, set[str]] = {}
            for (
                table,
                name,
                command,
                roles,
                using_clause,
                check_clause,
            ) in cursor.fetchall():
                observed_commands.setdefault(table, set()).add(command)
                if check_clause:
                    check_status = "explicit"
                elif command == "ALL" and using_clause:
                    check_status = "implicit-from-using"
                else:
                    check_status = "not-applicable"
                print(
                    f"  {table}.{name}: {command}; "
                    f"using={'yes' if using_clause else 'no'}; "
                    f"check={check_status}"
                )
                if table in EXPECTED_BUSINESS_TABLES:
                    if "public" in roles or "anon" in roles:
                        failures.append(
                            f"{table}.{name}: policy granted to public/anon"
                        )
                    if command == "ALL" and name != "strategy_context_embeddings_rpc_only":
                        failures.append(f"{table}.{name}: broad ALL policy")
                    if command in {"INSERT", "UPDATE", "ALL"} and not check_clause:
                        failures.append(f"{table}.{name}: missing explicit WITH CHECK")

            for table, expected in EXPECTED_POLICY_COMMANDS.items():
                observed = observed_commands.get(table, set())
                if observed != expected:
                    failures.append(
                        f"{table}: policy commands {sorted(observed)}; "
                        f"expected {sorted(expected)}"
                    )

            cursor.execute(
                """
                select p.proname,
                       p.prosecdef,
                       coalesce(array_to_string(p.proconfig, ','), '')
                from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public'
                  and p.proname = any(%s)
                order by p.proname
                """,
                (list(EXPECTED_SECURITY_FUNCTIONS),),
            )
            found_functions = set()
            print("Security functions:")
            for function_name, security_definer, configuration in cursor.fetchall():
                found_functions.add(function_name)
                pinned_search_path = "search_path=" in configuration
                print(
                    f"  {function_name}: "
                    f"security_definer={'yes' if security_definer else 'no'}, "
                    f"search_path={'pinned' if pinned_search_path else 'UNPINNED'}"
                )
                if not security_definer:
                    failures.append(f"{function_name}: not SECURITY DEFINER")
                if not pinned_search_path:
                    failures.append(f"{function_name}: search_path not pinned")

            for missing_function in sorted(
                EXPECTED_SECURITY_FUNCTIONS - found_functions
            ):
                failures.append(f"security function missing: {missing_function}")

            cursor.execute(
                """
                select conrelid::regclass::text, conname
                from pg_constraint
                where connamespace = 'public'::regnamespace
                  and not convalidated
                order by conrelid::regclass::text, conname
                """
            )
            invalid_constraints = cursor.fetchall()
            if invalid_constraints:
                failures.extend(
                    f"{table}: constraint {name} is not validated"
                    for table, name in invalid_constraints
                )

            cursor.execute(
                """
                select extname from pg_extension
                where extname in ('uuid-ossp', 'vector')
                order by extname
                """
            )
            extensions = [row[0] for row in cursor.fetchall()]
            print(f"Required extensions: {', '.join(extensions) or 'none'}")
            for extension in ("uuid-ossp", "vector"):
                if extension not in extensions:
                    failures.append(f"extension missing: {extension}")

    if failures:
        print("Audit failures:")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print("Schema audit passed.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        raise SystemExit(f"Supabase schema audit failed: {exc}") from exc
