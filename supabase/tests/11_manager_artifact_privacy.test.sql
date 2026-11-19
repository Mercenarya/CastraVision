begin;
create extension if not exists pgtap with schema extensions;
select plan(8);
insert into auth.users(id,email,aud,role,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
values
('19000000-0000-0000-0000-000000000001','artifact-mm@example.test','authenticated','authenticated',now(),'{}','{}'),
('19000000-0000-0000-0000-000000000002','artifact-leader@example.test','authenticated','authenticated',now(),'{}','{}'),
('19000000-0000-0000-0000-000000000003','artifact-employee@example.test','authenticated','authenticated',now(),'{}','{}'),
('19000000-0000-0000-0000-000000000004','artifact-other@example.test','authenticated','authenticated',now(),'{}','{}');
insert into public.workspaces(id,name,owner_id) values
('29000000-0000-0000-0000-000000000001','Artifact workspace','19000000-0000-0000-0000-000000000001'),
('29000000-0000-0000-0000-000000000002','Other artifact workspace','19000000-0000-0000-0000-000000000004');
insert into public.workspace_members(workspace_id,user_id,role) values
('29000000-0000-0000-0000-000000000001','19000000-0000-0000-0000-000000000001','admin'),
('29000000-0000-0000-0000-000000000001','19000000-0000-0000-0000-000000000002','manager'),
('29000000-0000-0000-0000-000000000001','19000000-0000-0000-0000-000000000003','member'),
('29000000-0000-0000-0000-000000000002','19000000-0000-0000-0000-000000000004','admin');
insert into public.reports(id,workspace_id,format,status,requested_by,params) values
('39000000-0000-0000-0000-000000000001','29000000-0000-0000-0000-000000000001','csv','ready','19000000-0000-0000-0000-000000000001','{"source":"marketing_manager_v1","artifact":"Zml4dHVyZQ=="}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"19000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is((select count(*) from public.reports where id='39000000-0000-0000-0000-000000000001'),1::bigint,'MM reads stored artifact');
select ok(public.membership_manager_tools_ready('29000000-0000-0000-0000-000000000001'),'MM capability enabled');
select set_config('request.jwt.claims','{"sub":"19000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select is((select count(*) from public.reports where id='39000000-0000-0000-0000-000000000001'),0::bigint,'Leader cannot read artifact directly');
select ok(not public.membership_manager_tools_ready('29000000-0000-0000-0000-000000000001'),'Leader capability denied');
select set_config('request.jwt.claims','{"sub":"19000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select is((select count(*) from public.reports where id='39000000-0000-0000-0000-000000000001'),0::bigint,'Employee cannot read artifact directly');
select set_config('request.jwt.claims','{"sub":"19000000-0000-0000-0000-000000000004","role":"authenticated"}',true);
select is((select count(*) from public.reports where id='39000000-0000-0000-0000-000000000001'),0::bigint,'Other MM cannot read artifact directly');
select ok(not public.membership_manager_tools_ready('29000000-0000-0000-0000-000000000001'),'Cross workspace capability denied');
reset role;
select has_index('public','competitor_insights','idx_competitor_workspace_keyword_unique','Registry uniqueness enforced by DB');
select * from finish();
rollback;
