begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select has_function('public', 'admin_workspace_overview', array[]::text[], 'safe Admin overview RPC exists');
select policies_are(
  'public', 'workspace_members',
  array['workspace_members_admin_delete', 'workspace_members_admin_insert', 'workspace_members_admin_update', 'workspace_members_self_select'],
  'workspace member reads are restricted to the current user'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'multi-admin@example.test', '', '{}', '{}', now(), now()),
  ('14000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'private-member@example.test', '', '{}', '{}', now(), now()),
  ('14000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other-admin@example.test', '', '{}', '{}', now(), now());

insert into public.workspaces (id, name, owner_id) values
  ('24000000-0000-0000-0000-000000000001', 'Admin Workspace One', '14000000-0000-0000-0000-000000000001'),
  ('24000000-0000-0000-0000-000000000002', 'Admin Workspace Two', '14000000-0000-0000-0000-000000000001'),
  ('24000000-0000-0000-0000-000000000003', 'Unrelated Workspace', '14000000-0000-0000-0000-000000000003');

insert into public.workspace_members (workspace_id, user_id, role, invited_email) values
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', 'admin', null),
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000002', 'member', 'private-member@example.test'),
  ('24000000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000001', 'admin', null),
  ('24000000-0000-0000-0000-000000000003', '14000000-0000-0000-0000-000000000003', 'admin', null);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is((select count(*)::integer from public.workspace_members), 2, 'Admin can read only their own two membership rows');
select is((select count(*)::integer from public.admin_workspace_overview()), 2, 'Admin overview includes every administered workspace');
select is((select sum(member_count)::integer from public.admin_workspace_overview()), 3, 'overview returns aggregate member counts');
select is((select count(*)::integer from public.admin_workspace_overview() where workspace_name = 'Unrelated Workspace'), 0, 'overview excludes unrelated workspaces');

select * from finish();
rollback;
