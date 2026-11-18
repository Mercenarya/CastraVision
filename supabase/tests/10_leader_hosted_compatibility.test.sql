begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,encrypted_password,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('91000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','compat-manager@example.test',now(),'fixture','{}','{}',now(),now()),
('91000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','compat-platform@example.test',now(),'fixture',
 '{"platform_role":"system_admin"}','{}',now(),now());
insert into public.workspaces(id,name,owner_id) values
('92000000-0000-4000-8000-000000000001','Compatibility fixture','91000000-0000-4000-8000-000000000001');
insert into public.workspace_members(workspace_id,user_id,role) values
('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','admin'),
('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000002','admin');
insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id) values
('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001',
 'create','workspaces','92000000-0000-4000-8000-000000000001');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select ok((select count(*) from public.audit_logs where workspace_id='92000000-0000-4000-8000-000000000001')>0,
 'verified Marketing Manager retains FR11 audit access');
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((select count(*)::int from public.audit_logs where workspace_id='92000000-0000-4000-8000-000000000001'),0,
 'platform actor cannot read business audit even with a legacy admin membership');
reset role;
update auth.users set email_confirmed_at=null where id='91000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select is((select count(*)::int from public.audit_logs where workspace_id='92000000-0000-4000-8000-000000000001'),0,
 'unconfirmed actor cannot read business audit');
reset role;
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='audit_logs'
  and policyname='leader_audit_actor_scope' and permissive='RESTRICTIVE'),
 'audit actor guard is restrictive and cannot broaden existing workspace policy');
select * from finish();
rollback;
