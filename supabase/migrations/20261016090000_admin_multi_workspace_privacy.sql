-- Admins may manage multiple workspaces, but client queries must not expose
-- another member's user id or invited email. Aggregate oversight is provided
-- through a deliberately narrow security-definer function.

drop policy if exists "workspace_members_member_select" on public.workspace_members;
drop policy if exists "workspace_members_self_select" on public.workspace_members;

create policy "workspace_members_self_select"
on public.workspace_members
for select
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.admin_workspace_overview()
returns table (
  workspace_id uuid,
  workspace_name text,
  workspace_created_at timestamptz,
  member_count bigint,
  admin_count bigint,
  manager_count bigint,
  standard_member_count bigint,
  last_activity_at timestamptz
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    w.id,
    w.name,
    w.created_at,
    members.member_count,
    members.admin_count,
    members.manager_count,
    members.standard_member_count,
    greatest(
      w.created_at,
      coalesce(activity.last_campaign_at, w.created_at),
      coalesce(activity.last_audit_at, w.created_at)
    )
  from public.workspaces w
  join public.workspace_members caller
    on caller.workspace_id = w.id
   and caller.user_id = (select auth.uid())
   and caller.role = 'admin'
  cross join lateral (
    select
      count(*) as member_count,
      count(*) filter (where role = 'admin') as admin_count,
      count(*) filter (where role = 'manager') as manager_count,
      count(*) filter (where role = 'member') as standard_member_count
    from public.workspace_members member_rows
    where member_rows.workspace_id = w.id
  ) members
  cross join lateral (
    select
      (select max(cp_rows.created_at) from public.campaign_performance cp_rows where cp_rows.workspace_id = w.id) as last_campaign_at,
      (select max(al_rows.created_at) from public.audit_logs al_rows where al_rows.workspace_id = w.id) as last_audit_at
  ) activity
  order by w.created_at asc;
$$;

revoke all on function public.admin_workspace_overview() from public;
grant execute on function public.admin_workspace_overview() to authenticated;
grant execute on function public.admin_workspace_overview() to service_role;

comment on function public.admin_workspace_overview() is
  'PII-free aggregate workspace status for users who are admins of each returned workspace.';
