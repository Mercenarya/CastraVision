begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '11000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'rpc-owner@example.test', '', '{}',
  '{"full_name":"RPC Owner"}', now(), now()
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  (select role::text from public.create_workspace_with_admin('  Demo Workspace  ')),
  'admin',
  'RPC returns the assigned admin role'
);
select ok(exists(select 1 from public.workspaces where name = 'Demo Workspace'), 'RPC creates a trimmed workspace name');
select ok(exists(select 1 from public.profiles where id = '11000000-0000-0000-0000-000000000001' and full_name = 'RPC Owner'), 'RPC creates or supplements the caller profile');
select ok(exists(select 1 from public.workspace_members where user_id = '11000000-0000-0000-0000-000000000001' and role = 'admin'), 'RPC creates an admin membership');
select ok(exists(select 1 from public.workspaces where owner_id = '11000000-0000-0000-0000-000000000001'), 'RPC sets owner_id to auth.uid()');

select throws_ok(
  $$select * from public.create_workspace_with_admin('Second Workspace')$$,
  '23505',
  'ALREADY_ONBOARDED: user already belongs to a workspace',
  'RPC rejects a second onboarding attempt'
);
select throws_ok(
  $$select * from public.create_workspace_with_admin('   ')$$,
  '22023',
  'WORKSPACE_NAME_INVALID: name must contain 1 to 100 characters',
  'RPC rejects a blank workspace name'
);
select throws_ok(
  $$select * from public.create_workspace_with_admin(repeat('x', 101))$$,
  '22023',
  'WORKSPACE_NAME_INVALID: name must contain 1 to 100 characters',
  'RPC rejects a workspace name longer than 100 characters'
);

select ok(not has_function_privilege('anon', 'public.create_workspace_with_admin(text)', 'EXECUTE'), 'anon has no RPC execute privilege');
select ok(not has_function_privilege('service_role', 'public.create_workspace_with_admin(text)', 'EXECUTE'), 'service_role has no onboarding RPC execute privilege');
select ok(has_function_privilege('authenticated', 'public.create_workspace_with_admin(text)', 'EXECUTE'), 'authenticated has RPC execute privilege');

set local role anon;
select throws_ok(
  $$select * from public.create_workspace_with_admin('Anonymous Workspace')$$,
  '42501',
  'permission denied for function create_workspace_with_admin',
  'anon cannot invoke the onboarding RPC'
);

select * from finish();
rollback;
