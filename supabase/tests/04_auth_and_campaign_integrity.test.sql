begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not c.relrowsecurity
  ),
  0,
  'every public application table has row level security enabled'
);
select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not exists (
        select 1 from pg_policy as p where p.polrelid = c.oid
      )
  ),
  0,
  'every public application table has at least one RLS policy'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'import-member@example.test', '', '{}', '{"full_name":"Import Member"}', now(), now()),
  ('13000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'import-outsider@example.test', '', '{}', '{}', now(), now());

select ok(
  exists(select 1 from public.profiles where id = '13000000-0000-0000-0000-000000000001' and full_name = 'Import Member'),
  'auth user creation automatically creates the application profile'
);
select ok(
  exists(select 1 from public.profiles where id = '13000000-0000-0000-0000-000000000002'),
  'profile trigger also handles users without metadata'
);

update auth.users set email_confirmed_at=now() where id::text like '13000000-%';
insert into public.workspaces (id, name, owner_id)
values ('23000000-0000-0000-0000-000000000001', 'Campaign Import Workspace', '13000000-0000-0000-0000-000000000001');
insert into public.workspace_members (workspace_id, user_id, role)
values ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'member');
insert into public.workspace_teams(id,workspace_id,name)
values('43000000-0000-4000-8000-000000000001','23000000-0000-0000-0000-000000000001','Import team');
insert into public.workspace_team_members(workspace_id,user_id,team_id)
values('23000000-0000-0000-0000-000000000001','13000000-0000-0000-0000-000000000001','43000000-0000-4000-8000-000000000001');
insert into public.campaigns(id,workspace_id,team_id,name,budget,currency,channels,created_by,request_id)
values('53000000-0000-4000-8000-000000000001','23000000-0000-0000-0000-000000000001','43000000-0000-4000-8000-000000000001','Valid import',1000000,'VND',array['Meta'],'13000000-0000-0000-0000-000000000001','63000000-0000-4000-8000-000000000001');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.campaign_performance'::regclass),
  'campaign performance RLS is enabled'
);
select policies_are(
  'public',
  'campaign_performance',
  array[
    'campaign_performance_member_insert',
    'campaign_performance_member_select',
    'campaign_performance_operator_delete',
    'campaign_performance_operator_update',
    'workflow_team_scope',
    'workflow_rpc_update',
    'workflow_rpc_delete'
  ],
  'campaign performance has the complete least-privilege policy set'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"13000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.leader_workflow('23000000-0000-0000-0000-000000000001','import',jsonb_build_object(
    'campaignId','53000000-0000-4000-8000-000000000001','batchId','33000000-0000-0000-0000-000000000001','filename','valid.csv',
    'rows',jsonb_build_array(jsonb_build_object('channel','facebook','spend',500000,'impressions',1000,'clicks',25,'conversions',10,'revenue',1600000,'record_date',current_date))))$$,
  'workspace member imports a valid campaign row through its assigned Team RPC'
);
select is(
  (select count(*)::integer from public.campaign_performance where campaign_name = 'Valid import'),
  1,
  'member can read the inserted campaign row'
);
select is(
  (select clicks::integer from public.campaign_performance where campaign_name = 'Valid import'),
  25,
  'raw clicks are stored without lossy reconstruction'
);
select is(
  (select conversions::integer from public.campaign_performance where campaign_name = 'Valid import'),
  10,
  'raw conversions are stored'
);

-- Constraint checks run as fixture owner: authenticated raw writes are now
-- deliberately denied, which must not mask validation-constraint regressions.
reset role;
select throws_ok(
  $$insert into public.campaign_performance (
      workspace_id, channel, spend, impressions, clicks, conversions, revenue,
      record_date, created_by
    ) values (
      '23000000-0000-0000-0000-000000000001', 'facebook', -1, 100, 10, 1, 1,
      current_date, '13000000-0000-0000-0000-000000000001'
    )$$,
  '23514',
  null,
  'negative spend is rejected by a database constraint'
);
select throws_ok(
  $$insert into public.campaign_performance (
      workspace_id, channel, spend, impressions, clicks, conversions, revenue,
      record_date, created_by
    ) values (
      '23000000-0000-0000-0000-000000000001', 'facebook', 1, 10, 11, 1, 1,
      current_date, '13000000-0000-0000-0000-000000000001'
    )$$,
  '23514',
  null,
  'clicks greater than impressions are rejected'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"13000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select throws_ok(
  $$insert into public.campaign_performance (
      workspace_id, channel, spend, impressions, clicks, conversions, revenue,
      record_date, created_by
    ) values (
      '23000000-0000-0000-0000-000000000001', 'facebook', 1, 100, 1, 1, 1,
      current_date, '13000000-0000-0000-0000-000000000002'
    )$$,
  '42501',
  null,
  'an outsider cannot import data into another workspace'
);

select has_column('public', 'campaign_performance', 'import_batch_id', 'campaign imports have a batch identifier');
select has_column('public', 'campaign_performance', 'source_filename', 'campaign imports retain source provenance');

select * from finish();
rollback;
