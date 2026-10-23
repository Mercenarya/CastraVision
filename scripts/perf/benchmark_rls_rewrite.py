"""Measure set-based RLS alternatives inside rollback-only transactions."""

from __future__ import annotations

import json
import statistics
import subprocess

from _guard import CONTAINER, require_local_stack

WORKSPACE = "a5d08ade-a313-144d-6e5f-088e9f6f1478"
USER = "a04d432b-ae28-4bda-94ff-a77699e78e20"
CLAIMS = json.dumps({"sub": USER, "role": "authenticated"}, separators=(",", ":"))


CASES = {
    "audit_actor": (
        "drop policy audit_logs_admin_select on public.audit_logs; "
        "create policy audit_logs_admin_select on public.audit_logs for select to authenticated "
        "using (workspace_id in (select wm.workspace_id from public.workspace_members wm "
        "where wm.user_id=(select auth.uid()) and wm.role='admin'));",
        "select id,action,entity_type,created_at from public.audit_logs "
        f"where workspace_id='{WORKSPACE}' and actor_id='{USER}' "
        "and created_at >= now()-interval '180 days' order by created_at desc limit 50",
    ),
    "notifications_unread": (
        "drop policy notifications_recipient_select on public.notifications; "
        "create policy notifications_recipient_select on public.notifications "
        "for select to authenticated "
        "using (user_id=(select auth.uid()) and workspace_id in "
        "(select wm.workspace_id from public.workspace_members wm "
        "where wm.user_id=(select auth.uid())));",
        f"select count(*) from public.notifications where user_id='{USER}' and is_read=false",
    ),
    "notifications_latest": (
        "drop policy notifications_recipient_select on public.notifications; "
        "create policy notifications_recipient_select on public.notifications "
        "for select to authenticated "
        "using (user_id=(select auth.uid()) and workspace_id in "
        "(select wm.workspace_id from public.workspace_members wm "
        "where wm.user_id=(select auth.uid())));",
        "select id,type,message,is_read,created_at from public.notifications "
        f"where user_id='{USER}' order by created_at desc limit 20",
    ),
    "campaign_aggregate": (
        "drop policy campaign_performance_member_select on public.campaign_performance; "
        "create policy campaign_performance_member_select on public.campaign_performance "
        "for select to authenticated using (workspace_id in "
        "(select wm.workspace_id from public.workspace_members wm "
        "where wm.user_id=(select auth.uid())));",
        "select channel,avg(ctr),avg(cpa),avg(roas),sum(spend) "
        "from public.campaign_performance "
        f"where workspace_id='{WORKSPACE}' and record_date >= current_date-180 "
        "group by channel order by channel",
    ),
}


def run(case_setup: str, query: str) -> dict:
    sql = (
        f"begin; {case_setup} set local role authenticated; "
        f"set local request.jwt.claims='{CLAIMS}'; "
        f"explain (analyze, buffers, format json) {query}; rollback;"
    )
    result = subprocess.run(
        [
            "docker",
            "exec",
            CONTAINER,
            "psql",
            "-U",
            "postgres",
            "-d",
            "postgres",
            "-X",
            "-qAt",
            "-v",
            "ON_ERROR_STOP=1",
            "-c",
            sql,
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout.strip())[0]


def main() -> None:
    require_local_stack()
    for name, (setup, query) in CASES.items():
        runs = [run(setup, query) for _ in range(3)]
        print(
            json.dumps(
                {
                    "query": name,
                    "set_based_rls_median_ms": round(
                        statistics.median(item["Execution Time"] for item in runs), 3
                    ),
                },
                separators=(",", ":"),
            )
        )


if __name__ == "__main__":
    main()
