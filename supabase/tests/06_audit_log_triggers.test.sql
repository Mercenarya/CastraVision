begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('15000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'audit-admin@example.test', '', '{}', '{}', now(), now()),
  ('15000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'audit-manager@example.test', '', '{}', '{}', now(), now()),
  ('15000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'audit-member@example.test', '', '{}', '{}', now(), now()),
  ('15000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other-admin@example.test', '', '{}', '{}', now(), now()),
  ('15000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'target-member@example.test', '', '{}', '{}', now(), now());

insert into public.workspaces (id, name, owner_id)
values
  ('25000000-0000-0000-0000-000000000001', 'Audit Workspace', '15000000-0000-0000-0000-000000000001'),
  ('25000000-0000-0000-0000-000000000002', 'Other Audit Workspace', '15000000-0000-0000-0000-000000000004');

insert into public.workspace_members (workspace_id, user_id, role)
values
  ('25000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000001', 'admin'),
  ('25000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000002', 'manager'),
  ('25000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000003', 'member'),
  ('25000000-0000-0000-0000-000000000002', '15000000-0000-0000-0000-000000000004', 'admin');

-- Remove setup noise. TRUNCATE remains a superuser-only maintenance action.
truncate table public.audit_logs;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

insert into public.ad_contents (
  id, workspace_id, channel, headline, status, created_by
)
values (
  '35000000-0000-0000-0000-000000000001',
  '25000000-0000-0000-0000-000000000001',
  'facebook',
  'Audit creative',
  'draft',
  '15000000-0000-0000-0000-000000000001'
);

insert into public.budget_proposals (
  id, workspace_id, channel, current_allocation, proposed_allocation
)
values (
  '35000000-0000-0000-0000-000000000002',
  '25000000-0000-0000-0000-000000000001',
  'facebook',
  100,
  120
);

insert into public.business_profiles (
  id, workspace_id, industry, company_size
)
values (
  '35000000-0000-0000-0000-000000000003',
  '25000000-0000-0000-0000-000000000001',
  'Food & Beverage',
  'sme'
);

insert into public.workspace_members (
  workspace_id, user_id, role, invited_email
)
values (
  '25000000-0000-0000-0000-000000000001',
  '15000000-0000-0000-0000-000000000005',
  'member',
  'target-member@example.test'
);

insert into public.approvals (
  id, workspace_id, target_type, target_id, status
)
values (
  '35000000-0000-0000-0000-000000000004',
  '25000000-0000-0000-0000-000000000001',
  'ad_content',
  '35000000-0000-0000-0000-000000000001',
  'pending'
);

select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'ad_contents' and entity_id = '35000000-0000-0000-0000-000000000001' and action = 'create' and workspace_id = '25000000-0000-0000-0000-000000000001' and actor_id = '15000000-0000-0000-0000-000000000001' and before_value is null and after_value is not null),
  1,
  'ad_contents INSERT creates exactly one complete audit row'
);
select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'budget_proposals' and entity_id = '35000000-0000-0000-0000-000000000002' and action = 'create' and workspace_id = '25000000-0000-0000-0000-000000000001' and actor_id = '15000000-0000-0000-0000-000000000001' and before_value is null and after_value is not null),
  1,
  'budget_proposals INSERT creates exactly one complete audit row'
);
select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'business_profiles' and entity_id = '35000000-0000-0000-0000-000000000003' and action = 'create' and workspace_id = '25000000-0000-0000-0000-000000000001' and actor_id = '15000000-0000-0000-0000-000000000001' and before_value is null and after_value is not null),
  1,
  'business_profiles INSERT creates exactly one complete audit row'
);
select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'workspace_members' and entity_id = '15000000-0000-0000-0000-000000000005' and action = 'create' and workspace_id = '25000000-0000-0000-0000-000000000001' and actor_id = '15000000-0000-0000-0000-000000000001' and before_value is null and after_value is not null),
  1,
  'workspace_members INSERT uses the affected user_id as entity_id'
);
select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'approvals' and entity_id = '35000000-0000-0000-0000-000000000004' and action = 'create' and workspace_id = '25000000-0000-0000-0000-000000000001' and actor_id = '15000000-0000-0000-0000-000000000001' and before_value is null and after_value is not null),
  1,
  'approvals INSERT creates exactly one complete audit row'
);

update public.ad_contents
set headline = 'Updated audit creative'
where id = '35000000-0000-0000-0000-000000000001';
update public.budget_proposals
set proposed_allocation = 130
where id = '35000000-0000-0000-0000-000000000002';
update public.business_profiles
set industry = 'Retail'
where id = '35000000-0000-0000-0000-000000000003';

reset role;
create or replace function public.test_workspace_member_rpc(
  target_workspace_id uuid,
  target_user_id uuid,
  operation text,
  new_role public.workspace_role default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if operation = 'update_role' then
    update public.workspace_members
    set role = new_role
    where workspace_id = target_workspace_id
      and user_id = target_user_id;
  elsif operation = 'delete_member' then
    delete from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = target_user_id;
  else
    raise exception 'unsupported test operation: %', operation;
  end if;
end;
$$;
revoke all on function public.test_workspace_member_rpc(uuid, uuid, text, public.workspace_role) from public;
grant execute on function public.test_workspace_member_rpc(uuid, uuid, text, public.workspace_role) to authenticated;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select public.test_workspace_member_rpc(
  '25000000-0000-0000-0000-000000000001',
  '15000000-0000-0000-0000-000000000005',
  'update_role',
  'manager'
);
update public.approvals
set status = 'approved',
    reviewer_id = '15000000-0000-0000-0000-000000000001',
    reviewed_at = now()
where id = '35000000-0000-0000-0000-000000000004';

select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'ad_contents' and entity_id = '35000000-0000-0000-0000-000000000001' and action = 'update' and before_value is not null and after_value is not null),
  1,
  'ad_contents UPDATE stores before and after values'
);
select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'budget_proposals' and entity_id = '35000000-0000-0000-0000-000000000002' and action = 'update' and before_value is not null and after_value is not null),
  1,
  'budget_proposals UPDATE stores before and after values'
);
select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'business_profiles' and entity_id = '35000000-0000-0000-0000-000000000003' and action = 'update' and before_value is not null and after_value is not null),
  1,
  'business_profiles UPDATE stores before and after values'
);
select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'workspace_members' and entity_id = '15000000-0000-0000-0000-000000000005' and action = 'update'),
  1,
  'workspace_members SECURITY DEFINER role update creates exactly one log for the affected user_id'
);
select is(
  (select actor_id from public.audit_logs where entity_type = 'workspace_members' and entity_id = '15000000-0000-0000-0000-000000000005' and action = 'update'),
  '15000000-0000-0000-0000-000000000001'::uuid,
  'workspace_members SECURITY DEFINER role update retains the Admin JWT actor_id'
);
select is(
  (select before_value ->> 'role' from public.audit_logs where entity_type = 'workspace_members' and entity_id = '15000000-0000-0000-0000-000000000005' and action = 'update'),
  'member',
  'workspace_members SECURITY DEFINER role update records the old role'
);
select is(
  (select after_value ->> 'role' from public.audit_logs where entity_type = 'workspace_members' and entity_id = '15000000-0000-0000-0000-000000000005' and action = 'update'),
  'manager',
  'workspace_members SECURITY DEFINER role update records the new role'
);
select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'approvals' and entity_id = '35000000-0000-0000-0000-000000000004' and action = 'update' and before_value is not null and after_value is not null),
  1,
  'approvals UPDATE stores before and after values'
);

update public.business_profiles
set industry = industry
where id = '35000000-0000-0000-0000-000000000003';
select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'business_profiles' and entity_id = '35000000-0000-0000-0000-000000000003' and action = 'update'),
  1,
  'an UPDATE that only touches updated_at does not create an audit row'
);

reset role;
create or replace function public.test_audit_definer_update()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ad_contents
  set description = 'Changed through a definer RPC'
  where id = '35000000-0000-0000-0000-000000000001';
$$;
grant execute on function public.test_audit_definer_update() to authenticated;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select public.test_audit_definer_update();
select is(
  (select actor_id from public.audit_logs where entity_type = 'ad_contents' and entity_id = '35000000-0000-0000-0000-000000000001' and (after_value ->> 'description') = 'Changed through a definer RPC' order by created_at desc limit 1),
  '15000000-0000-0000-0000-000000000001'::uuid,
  'SECURITY DEFINER changes retain the JWT actor_id'
);

reset role;
select set_config('request.jwt.claims', '{}', true);
insert into public.budget_proposals (
  id, workspace_id, channel, current_allocation, proposed_allocation
)
values (
  '35000000-0000-0000-0000-000000000005',
  '25000000-0000-0000-0000-000000000001',
  'google',
  200,
  210
);
select is(
  (select actor_id from public.audit_logs where entity_type = 'budget_proposals' and entity_id = '35000000-0000-0000-0000-000000000005' and action = 'create'),
  null::uuid,
  'system changes without JWT store a null actor_id'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select ok((select count(*) from public.audit_logs) > 0, 'Admin can read audit logs in their workspace');

select set_config('request.jwt.claims', '{"sub":"15000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*)::integer from public.audit_logs), 0, 'Manager cannot read audit logs');

select set_config('request.jwt.claims', '{"sub":"15000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select is((select count(*)::integer from public.audit_logs), 0, 'Member cannot read audit logs');

select set_config('request.jwt.claims', '{"sub":"15000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is((select count(*)::integer from public.audit_logs), 0, 'Admin from another workspace cannot read these audit logs');

select set_config('request.jwt.claims', '{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.audit_logs (workspace_id, actor_id, action, entity_type) values ('25000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000001', 'create', 'direct')$$,
  '42501',
  'permission denied for table audit_logs',
  'authenticated cannot INSERT directly into audit_logs'
);
select throws_ok(
  $$update public.audit_logs set action = 'tampered'$$,
  '42501',
  'permission denied for table audit_logs',
  'authenticated cannot UPDATE audit_logs'
);
select throws_ok(
  $$delete from public.audit_logs$$,
  '42501',
  'permission denied for table audit_logs',
  'authenticated cannot DELETE audit_logs'
);

reset role;
select throws_ok(
  $$update public.audit_logs set action = 'tampered' where entity_type = 'ad_contents'$$,
  '55000',
  'AUDIT_LOG_IMMUTABLE: audit logs cannot be updated or deleted',
  'the immutable trigger blocks superuser UPDATE'
);
select throws_ok(
  $$delete from public.audit_logs where entity_type = 'ad_contents'$$,
  '55000',
  'AUDIT_LOG_IMMUTABLE: audit logs cannot be updated or deleted',
  'the immutable trigger blocks superuser DELETE'
);

select ok(not has_table_privilege('anon', 'public.audit_logs', 'UPDATE,DELETE,TRUNCATE'), 'anon has no mutation privileges on audit_logs');
select ok(not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT,UPDATE,DELETE,TRUNCATE'), 'authenticated has no write privileges on audit_logs');
select ok(not has_table_privilege('service_role', 'public.audit_logs', 'UPDATE,DELETE,TRUNCATE'), 'service_role cannot mutate existing audit logs');
select ok(has_table_privilege('service_role', 'public.audit_logs', 'INSERT'), 'service_role retains append privilege');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select throws_ok(
  $$select public.test_workspace_member_rpc('25000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000001', 'update_role', 'manager')$$,
  '23514',
  'LAST_ADMIN_PROTECTED: workspace must retain at least one admin',
  'last-admin protection blocks a rejected SECURITY DEFINER role change'
);
select is(
  (select count(*)::integer from public.audit_logs where entity_type = 'workspace_members' and entity_id = '15000000-0000-0000-0000-000000000001'),
  0,
  'a change rejected by the BEFORE trigger creates no audit row'
);

delete from public.approvals where id = '35000000-0000-0000-0000-000000000004';
delete from public.ad_contents where id = '35000000-0000-0000-0000-000000000001';
delete from public.budget_proposals where id = '35000000-0000-0000-0000-000000000002';
delete from public.business_profiles where id = '35000000-0000-0000-0000-000000000003';

select public.test_workspace_member_rpc(
  '25000000-0000-0000-0000-000000000001',
  '15000000-0000-0000-0000-000000000005',
  'delete_member'
);

select is((select count(*)::integer from public.audit_logs where entity_type = 'approvals' and entity_id = '35000000-0000-0000-0000-000000000004' and action = 'delete' and before_value is not null and after_value is null), 1, 'approvals DELETE stores before_value');
select is((select count(*)::integer from public.audit_logs where entity_type = 'ad_contents' and entity_id = '35000000-0000-0000-0000-000000000001' and action = 'delete' and before_value is not null and after_value is null), 1, 'ad_contents DELETE stores before_value');
select is((select count(*)::integer from public.audit_logs where entity_type = 'budget_proposals' and entity_id = '35000000-0000-0000-0000-000000000002' and action = 'delete' and before_value is not null and after_value is null), 1, 'budget_proposals DELETE stores before_value');
select is((select count(*)::integer from public.audit_logs where entity_type = 'business_profiles' and entity_id = '35000000-0000-0000-0000-000000000003' and action = 'delete' and before_value is not null and after_value is null), 1, 'business_profiles DELETE stores before_value');
select is((select count(*)::integer from public.audit_logs where entity_type = 'workspace_members' and entity_id = '15000000-0000-0000-0000-000000000005' and action = 'delete' and before_value is not null and after_value is null), 1, 'workspace_members SECURITY DEFINER delete creates one log for the affected user_id');
select is((select actor_id from public.audit_logs where entity_type = 'workspace_members' and entity_id = '15000000-0000-0000-0000-000000000005' and action = 'delete'), '15000000-0000-0000-0000-000000000001'::uuid, 'workspace_members SECURITY DEFINER delete retains the Admin JWT actor_id');

reset role;
select set_config('request.jwt.claims', '{}', true);
insert into public.workspaces (id, name, owner_id)
values ('25000000-0000-0000-0000-000000000003', 'Cascade Audit Workspace', '15000000-0000-0000-0000-000000000001');
insert into public.workspace_members (workspace_id, user_id, role)
values ('25000000-0000-0000-0000-000000000003', '15000000-0000-0000-0000-000000000001', 'admin');
insert into public.business_profiles (id, workspace_id, industry)
values ('35000000-0000-0000-0000-000000000006', '25000000-0000-0000-0000-000000000003', 'Cascade');
insert into public.ad_contents (id, workspace_id, channel, status, created_by)
values ('35000000-0000-0000-0000-000000000007', '25000000-0000-0000-0000-000000000003', 'google', 'draft', '15000000-0000-0000-0000-000000000001');
insert into public.budget_proposals (id, workspace_id, channel)
values ('35000000-0000-0000-0000-000000000008', '25000000-0000-0000-0000-000000000003', 'google');
insert into public.approvals (id, workspace_id, target_type, target_id)
values ('35000000-0000-0000-0000-000000000009', '25000000-0000-0000-0000-000000000003', 'ad_content', '35000000-0000-0000-0000-000000000007');

select lives_ok(
  $$delete from public.workspaces where id = '25000000-0000-0000-0000-000000000003'$$,
  'deleting a workspace still succeeds with every audited child table populated'
);
select ok(not exists(select 1 from public.workspaces where id = '25000000-0000-0000-0000-000000000003'), 'the cascade workspace was deleted');
select is((select count(*)::integer from public.audit_logs where workspace_id = '25000000-0000-0000-0000-000000000003'), 0, 'cascade removes that workspace audit history without creating dangling logs');

select lives_ok(
  $$select public.attach_audit_trigger('public.ad_contents'::regclass)$$,
  'attach_audit_trigger can be called once after migration'
);
select lives_ok(
  $$select public.attach_audit_trigger('public.ad_contents'::regclass)$$,
  'attach_audit_trigger is idempotent'
);
select throws_ok(
  $$select public.attach_audit_trigger('public.profiles'::regclass)$$,
  'P0001',
  'AUDIT_TRIGGER_INVALID_TARGET: public.profiles must have workspace_id',
  'attach_audit_trigger rejects a table without workspace_id'
);

select is(
  (select count(*)::integer from pg_catalog.pg_trigger as t join pg_catalog.pg_class as c on c.oid = t.tgrelid join pg_catalog.pg_namespace as n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('ad_contents','budget_proposals','approvals','workspace_members','business_profiles') and t.tgname like 'audit_%' and not t.tgisinternal),
  5,
  'all five target tables have one audit trigger'
);

select * from finish();
rollback;
