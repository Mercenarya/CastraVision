"""Run repeatable local-only EXPLAIN benchmarks for SCRUM-206."""

from __future__ import annotations

import argparse
import json
import statistics
import subprocess

from _guard import CONTAINER, require_local_stack


def perf_uuid(kind: str, number: int) -> str:
    sql = f"select md5('perf-{kind}-{number}')::uuid;"
    return run_psql(sql).strip()


def run_psql(sql: str) -> str:
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
    return result.stdout.strip()


def explain(query: str, user_id: str | None) -> dict:
    statement = f"explain (analyze, buffers, format json) {query};"
    if user_id:
        claims = json.dumps({"sub": user_id, "role": "authenticated"}, separators=(",", ":"))
        statement = (
            "begin; set local role authenticated; "
            f"set local request.jwt.claims = '{claims}'; "
            f"{statement} rollback;"
        )
    payload = json.loads(run_psql(statement))
    return payload[0]


def plan_summary(plan: dict) -> tuple[list[str], list[str]]:
    nodes: list[str] = []
    indexes: list[str] = []

    def visit(node: dict) -> None:
        node_type = node.get("Node Type")
        if node_type and node_type not in nodes:
            nodes.append(node_type)
        index_name = node.get("Index Name")
        if index_name and index_name not in indexes:
            indexes.append(index_name)
        for child in node.get("Plans", []):
            visit(child)

    visit(plan)
    return nodes, indexes


def main() -> None:
    require_local_stack()
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", required=True)
    args = parser.parse_args()

    targets = {
        "large": {
            "workspace": perf_uuid("workspace", 1),
            "user": perf_uuid("user", 1),
        },
        "small": {
            "workspace": perf_uuid("workspace", 11),
            "user": perf_uuid("user", 51),
        },
    }

    for size, target in targets.items():
        ws = target["workspace"]
        user = target["user"]
        queries = {
            "audit_recent": (
                "select id,actor_id,action,entity_type,created_at from public.audit_logs "
                f"where workspace_id='{ws}' and created_at >= now()-interval '90 days' "
                "order by created_at desc limit 50"
            ),
            "audit_actor": (
                "select id,action,entity_type,created_at from public.audit_logs "
                f"where workspace_id='{ws}' and actor_id='{user}' "
                "and created_at >= now()-interval '180 days' order by created_at desc limit 50"
            ),
            "audit_type_action": (
                "select id,actor_id,created_at from public.audit_logs "
                f"where workspace_id='{ws}' and entity_type='ad_contents' and action='approve' "
                "and created_at >= now()-interval '365 days' order by created_at desc limit 50"
            ),
            "notifications_unread": (
                "select count(*) from public.notifications "
                f"where user_id='{user}' and is_read=false"
            ),
            "notifications_latest": (
                "select id,type,message,is_read,created_at from public.notifications "
                f"where user_id='{user}' order by created_at desc limit 20"
            ),
            "campaign_aggregate": (
                "select channel,avg(ctr),avg(cpa),avg(roas),sum(spend) "
                "from public.campaign_performance "
                f"where workspace_id='{ws}' and record_date >= current_date-180 "
                "group by channel order by channel"
            ),
            "campaign_recent": (
                "select id,channel,ctr,cpa,roas,record_date "
                "from public.campaign_performance "
                f"where workspace_id='{ws}' and record_date >= current_date-180 "
                "order by record_date desc limit 200"
            ),
            "member_workspaces": (
                "select workspace_id,role,joined_at from public.workspace_members "
                f"where user_id='{user}' order by joined_at"
            ),
        }
        for mode, auth_user in (("superuser", None), ("authenticated", user)):
            for name, query in queries.items():
                runs = [explain(query, auth_user) for _ in range(3)]
                times = [run["Execution Time"] for run in runs]
                median_run = sorted(runs, key=lambda run: run["Execution Time"])[1]
                nodes, indexes = plan_summary(median_run["Plan"])
                print(
                    json.dumps(
                        {
                            "phase": args.phase,
                            "query": name,
                            "mode": mode,
                            "workspace_size": size,
                            "median_ms": round(statistics.median(times), 3),
                            "rows": median_run["Plan"].get("Actual Rows"),
                            "nodes": nodes,
                            "indexes": indexes,
                        },
                        separators=(",", ":"),
                    )
                )


if __name__ == "__main__":
    main()
