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

insert into public.workspaces (id, name, owner_id)
values ('23000000-0000-0000-0000-000000000001', 'Campaign Import Workspace', '13000000-0000-0000-0000-000000000001');
insert into public.workspace_members (workspace_id, user_id, role)
values ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'member');

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
    'campaign_performance_operator_update'
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
  $$insert into public.campaign_performance (
      workspace_id, channel, campaign_name, ctr, cpa, roas, impressions,
      spend, record_date, source, clicks, conversions, revenue,
      import_batch_id, source_filename, source_row, created_by
    ) values (
      '23000000-0000-0000-0000-000000000001', 'facebook', 'Valid import',
      2.5, 50000, 3.2, 1000, 500000, current_date, 'csv_import',
      25, 10, 1600000, '33000000-0000-0000-0000-000000000001',
      'valid.csv', 2, '13000000-0000-0000-0000-000000000001'
    )$$,
  'workspace member can import a valid campaign row'
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
