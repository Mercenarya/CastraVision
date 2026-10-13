begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'helper-admin@example.test', '', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'helper-manager@example.test', '', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'helper-member@example.test', '', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'helper-outsider@example.test', '', '{}', '{}', now(), now());

insert into public.workspaces (id, name, owner_id)
values (
  '20000000-0000-0000-0000-000000000001',
  'Helper Test Workspace',
  '10000000-0000-0000-0000-000000000001'
);

insert into public.workspace_members (workspace_id, user_id, role)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'admin'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'manager'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'member');

set local role authenticated;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select ok(public.is_workspace_member('20000000-0000-0000-0000-000000000001'), 'admin is a workspace member');
select is(public.workspace_role('20000000-0000-0000-0000-000000000001'::uuid)::text, 'admin', 'admin role is returned');
select ok(public.has_workspace_role('20000000-0000-0000-0000-000000000001', array['admin']::public.workspace_role[]), 'admin matches admin role');
select ok(not public.has_workspace_role('20000000-0000-0000-0000-000000000001', array['manager']::public.workspace_role[]), 'admin does not match manager-only role');

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select ok(public.is_workspace_member('20000000-0000-0000-0000-000000000001'), 'manager is a workspace member');
select is(public.workspace_role('20000000-0000-0000-0000-000000000001'::uuid)::text, 'manager', 'manager role is returned');
select ok(public.has_workspace_role('20000000-0000-0000-0000-000000000001', array['admin','manager']::public.workspace_role[]), 'manager matches operator roles');

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select ok(public.is_workspace_member('20000000-0000-0000-0000-000000000001'), 'member is a workspace member');
select is(public.workspace_role('20000000-0000-0000-0000-000000000001'::uuid)::text, 'member', 'member role is returned');
select ok(public.has_workspace_role('20000000-0000-0000-0000-000000000001', array['member']::public.workspace_role[]), 'member matches member role');

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
select ok(not public.is_workspace_member('20000000-0000-0000-0000-000000000001'), 'outsider is not a workspace member');
select is(public.workspace_role('20000000-0000-0000-0000-000000000001'::uuid)::text, null::text, 'outsider has no workspace role');
select ok(not public.has_workspace_role('20000000-0000-0000-0000-000000000001', array['admin','manager','member']::public.workspace_role[]), 'outsider matches no workspace role');

select ok((select p.prosecdef from pg_catalog.pg_proc as p join pg_catalog.pg_namespace as n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'is_workspace_member'), 'is_workspace_member is security definer');
select ok((select p.prosecdef from pg_catalog.pg_proc as p join pg_catalog.pg_namespace as n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'workspace_role'), 'workspace_role is security definer');
select ok((select p.prosecdef from pg_catalog.pg_proc as p join pg_catalog.pg_namespace as n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'has_workspace_role'), 'has_workspace_role is security definer');

select ok((select 'search_path=""' = any(p.proconfig) from pg_catalog.pg_proc as p join pg_catalog.pg_namespace as n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'is_workspace_member'), 'is_workspace_member pins an empty search_path');
select ok((select 'search_path=""' = any(p.proconfig) from pg_catalog.pg_proc as p join pg_catalog.pg_namespace as n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'workspace_role'), 'workspace_role pins an empty search_path');
select ok((select 'search_path=""' = any(p.proconfig) from pg_catalog.pg_proc as p join pg_catalog.pg_namespace as n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'has_workspace_role'), 'has_workspace_role pins an empty search_path');

select ok(not has_function_privilege('anon', 'public.is_workspace_member(uuid)', 'EXECUTE'), 'anon cannot execute is_workspace_member');
select ok(not has_function_privilege('anon', 'public.workspace_role(uuid)', 'EXECUTE'), 'anon cannot execute workspace_role');
select ok(not has_function_privilege('anon', 'public.has_workspace_role(uuid,public.workspace_role[])', 'EXECUTE'), 'anon cannot execute has_workspace_role');
select ok(has_function_privilege('authenticated', 'public.is_workspace_member(uuid)', 'EXECUTE'), 'authenticated can execute is_workspace_member');
select ok(has_function_privilege('authenticated', 'public.workspace_role(uuid)', 'EXECUTE'), 'authenticated can execute workspace_role');
select ok(has_function_privilege('authenticated', 'public.has_workspace_role(uuid,public.workspace_role[])', 'EXECUTE'), 'authenticated can execute has_workspace_role');

set local role anon;
select throws_ok(
  $$select public.is_workspace_member('20000000-0000-0000-0000-000000000001')$$,
  '42501',
  'permission denied for function is_workspace_member',
  'anon invocation of is_workspace_member is denied'
);
select throws_ok(
  $$select public.workspace_role('20000000-0000-0000-0000-000000000001'::uuid)$$,
  '42501',
  'permission denied for function workspace_role',
  'anon invocation of workspace_role is denied'
);
select throws_ok(
  $$select public.has_workspace_role('20000000-0000-0000-0000-000000000001', array['admin']::public.workspace_role[])$$,
  '42501',
  'permission denied for function has_workspace_role',
  'anon invocation of has_workspace_role is denied'
);

select * from finish();
rollback;
