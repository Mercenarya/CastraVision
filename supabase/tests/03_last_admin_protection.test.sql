begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('12000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'single-admin@example.test', '', '{}', '{}', now(), now()),
  ('12000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'first-admin@example.test', '', '{}', '{}', now(), now()),
  ('12000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'second-admin@example.test', '', '{}', '{}', now(), now());

insert into public.workspaces (id, name, owner_id)
values
  ('22000000-0000-0000-0000-000000000001', 'Single Admin Workspace', '12000000-0000-0000-0000-000000000001'),
  ('22000000-0000-0000-0000-000000000002', 'Two Admin Workspace', '12000000-0000-0000-0000-000000000003');

insert into public.workspace_members (workspace_id, user_id, role)
values
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'admin'),
  ('22000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000002', 'admin'),
  ('22000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000003', 'admin');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select throws_ok(
  $$delete from public.workspace_members where workspace_id = '22000000-0000-0000-0000-000000000001' and user_id = '12000000-0000-0000-0000-000000000001'$$,
  '23514',
  'LAST_ADMIN_PROTECTED: workspace must retain at least one admin',
  'deleting the last admin is blocked'
);
select throws_ok(
  $$update public.workspace_members set role = 'manager' where workspace_id = '22000000-0000-0000-0000-000000000001' and user_id = '12000000-0000-0000-0000-000000000001'$$,
  '23514',
  'LAST_ADMIN_PROTECTED: workspace must retain at least one admin',
  'demoting the last admin is blocked'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select lives_ok(
  $$update public.workspace_members set role = 'manager' where workspace_id = '22000000-0000-0000-0000-000000000002' and user_id = '12000000-0000-0000-0000-000000000002'$$,
  'one of two admins can be demoted'
);
select is(
  (select role::text from public.workspace_members where workspace_id = '22000000-0000-0000-0000-000000000002' and user_id = '12000000-0000-0000-0000-000000000002'),
  'manager',
  'the first admin is now a manager'
);
select throws_ok(
  $$update public.workspace_members set role = 'manager' where workspace_id = '22000000-0000-0000-0000-000000000002' and user_id = '12000000-0000-0000-0000-000000000003'$$,
  '23514',
  'LAST_ADMIN_PROTECTED: workspace must retain at least one admin',
  'the remaining admin cannot be demoted'
);

reset role;
select lives_ok(
  $$delete from public.workspaces where id = '22000000-0000-0000-0000-000000000002'$$,
  'deleting a workspace is allowed to cascade through memberships'
);
select ok(not exists(select 1 from public.workspaces where id = '22000000-0000-0000-0000-000000000002'), 'the workspace was deleted');
select ok(not exists(select 1 from public.workspace_members where workspace_id = '22000000-0000-0000-0000-000000000002'), 'cascade removed its memberships');

select * from finish();
rollback;
