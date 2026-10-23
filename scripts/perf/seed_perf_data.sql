\set ON_ERROR_STOP on
\if :{?perf_confirm}
select :'perf_confirm' = 'CastraVision-main' as perf_confirm_ok \gset
\else
\echo 'PERF GUARD: pass -v perf_confirm=CastraVision-main through the local seed wrapper.'
do $guard$ begin
  raise exception 'PERF GUARD: missing perf_confirm';
end $guard$;
\endif
\if :perf_confirm_ok
\echo 'PERF GUARD: confirmed local CastraVision-main seed.'
\else
\echo 'PERF GUARD: perf_confirm must equal CastraVision-main.'
do $guard$ begin
  raise exception 'PERF GUARD: invalid perf_confirm';
end $guard$;
\endif
\timing on

begin;
set local session_replication_role = replica;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  md5('perf-user-' || g)::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  format('perf-user-%s@example.test', g),
  '', '{}', '{}', now(), now()
from generate_series(1, 1000) as g;

insert into public.workspaces (id, name, owner_id, created_at)
select
  md5('perf-workspace-' || g)::uuid,
  format('perf-%s', lpad(g::text, 3, '0')),
  md5('perf-user-' || (((g - 1) * 5) + 1))::uuid,
  now() - ((g % 365) || ' days')::interval
from generate_series(1, 200) as g;

insert into public.workspace_members (workspace_id, user_id, role, invited_email, joined_at)
select
  md5('perf-workspace-' || w)::uuid,
  md5('perf-user-' || (((w - 1) * 5) + member_no))::uuid,
  case member_no when 1 then 'admin'::public.workspace_role
                 when 2 then 'manager'::public.workspace_role
                 else 'member'::public.workspace_role end,
  format('perf-user-%s@example.test', ((w - 1) * 5) + member_no),
  now() - ((w % 365) || ' days')::interval
from generate_series(1, 200) as w
cross join generate_series(1, 5) as member_no;

insert into public.audit_logs (
  id, workspace_id, actor_id, action, entity_type, entity_id,
  before_value, after_value, created_at
)
select
  md5('perf-audit-' || g)::uuid,
  md5('perf-workspace-' || ws)::uuid,
  md5('perf-user-' || (((ws - 1) * 5) + 1 + (row_no % 5)))::uuid,
  (array['create','update','approve','reject','delete'])[1 + (row_no % 5)],
  (array['workspaces','strategies','ad_contents','budget_proposals','workspace_members'])[1 + ((row_no / 5) % 5)],
  md5('perf-entity-' || g)::uuid,
  case when g % 5 = 0 then jsonb_build_object('status', 'old') end,
  jsonb_build_object('status', 'new', 'sequence', g),
  now() - ((g % 31536000) || ' seconds')::interval
from generate_series(1, 200000) as g
cross join lateral (
  select case when g <= 140000 then 1 + (g % 10)
              else 11 + (g % 190) end as ws,
         case when g <= 140000 then g / 10
              else (g - 140000) / 190 end as row_no
) as distribution;

insert into public.notifications (
  id, workspace_id, user_id, type, message, is_read, created_at
)
select
  md5('perf-notification-' || g)::uuid,
  md5('perf-workspace-' || ws)::uuid,
  md5('perf-user-' || (((ws - 1) * 5) + 1 + (row_no % 5)))::uuid,
  (array['approval_pending','budget_alert','campaign_update','anomaly'])[1 + (g % 4)],
  format('Performance notification %s', g),
  (g % 5) <> 0,
  now() - ((g % 31536000) || ' seconds')::interval
from generate_series(1, 100000) as g
cross join lateral (
  select case when g <= 70000 then 1 + (g % 10)
              else 11 + (g % 190) end as ws,
         case when g <= 70000 then g / 10
              else (g - 70000) / 190 end as row_no
) as distribution;

insert into public.campaign_performance (
  id, workspace_id, channel, campaign_name, ctr, cpa, roas,
  impressions, spend, record_date, source, created_at,
  clicks, conversions, revenue, source_row, created_by
)
select
  md5('perf-campaign-' || g)::uuid,
  md5('perf-workspace-' || ws)::uuid,
  (array['facebook','google','tiktok'])[1 + (g % 3)],
  format('Performance campaign %s', g % 500),
  (1 + (g % 700) / 100.0)::numeric,
  (10 + (g % 5000) / 100.0)::numeric,
  (1 + (g % 500) / 100.0)::numeric,
  1000 + (g % 100000),
  (100 + (g % 100000) / 10.0)::numeric,
  current_date - (g % 365),
  'csv_import',
  now() - ((g % 31536000) || ' seconds')::interval,
  10 + (g % 1000),
  1 + (g % 100),
  (200 + (g % 250000) / 10.0)::numeric,
  1 + g,
  md5('perf-user-' || (((ws - 1) * 5) + 1 + (g % 5)))::uuid
from generate_series(1, 300000) as g
cross join lateral (
  select case when g <= 210000 then 1 + (g % 10)
              else 11 + (g % 190) end as ws
) as distribution;

insert into public.strategy_context_embeddings (
  id, workspace_id, source_type, source_id, content, embedding, created_at
)
select
  md5('perf-embedding-' || g)::uuid,
  md5('perf-workspace-' || (1 + (g % 10)))::uuid,
  'campaign_performance',
  md5('perf-vector-source-' || g)::uuid,
  format('Performance embedding %s', g),
  ('[' || array_to_string(array(
    select (((random() * 2) - 1) + (g * 0))::real
    from generate_series(1, 1536)
  ), ',') || ']')::vector,
  now() - ((g % 31536000) || ' seconds')::interval
from generate_series(1, 10000) as g;

set local session_replication_role = origin;
commit;

analyze public.workspaces;
analyze public.workspace_members;
analyze public.audit_logs;
analyze public.notifications;
analyze public.campaign_performance;
analyze public.strategy_context_embeddings;

select 'workspaces' as table_name, count(*) as row_count from public.workspaces where name like 'perf-%'
union all select 'workspace_members', count(*) from public.workspace_members wm join public.workspaces w on w.id = wm.workspace_id where w.name like 'perf-%'
union all select 'audit_logs', count(*) from public.audit_logs al join public.workspaces w on w.id = al.workspace_id where w.name like 'perf-%'
union all select 'notifications', count(*) from public.notifications n join public.workspaces w on w.id = n.workspace_id where w.name like 'perf-%'
union all select 'campaign_performance', count(*) from public.campaign_performance cp join public.workspaces w on w.id = cp.workspace_id where w.name like 'perf-%'
union all select 'strategy_context_embeddings', count(*) from public.strategy_context_embeddings e join public.workspaces w on w.id = e.workspace_id where w.name like 'perf-%'
order by table_name;
