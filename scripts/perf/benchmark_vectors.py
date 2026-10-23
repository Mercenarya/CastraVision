"""Compare local vector search variants without persisting index changes."""

from __future__ import annotations

import json
import statistics
import subprocess

from _guard import CONTAINER, require_local_stack

WORKSPACE = "md5('perf-workspace-1')::uuid"
QUERY_VECTOR = (
    "(select embedding from public.strategy_context_embeddings "
    f"where workspace_id={WORKSPACE} order by id limit 1)"
)
SEARCH = (
    "select id from public.strategy_context_embeddings "
    f"where workspace_id={WORKSPACE} and embedding is not null "
    f"order by embedding <=> {QUERY_VECTOR} limit 10"
)


def _marked(label: str, sql: str) -> str:
    return f"\\echo __BEGIN__{label}\n{sql}\n\\echo __END__{label}\n"


def _variant_sql(label: str, settings: str, reset_settings: str) -> str:
    statements = [settings] if settings else []
    statements.append(_marked(f"ids:{label}", f"{SEARCH};"))
    for run_number in range(3):
        statements.append(
            _marked(
                f"plan:{label}:{run_number}",
                f"explain (analyze, buffers, format json) {SEARCH};",
            )
        )
    if reset_settings:
        statements.append(reset_settings)
    return "\n".join(statements)


def _benchmark_sql() -> str:
    return "\n".join(
        [
            "\\set ON_ERROR_STOP on",
            "begin;",
            _variant_sql(
                "exact",
                "set local enable_indexscan=off; set local enable_bitmapscan=off;",
                "set local enable_indexscan=on; set local enable_bitmapscan=on;",
            ),
            _variant_sql("workspace_btree_exact", "", ""),
            "drop index public.idx_strategy_embeddings_workspace;",
            "analyze public.strategy_context_embeddings;",
            _variant_sql(
                "ivfflat_built_empty_default",
                "set local enable_seqscan=off; set local ivfflat.probes=1;",
                "set local enable_seqscan=on;",
            ),
            _variant_sql(
                "ivfflat_built_empty_probes_10",
                "set local enable_seqscan=off; set local ivfflat.probes=10;",
                "set local enable_seqscan=on; set local ivfflat.probes=1;",
            ),
            "set local maintenance_work_mem='128MB';",
            "drop index public.idx_embeddings_vector;",
            "create index idx_embeddings_vector "
            "on public.strategy_context_embeddings "
            "using ivfflat (embedding vector_cosine_ops) with (lists=100);",
            "analyze public.strategy_context_embeddings;",
            _variant_sql(
                "ivfflat_rebuilt_default",
                "set local enable_seqscan=off; set local ivfflat.probes=1;",
                "set local enable_seqscan=on;",
            ),
            _variant_sql(
                "ivfflat_rebuilt_probes_10",
                "set local enable_seqscan=off; set local ivfflat.probes=10;",
                "set local enable_seqscan=on; set local ivfflat.probes=1;",
            ),
            "set local maintenance_work_mem='512MB';",
            "drop index public.idx_embeddings_vector;",
            "create index perf_trial_embeddings_hnsw "
            "on public.strategy_context_embeddings "
            "using hnsw (embedding vector_cosine_ops);",
            "analyze public.strategy_context_embeddings;",
            _variant_sql(
                "hnsw_ef_40",
                "set local enable_seqscan=off; set local hnsw.ef_search=40;",
                "set local enable_seqscan=on;",
            ),
            _variant_sql(
                "hnsw_ef_100",
                "set local enable_seqscan=off; set local hnsw.ef_search=100;",
                "set local enable_seqscan=on; set local hnsw.ef_search=40;",
            ),
            "rollback;",
        ]
    )


def _run_transaction() -> str:
    result = subprocess.run(
        [
            "docker",
            "exec",
            "-i",
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
        ],
        check=True,
        capture_output=True,
        input=_benchmark_sql(),
        text=True,
    )
    return result.stdout


def _sections(output: str) -> dict[str, str]:
    sections: dict[str, str] = {}
    current: str | None = None
    lines: list[str] = []
    for line in output.splitlines():
        if line.startswith("__BEGIN__"):
            current = line.removeprefix("__BEGIN__")
            lines = []
        elif line.startswith("__END__"):
            label = line.removeprefix("__END__")
            if current != label:
                raise RuntimeError(f"unexpected benchmark marker {label!r}")
            sections[label] = "\n".join(lines).strip()
            current = None
        elif current is not None:
            lines.append(line)
    if current is not None:
        raise RuntimeError(f"unterminated benchmark marker {current!r}")
    return sections


def _index_names(plan: dict) -> list[str]:
    indexes: list[str] = []

    def visit(node: dict) -> None:
        index_name = node.get("Index Name")
        if index_name and index_name not in indexes:
            indexes.append(index_name)
        for child in node.get("Plans", []):
            visit(child)

    visit(plan)
    return indexes


def main() -> None:
    require_local_stack()
    sections = _sections(_run_transaction())
    labels = [
        "exact",
        "workspace_btree_exact",
        "ivfflat_built_empty_default",
        "ivfflat_built_empty_probes_10",
        "ivfflat_rebuilt_default",
        "ivfflat_rebuilt_probes_10",
        "hnsw_ef_40",
        "hnsw_ef_100",
    ]
    exact = set(sections["ids:exact"].splitlines())
    for label in labels:
        found = [item for item in sections[f"ids:{label}"].splitlines() if item]
        runs = [json.loads(sections[f"plan:{label}:{run}"])[0] for run in range(3)]
        median_run = sorted(runs, key=lambda row: row["Execution Time"])[1]
        print(
            json.dumps(
                {
                    "variant": label,
                    "median_ms": round(statistics.median(row["Execution Time"] for row in runs), 3),
                    "returned": len(found),
                    "recall_at_10": len(exact.intersection(found)) / 10,
                    "indexes": _index_names(median_run["Plan"]),
                },
                separators=(",", ":"),
            )
        )


if __name__ == "__main__":
    main()
