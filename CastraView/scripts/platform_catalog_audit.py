"""Catalog metadata only, dedicated local project. No application rows or secrets."""

import json
import subprocess

from run_platform_local import CONTAINER, ROOT, checked_container

checked_container()
query = r"""
select jsonb_build_object(
 'scopedTables',(select
jsonb_agg(jsonb_build_object('table',c.relname,'rls',c.relrowsecurity,
 'activePolicy',exists(select 1 from pg_policy p where p.polrelid=c.oid and
p.polname='platform_active_tenant' and not p.polpermissive),
 'writeGuard',exists(select 1 from pg_trigger t where t.tgrelid=c.oid and
t.tgname='platform_active_write' and t.tgenabled<>'D')) order by c.relname)
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and
c.relkind='r'
 and (c.relname='workspaces' or exists(select 1 from pg_attribute a where a.attrelid=c.oid
and a.attname='workspace_id' and a.atttypid='uuid'::regtype and not a.attisdropped))),
 'definerFunctions',(select
jsonb_agg(jsonb_build_object('schema',n.nspname,'function',p.proname,
 'arguments',pg_get_function_identity_arguments(p.oid),'searchPath',p.proconfig,
 'activeReference',p.prosrc ~
'(require_active|workspace_active|workspace_role|is_workspace_member|actor_role|can_team|is_manager|business_actor)',
 'anonExecute',has_function_privilege('anon',p.oid,'EXECUTE'),
 'authenticatedExecute',has_function_privilege('authenticated',p.oid,'EXECUTE')) order by
n.nspname,p.proname)
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.prosecdef
 and n.nspname in ('public','platform_private','membership_private','workflow_private')),
 'storagePolicies',(select
jsonb_agg(jsonb_build_object('name',policyname,'command',cmd,'using',qual,'check',with_check)
order by policyname)
 from pg_policies where schemaname='storage' and tablename='objects'));
"""
value = subprocess.run(
    [
        "docker",
        "exec",
        "-i",
        CONTAINER,
        "psql",
        "-X",
        "-A",
        "-t",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
    ],
    input=query,
    capture_output=True,
    text=True,
    check=True,
)
data = json.loads(value.stdout)
missing = [
    row["table"]
    for row in data["scopedTables"]
    if not (row["rls"] and row["activePolicy"] and row["writeGuard"])
]
data["missingScopedTableGuards"] = missing
out = ROOT / "docs/UI/audits/2026-11-20/system-admin-catalog.json"
out.write_text(json.dumps(data, indent=2), encoding="utf-8")
print(
    json.dumps(
        {
            "scopedTables": len(data["scopedTables"]),
            "missingGuards": missing,
            "definerFunctions": len(data["definerFunctions"]),
            "storagePolicies": len(data["storagePolicies"] or []),
        }
    )
)
if missing:
    raise SystemExit(1)
