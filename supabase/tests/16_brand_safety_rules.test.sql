begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
select has_column('public','business_profiles','brand_safety_rules','Rules are saved per workspace profile');
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('1b000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','brand-'||n||'@example.test',now(),'fixture','{}','{}',now(),now() from generate_series(1,3) n;
update auth.users set encrypted_password='fixture-changed' where id::text like '1b000000-%';
insert into public.workspaces(id,name,owner_id) values
('2b000000-0000-4000-8000-000000000001','Brand workspace','1b000000-0000-4000-8000-000000000001'),
('2b000000-0000-4000-8000-000000000002','Foreign brand workspace','1b000000-0000-4000-8000-000000000001');
insert into public.workspace_members(workspace_id,user_id,role) values
('2b000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001','admin'),
('2b000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000002','manager'),
('2b000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000003','member');
insert into public.business_profiles(workspace_id,industry) values('2b000000-0000-4000-8000-000000000001','Retail'),('2b000000-0000-4000-8000-000000000002','Private');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"1b000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select lives_ok($$update public.business_profiles set brand_safety_rules=jsonb_set(brand_safety_rules,'{bannedTerms}','["Example phrase"]') where workspace_id='2b000000-0000-4000-8000-000000000001'$$,'MM saves real rules');
select throws_ok($$update public.business_profiles set brand_safety_rules='{}' where workspace_id='2b000000-0000-4000-8000-000000000001'$$,'23514',null,'Invalid direct REST config rejected by constraint');
select throws_ok($$update public.business_profiles set brand_safety_rules=jsonb_set(brand_safety_rules,'{warnPersonalData}','"false"') where workspace_id='2b000000-0000-4000-8000-000000000001'$$,'23514',null,'String boolean rejected');
select throws_ok($$update public.business_profiles set brand_safety_rules=jsonb_set(brand_safety_rules,'{bannedTerms}','["same","same"]') where workspace_id='2b000000-0000-4000-8000-000000000001'$$,'23514',null,'Duplicate literal rules rejected');
select set_config('request.jwt.claims','{"sub":"1b000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((select brand_safety_rules->'bannedTerms' from public.business_profiles where workspace_id='2b000000-0000-4000-8000-000000000001'),'["Example phrase"]'::jsonb,'Employee reads saved own-workspace rules');
with changed as(update public.business_profiles set brand_safety_rules=jsonb_set(brand_safety_rules,'{bannedTerms}','[]') returning id) select is(count(*)::int,0,'Employee direct writes affect no row') from changed;
select is((select count(*)::int from public.business_profiles where workspace_id='2b000000-0000-4000-8000-000000000002'),0,'Foreign rules remain private');
select set_config('request.jwt.claims','{"sub":"1b000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
with changed as(update public.business_profiles set brand_safety_rules=jsonb_set(brand_safety_rules,'{bannedTerms}','[]') returning id) select is(count(*)::int,0,'Leader cannot overwrite MM rules') from changed;
reset role;
select ok(exists(select 1 from public.audit_logs where workspace_id='2b000000-0000-4000-8000-000000000001' and entity_type='business_profiles' and action='update' and actor_id='1b000000-0000-4000-8000-000000000001' and after_value->'brand_safety_rules'->'bannedTerms'='["Example phrase"]'::jsonb),'Rule changes audited with MM actor');
update platform_private.companies set status='Inactive' where workspace_id='2b000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"1b000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((select count(*)::int from public.business_profiles),0,'Inactive hides rules from previously issued JWT');
reset role;
select * from finish();
rollback;
