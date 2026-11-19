"""Deploy only the explicitly approved MM migration, without reading .env.

Requires an existing Supabase CLI management login. Business rows are backed up
outside Git and never printed. No pending migrations are pushed implicitly.
"""

import hashlib
import json
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REF = "oviqgptccjjdaaqxabwv"
VERSION = "20261118195135"
NAME = "marketing_manager_report_files"
SOURCE = ROOT / "supabase" / "migrations" / f"{VERSION}_{NAME}.sql"
APPROVED_SHA = "d74a9b3f1b0321b3d81dd4f14e8e974beec0fbeb1145a68a40739dd00b5f0155"
DEST = (
    Path.home()
    / "Documents"
    / "CastraVision-backups"
    / ("mm-tools-" + datetime.now(UTC).strftime("%Y%m%d-%H%M%S"))
)
DEST.mkdir(parents=True)


def query(name, sql):
    path = DEST / f"{name}.sql"
    path.write_text(sql, encoding="utf-8")
    result = subprocess.run(
        [
            "npx.cmd",
            "--yes",
            "supabase@2.121.0",
            "db",
            "query",
            "--linked",
            "--project-ref",
            REF,
            "--output-format",
            "json",
            "--file",
            str(path),
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=120,
        stdin=subprocess.DEVNULL,
    )
    if result.returncode:
        # CLI stderr can contain connection details; do not echo it.
        raise RuntimeError(f"{name} failed (exit {result.returncode}); output withheld")
    start = result.stdout.find("{")
    data = json.JSONDecoder().raw_decode(result.stdout[start:])[0]["rows"]
    (DEST / f"{name}.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return data


if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != APPROVED_SHA:
    raise SystemExit("Migration differs from reviewed source; refusing deployment")
preflight = query(
    "preflight",
    f"""
select
 exists(select 1 from supabase_migrations.schema_migrations
   where version='{VERSION}') applied,
 (select count(*) from (select workspace_id,lower(btrim(keyword))
   from public.competitor_insights group by 1,2 having count(*)>1) d) duplicate_groups,
 (select count(*) from public.reports) reports,
 (select count(*) from public.competitor_insights) competitors,
 (select relrowsecurity from pg_class where oid='public.reports'::regclass) reports_rls,
 (select relrowsecurity from pg_class
   where oid='public.competitor_insights'::regclass) competitors_rls,
 to_regprocedure('public.has_workspace_role(uuid,public.workspace_role[])') is not null role_helper,
 exists(select 1 from pg_policies where schemaname='public' and tablename='reports'
   and policyname='manager_artifact_select_guard') guard_exists,
 to_regprocedure('public.membership_manager_tools_ready(uuid)') is not null probe_exists,
 to_regclass('public.idx_competitor_workspace_keyword_unique') is not null index_exists;
""",
)[0]
print(json.dumps({"preflight": preflight, "backupDirectory": str(DEST)}), flush=True)
if preflight["duplicate_groups"]:
    raise SystemExit("Duplicate registry data; stopped without changes")
if not all(preflight[key] for key in ("reports_rls", "competitors_rls", "role_helper")):
    raise SystemExit("Required RLS/helper missing; stopped without changes")
if not preflight["applied"] and any(
    preflight[key] for key in ("guard_exists", "probe_exists", "index_exists")
):
    raise SystemExit("Untracked target objects exist; stopped for review")
query(
    "catalog-before",
    """
select 'policy' kind, to_jsonb(p) definition from pg_policies p
where schemaname='public' and tablename in ('reports','competitor_insights','audit_logs')
union all select 'index',to_jsonb(i) from pg_indexes i
where schemaname='public' and tablename in ('reports','competitor_insights');
""",
)
query(
    "data-backup",
    """
select jsonb_build_object(
 'reports',(select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from public.reports r),
 'competitors',(select coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb)
   from public.competitor_insights c)) backup;
""",
)

if sys.argv[1:] != ["--apply-reviewed-manager-migration"]:
    print("Read-only preflight/backup finished; apply flag not present", flush=True)
    raise SystemExit(0)

if not preflight["applied"]:
    raw = SOURCE.read_text(encoding="utf-8")
    prefix, sep, body = raw.partition("\nbegin;")
    if not sep:
        raise SystemExit("Expected explicit BEGIN not found")
    body, sep, trailing = body.rpartition("\ncommit;")
    if not sep or trailing.strip():
        raise SystemExit("Expected final COMMIT not found")
    # Keep the approved statements unchanged; add timeouts, history and checks to
    # the same transaction, so a failed assertion cannot leave a partial cutover.
    record = "$mm_reviewed_source$"
    if record in raw:
        raise SystemExit("Unexpected source quoting delimiter")
    apply_sql = f"""
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
select pg_advisory_xact_lock(hashtextextended('castra:mm-tools:{VERSION}',0));
do $preflight$ begin
 if exists(select 1 from public.competitor_insights
   group by workspace_id,lower(btrim(keyword)) having count(*)>1) then
   raise exception 'Duplicate registry data; migration rolled back';
 end if;
end $preflight$;
{prefix}
{body}
insert into supabase_migrations.schema_migrations(version,name,statements)
values ('{VERSION}','{NAME}',array[{record}{raw}{record}]::text[]);
do $verify$ begin
 if not exists(select 1 from pg_policies where schemaname='public'
   and tablename='reports' and policyname='manager_artifact_select_guard'
   and permissive='RESTRICTIVE') then raise exception 'Guard missing'; end if;
 if has_function_privilege('anon','public.membership_manager_tools_ready(uuid)','EXECUTE')
   then raise exception 'Anon probe privilege'; end if;
 if not has_function_privilege('authenticated',
   'public.membership_manager_tools_ready(uuid)','EXECUTE') then
   raise exception 'Authenticated privilege missing'; end if;
end $verify$;
commit;
select true committed;
"""
    query("apply-approved-migration", apply_sql)

postflight = query(
    "postflight",
    f"""
select
 (select count(*) from supabase_migrations.schema_migrations
   where version='{VERSION}' and name='{NAME}') history_rows,
 exists(select 1 from pg_policies where schemaname='public' and tablename='reports'
   and policyname='manager_artifact_select_guard' and permissive='RESTRICTIVE') guard_restrictive,
 exists(select 1 from pg_index where indexrelid=
   'public.idx_competitor_workspace_keyword_unique'::regclass
   and indisvalid and indisunique) unique_index_valid,
 (select not prosecdef from pg_proc
   where oid='public.membership_manager_tools_ready(uuid)'::regprocedure) probe_invoker,
 not has_function_privilege('anon',
   'public.membership_manager_tools_ready(uuid)','EXECUTE') anon_blocked,
 has_function_privilege('authenticated',
   'public.membership_manager_tools_ready(uuid)','EXECUTE') authenticated_allowed,
 (select count(*) from public.reports) reports,
 (select count(*) from public.competitor_insights) competitors;
""",
)[0]
assert postflight["history_rows"] == 1
assert all(
    postflight[key]
    for key in (
        "guard_restrictive",
        "unique_index_valid",
        "probe_invoker",
        "anon_blocked",
        "authenticated_allowed",
    )
)
assert postflight["reports"] == preflight["reports"]
assert postflight["competitors"] == preflight["competitors"]
manifest = {
    "project": REF,
    "migration": VERSION,
    "sha256": APPROVED_SHA,
    "preflight": preflight,
    "postflight": postflight,
    "backupDirectory": str(DEST),
}
(DEST / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print(
    json.dumps({"deployed": True, "postflight": postflight, "backupDirectory": str(DEST)}),
    flush=True,
)
