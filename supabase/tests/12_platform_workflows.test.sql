begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(13);
select has_function('public','platform_directory',array[]::text[],'platform directory RPC exists');
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
values ('f1200000-0000-4000-8000-000000000001','platform-test@example.test',now(),'{"platform_role":"system_admin"}','{}'),
('f1200000-0000-4000-8000-000000000002','business-test@example.test',now(),'{}','{"platform_role":"system_admin"}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"f1200000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select throws_ok('select public.platform_directory()','P0001','PERMISSION_DENIED','editable metadata does not authorize platform');
select set_config('request.jwt.claims','{"sub":"f1200000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.platform_create('{"requestId":"f1200000-0000-4000-8000-000000000010","name":"Platform Test","slug":"platform-test-unique","accountEmail":"operator@gmail.com","domain":"shared.example.test","status":"Active"}')$$,'create company atomically');
select lives_ok($$select public.platform_create('{"requestId":"f1200000-0000-4000-8000-000000000010","name":"Platform Test","slug":"platform-test-unique","accountEmail":"operator@gmail.com","domain":"shared.example.test","status":"Active"}')$$,'same request is idempotent');
select throws_ok($$select public.platform_create('{"requestId":"f1200000-0000-4000-8000-000000000010","name":"Changed","slug":"platform-test-unique","accountEmail":"operator@gmail.com"}')$$,'P0001','REQUEST_CONFLICT','idempotency payload mismatch rejected');
select throws_ok($$select public.platform_create('{"requestId":"f1200000-0000-4000-8000-000000000011","name":"Another","slug":" PLATFORM-TEST-UNIQUE ","accountEmail":"operator@gmail.com"}')$$,'P0001','REQUEST_CONFLICT','normalized slug uniqueness');
select lives_ok($$select public.platform_create('{"requestId":"f1200000-0000-4000-8000-000000000012","name":"Shared domain","slug":"platform-test-second","accountEmail":"operator@gmail.com","domain":"shared.example.test"}')$$,'domain and email can be shared');
select ok(not(public.platform_directory()::text like '%user_id%'),'registry never projects member identities');
reset role;
select is((select count(*)::int from public.workspace_members where user_id='f1200000-0000-4000-8000-000000000001'),0,'operator is not a business member');
select is((select count(*)::int from platform_private.companies where slug='platform-test-unique'),1,'one company for retried create');
select is((select count(*)::int from platform_private.manager_invitations where workspace_id=(select workspace_id from platform_private.companies where slug='platform-test-unique')),1,'one invitation for retried create');
select ok(not has_table_privilege('authenticated','platform_private.companies','INSERT,UPDATE,DELETE'),'direct platform writes blocked');
select ok(not has_function_privilege('anon','public.platform_directory()','EXECUTE'),'anon RPC blocked');
select * from finish();
rollback;
