begin;
create extension if not exists pgtap with schema extensions;
select plan(14);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('14000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','mm-a@example.test','fixture-hash',now(),'{}','{}',now(),now()),
('14000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','employee-a@example.test','fixture-hash',now(),'{}','{}',now(),now());
-- Simulate the subsequent Auth password update, not an OTP-generated insert hash.
update auth.users set encrypted_password='fixture-password-updated' where id in
('14000000-0000-4000-8000-000000000001','14000000-0000-4000-8000-000000000002');
insert into public.workspaces(id,name,owner_id) values('24000000-0000-4000-8000-000000000001','Membership A','14000000-0000-4000-8000-000000000001');
insert into public.workspace_members(workspace_id,user_id,role) values('24000000-0000-4000-8000-000000000001','14000000-0000-4000-8000-000000000001','admin');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"14000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.membership_set_recruitment('24000000-0000-4000-8000-000000000001',true,'Public team')$$,'MM enables recruitment');
select set_config('request.jwt.claims','{"sub":"14000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((public.membership_company_directory('Membership',20,0)->>'total')::int,1,'directory lists opted-in company');
select is(public.membership_onboarding_state()->>'passwordSetupRequired','false','existing password is retained');
select lives_ok($$select public.membership_request_join('24000000-0000-4000-8000-000000000001','Interested')$$,'applicant requests joining');
select lives_ok($$select public.membership_request_join('24000000-0000-4000-8000-000000000001','Duplicate')$$,'duplicate pending is idempotent');
select is((select count(*)::int from public.workspace_join_requests),1,'one pending request');
select is((select count(*)::int from public.workspace_members where user_id=auth.uid()),0,'no membership before approval');
select throws_ok($$update public.workspace_join_requests set status='approved'$$,'42501',null,'direct approval is forbidden');
select set_config('request.jwt.claims','{"sub":"14000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select is((public.membership_list_notifications(false,20,0)->>'unreadCount')::int,1,'manager receives exactly one notification');
select lives_ok($$select public.membership_review_request('24000000-0000-4000-8000-000000000001',(select id from public.workspace_join_requests limit 1),'approve',null,'')$$,'MM approves');
select lives_ok($$select public.membership_review_request('24000000-0000-4000-8000-000000000001',(select id from public.workspace_join_requests limit 1),'approve',null,'')$$,'repeated same decision is idempotent');
select set_config('request.jwt.claims','{"sub":"14000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((select role::text from public.workspace_members where user_id=auth.uid()),'member','self-request only grants Employee');
select is((public.membership_list_notifications(false,20,0)->>'unreadCount')::int,1,'approved employee receives result');
select throws_ok($$select public.membership_set_recruitment('24000000-0000-4000-8000-000000000001',false,'')$$,'P0001','PERMISSION_DENIED','Employee cannot manage company');
select * from finish();
rollback;
