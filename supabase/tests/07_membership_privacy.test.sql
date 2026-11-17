begin;
create extension if not exists pgtap with schema extensions;
select plan(15);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('15000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','manager-a@example.test','fixture-hash',now(),'{}','{}',now(),now()),
('15000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','candidate@example.test','fixture-hash',now(),'{}','{"role":"system_admin"}',now(),now()),
('15000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','manager-b@example.test','fixture-hash',now(),'{}','{}',now(),now()),
('15000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','otp-only@example.test','',now(),'{}','{}',now(),now());
update auth.users set encrypted_password='fixture-password-updated'
where id in ('15000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000002','15000000-0000-4000-8000-000000000003');
insert into public.workspaces(id,name,owner_id) values
('25000000-0000-4000-8000-000000000001','Visible A','15000000-0000-4000-8000-000000000001'),
('25000000-0000-4000-8000-000000000002','Hidden B','15000000-0000-4000-8000-000000000003');
insert into public.workspace_members(workspace_id,user_id,role) values
('25000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000001','admin'),
('25000000-0000-4000-8000-000000000002','15000000-0000-4000-8000-000000000003','admin');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"15000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.membership_set_recruitment('25000000-0000-4000-8000-000000000001',true,'Public only');
select throws_ok($$insert into public.workspace_members(workspace_id,user_id,role) values('25000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000002','admin')$$,'42501',null,'MM cannot bypass RPC to create another MM');
select throws_ok($$select public.membership_invite('25000000-0000-4000-8000-000000000001','candidate@example.test','admin',null)$$,'P0001','VALIDATION_ERROR','MM cannot invite privileged role');
select lives_ok($$select public.membership_invite('25000000-0000-4000-8000-000000000001','candidate@example.test','member',null)$$,'MM creates invitation');
select throws_ok($$select public.membership_record_delivery((select id from public.workspace_invitations limit 1),gen_random_uuid(),true)$$,'42501',null,'caller cannot forge email delivery acknowledgment');
select set_config('request.jwt.claims','{"sub":"15000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((select count(*)::int from public.workspace_invitations),0,'other company MM cannot see invitation email');
select throws_ok($$select public.membership_personnel('25000000-0000-4000-8000-000000000001','requests','','','','', 'newest',20,0)$$,'22P02',null,'malformed team UUID fails closed');
select throws_ok($$select public.membership_personnel('25000000-0000-4000-8000-000000000001','requests','','','',null,'newest',20,0)$$,'P0001','PERMISSION_DENIED','other MM cannot inspect requests');
select set_config('request.jwt.claims','{"sub":"15000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
select is(public.membership_onboarding_state()->>'passwordSetupRequired','true','OTP user must set password');
select throws_ok($$select public.membership_request_join('25000000-0000-4000-8000-000000000001','hello')$$,'P0001','PASSWORD_SETUP_REQUIRED','password gate also enforced on RPC');
select set_config('request.jwt.claims','{"sub":"15000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((public.membership_company_directory('',20,0)->>'total')::int,1,'closed company not listed');
select ok(not ((public.membership_company_directory('',20,0)->'items'->0) ? 'owner_id'),'directory hides owner');
select lives_ok($$select public.membership_accept_invitation((select id from public.workspace_invitations limit 1))$$,'matching verified email accepts invitation');
select lives_ok($$select public.membership_accept_invitation((select id from public.workspace_invitations limit 1))$$,'repeated accept is safe');
select is((select role::text from public.workspace_members where user_id=auth.uid()),'member','editable metadata did not grant System Admin');
select throws_ok($$select public.create_workspace_with_admin('Bypass')$$,'42501',null,'self bootstrap revoked');
select * from finish();
rollback;
