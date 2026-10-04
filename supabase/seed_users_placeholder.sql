-- Run this manually in Supabase SQL Editor after:
--   1. Applying the schema migration and supabase/seed.sql.
--   2. Creating owner@demo.castravision.vn and manager@demo.castravision.vn
--      in Authentication > Users.
-- TODO: replace every UUID_OWNER and UUID_MANAGER below with the real
--       auth.users IDs from the Dashboard. Do not run with placeholders.
-- This file is deliberately not part of the automatic migration/seed flow.

begin;

do $check$
begin
  if not exists (select 1 from auth.users where id = 'UUID_OWNER'::uuid) then
    raise exception 'UUID_OWNER does not exist in auth.users';
  end if;
  if not exists (select 1 from auth.users where id = 'UUID_MANAGER'::uuid) then
    raise exception 'UUID_MANAGER does not exist in auth.users';
  end if;
  if (select count(*) from public.workspaces where name = 'Cafe Ông Bụt') <> 1 then
    raise exception 'Expected exactly one Cafe Ông Bụt workspace';
  end if;
end;
$check$;

insert into public.profiles (id, full_name)
values
  ('UUID_OWNER'::uuid, 'Chủ quán Cafe Ông Bụt'),
  ('UUID_MANAGER'::uuid, 'Quản lý Cafe Ông Bụt')
on conflict (id) do update set full_name = excluded.full_name;

update public.workspaces
set owner_id = 'UUID_OWNER'::uuid
where name = 'Cafe Ông Bụt';

insert into public.workspace_members (workspace_id, user_id, role)
select id, 'UUID_OWNER'::uuid, 'admin'
from public.workspaces where name = 'Cafe Ông Bụt'
on conflict (workspace_id, user_id) do update set role = excluded.role;

insert into public.workspace_members (workspace_id, user_id, role)
select id, 'UUID_MANAGER'::uuid, 'manager'
from public.workspaces where name = 'Cafe Ông Bụt'
on conflict (workspace_id, user_id) do update set role = excluded.role;

update public.strategies
set created_by = 'UUID_OWNER'::uuid
where workspace_id = (select id from public.workspaces where name = 'Cafe Ông Bụt');

update public.ad_contents
set created_by = 'UUID_OWNER'::uuid
where workspace_id = (select id from public.workspaces where name = 'Cafe Ông Bụt');

update public.competitor_insights
set created_by = 'UUID_OWNER'::uuid
where workspace_id = (select id from public.workspaces where name = 'Cafe Ông Bụt');

update public.audit_logs
set actor_id = 'UUID_OWNER'::uuid
where workspace_id = (select id from public.workspaces where name = 'Cafe Ông Bụt');

update public.audit_logs
set actor_id = 'UUID_MANAGER'::uuid
where workspace_id = (select id from public.workspaces where name = 'Cafe Ông Bụt')
  and action = 'approve';

update public.reports
set requested_by = 'UUID_OWNER'::uuid
where workspace_id = (select id from public.workspaces where name = 'Cafe Ông Bụt');

update public.approvals
set reviewer_id = 'UUID_MANAGER'::uuid
where workspace_id = (select id from public.workspaces where name = 'Cafe Ông Bụt')
  and status = 'approved';

update public.notifications
set user_id = 'UUID_MANAGER'::uuid
where workspace_id = (select id from public.workspaces where name = 'Cafe Ông Bụt')
  and type = 'approval_pending';

commit;
