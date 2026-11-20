begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
select has_table('public','workspace_tasks','Tasks persist separately from approvals');
select has_function('public','employee_tasks',array['uuid','text','jsonb'],'Scoped task RPC exists');
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('1a000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','task-'||n||'@example.test',now(),'fixture','{}','{"role":"admin"}',now(),now() from generate_series(1,5) n;
update auth.users set encrypted_password='fixture-changed' where id::text like '1a000000-%';
insert into public.workspaces(id,name,owner_id) values
('2a000000-0000-4000-8000-000000000001','Task workspace','1a000000-0000-4000-8000-000000000001'),
('2a000000-0000-4000-8000-000000000002','Foreign task workspace','1a000000-0000-4000-8000-000000000001');
insert into public.workspace_members(workspace_id,user_id,role) values
('2a000000-0000-4000-8000-000000000001','1a000000-0000-4000-8000-000000000001','admin'),
('2a000000-0000-4000-8000-000000000001','1a000000-0000-4000-8000-000000000002','manager'),
('2a000000-0000-4000-8000-000000000001','1a000000-0000-4000-8000-000000000003','member'),
('2a000000-0000-4000-8000-000000000001','1a000000-0000-4000-8000-000000000004','member'),
('2a000000-0000-4000-8000-000000000001','1a000000-0000-4000-8000-000000000005','manager');
insert into public.workspace_teams(id,workspace_id,name) values
('3a000000-0000-4000-8000-000000000001','2a000000-0000-4000-8000-000000000001','Assigned Team'),
('3a000000-0000-4000-8000-000000000002','2a000000-0000-4000-8000-000000000001','Other Team'),
('3a000000-0000-4000-8000-000000000003','2a000000-0000-4000-8000-000000000002','Foreign Team');
insert into public.workspace_team_members(workspace_id,user_id,team_id) values
('2a000000-0000-4000-8000-000000000001','1a000000-0000-4000-8000-000000000002','3a000000-0000-4000-8000-000000000001'),
('2a000000-0000-4000-8000-000000000001','1a000000-0000-4000-8000-000000000003','3a000000-0000-4000-8000-000000000001'),
('2a000000-0000-4000-8000-000000000001','1a000000-0000-4000-8000-000000000004','3a000000-0000-4000-8000-000000000001'),
('2a000000-0000-4000-8000-000000000001','1a000000-0000-4000-8000-000000000005','3a000000-0000-4000-8000-000000000002');
insert into public.campaigns(id,workspace_id,team_id,name,budget,currency,channels,created_by,request_id) values
('4a000000-0000-4000-8000-000000000001','2a000000-0000-4000-8000-000000000001','3a000000-0000-4000-8000-000000000001','Task campaign',100,'USD',array['Meta'],'1a000000-0000-4000-8000-000000000002','5a000000-0000-4000-8000-000000000001'),
('4a000000-0000-4000-8000-000000000002','2a000000-0000-4000-8000-000000000001','3a000000-0000-4000-8000-000000000002','Other campaign',100,'USD',array['Meta'],'1a000000-0000-4000-8000-000000000005','5a000000-0000-4000-8000-000000000002');
create temp table task_state(key text primary key,value jsonb);
grant all on task_state to authenticated;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"1a000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
insert into task_state values('input','{"campaignId":"4a000000-0000-4000-8000-000000000001","assigneeId":"1a000000-0000-4000-8000-000000000003","title":"Assigned actual task","description":"Write campaign copy","dueAt":"2026-01-01T00:00:00Z","requestId":"5a000000-0000-4000-8000-000000000003"}');
insert into task_state values('task',public.employee_tasks('2a000000-0000-4000-8000-000000000001','create',(select value from task_state where key='input')));
select is((select value->>'assigned_by' from task_state where key='task'),'1a000000-0000-4000-8000-000000000002','Assigner derives from auth.uid');
select is(public.employee_tasks('2a000000-0000-4000-8000-000000000001','create',(select value from task_state where key='input'))->>'id',(select value->>'id' from task_state where key='task'),'Create request idempotent');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','create',(select value||'{"title":"Changed payload"}' from task_state where key='input'))$$,'P0001','REQUEST_CONFLICT','Changed idempotent payload denied');
select is(jsonb_array_length(public.employee_tasks('2a000000-0000-4000-8000-000000000001','candidates','{"campaignId":"4a000000-0000-4000-8000-000000000001"}')->'items'),2,'Candidates limited to Employees in campaign Team');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','create',(select value||'{"campaignId":"4a000000-0000-4000-8000-000000000002","requestId":"5a000000-0000-4000-8000-000000000004"}' from task_state where key='input'))$$,'P0001','PERMISSION_DENIED','Leader cannot assign other Team');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','create',(select value||'{"assigneeId":"1a000000-0000-4000-8000-000000000002","requestId":"5a000000-0000-4000-8000-000000000004"}' from task_state where key='input'))$$,'P0001','PERMISSION_DENIED','Cannot assign Leader as Employee');
select set_config('request.jwt.claims','{"sub":"1a000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((public.employee_tasks('2a000000-0000-4000-8000-000000000001','list')->>'total')::int,1,'Employee lists own actual tasks');
select is((public.employee_tasks('2a000000-0000-4000-8000-000000000001','summary')->>'overdue')::int,1,'Optional deadline drives actual overdue count');
select is((select count(*)::int from public.workspace_tasks),1,'Direct REST RLS exposes own task');
select throws_ok($$update public.workspace_tasks set status='completed'$$,'42501',null,'Direct writes denied');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','create',(select value from task_state where key='input'))$$,'P0001','PERMISSION_DENIED','Employee cannot self-assign even with forged metadata');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','candidates','{"campaignId":"4a000000-0000-4000-8000-000000000001"}')$$,'P0001','PERMISSION_DENIED','Employee cannot enumerate coworkers');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000002','list')$$,'P0001','PERMISSION_DENIED','Foreign workspace denied');
insert into task_state values('updated',public.employee_tasks('2a000000-0000-4000-8000-000000000001','update',jsonb_build_object('id',(select value->>'id' from task_state where key='task'),'status','in_progress','expectedVersion',1)));
select is((select value->>'status' from task_state where key='updated'),'in_progress','Employee updates own task');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','update',jsonb_build_object('id',(select value->>'id' from task_state where key='task'),'status','completed','expectedVersion',1))$$,'P0001','STALE_VERSION','Stale task update rejected');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','update',jsonb_build_object('id',(select value->>'id' from task_state where key='task'),'status','cancelled','expectedVersion',2))$$,'P0001','PERMISSION_DENIED','Employee cannot cancel assignment');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','update',jsonb_build_object('id',(select value->>'id' from task_state where key='task'),'status','completed','expectedVersion',2,'assigneeId','1a000000-0000-4000-8000-000000000004'))$$,'P0001','VALIDATION_ERROR','Employee cannot change assignee');
select set_config('request.jwt.claims','{"sub":"1a000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
insert into task_state values('coworker_proposal',public.leader_workflow('2a000000-0000-4000-8000-000000000001','submit','{"campaignId":"4a000000-0000-4000-8000-000000000001","kind":"ad_content","title":"Coworker private draft","payload":{"hook":"A real coworker hook","headline":"Coworker","body":"Body","cta":"Learn","channel":"Meta"},"requestId":"5a000000-0000-4000-8000-000000000005","submit":false}'));
select is((select count(*)::int from public.workspace_tasks),0,'Same-Team coworker cannot read another Employee task');
select is((public.employee_tasks('2a000000-0000-4000-8000-000000000001','list')->>'total')::int,0,'Same-Team coworker RPC list also empty');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','task',jsonb_build_object('id',(select value->>'id' from task_state where key='task')))$$,'P0001','NOT_FOUND','Cannot guess coworker task ID');
select set_config('request.jwt.claims','{"sub":"1a000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','update',jsonb_build_object('id',(select value->>'id' from task_state where key='task'),'status','in_progress','expectedVersion',2,'proposalId',(select value->>'id' from task_state where key='coworker_proposal')))$$,'P0001','PERMISSION_DENIED','Cannot link a coworker proposal');
insert into task_state values('own_proposal',public.leader_workflow('2a000000-0000-4000-8000-000000000001','submit','{"campaignId":"4a000000-0000-4000-8000-000000000001","kind":"ad_content","title":"Own private draft","payload":{"hook":"A real employee hook","headline":"Own draft","body":"Body","cta":"Learn","channel":"Meta"},"requestId":"5a000000-0000-4000-8000-000000000006","submit":false}'));
select lives_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','update',jsonb_build_object('id',(select value->>'id' from task_state where key='task'),'status','in_progress','expectedVersion',2,'proposalId',(select value->>'id' from task_state where key='own_proposal')))$$,'Employee can link own same-campaign proposal');
select lives_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','update',jsonb_build_object('id',(select value->>'id' from task_state where key='task'),'status','completed','expectedVersion',3))$$,'Employee completes operational task');
select is(public.leader_workflow('2a000000-0000-4000-8000-000000000001','proposal',jsonb_build_object('id',(select value->>'id' from task_state where key='own_proposal')))->>'status','draft','Completing task does not approve content');
select is((public.employee_tasks('2a000000-0000-4000-8000-000000000001','summary')->>'completed')::int,1,'Summary counts actual completion');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','update',jsonb_build_object('id',(select value->>'id' from task_state where key='task'),'status','todo','expectedVersion',4))$$,'P0001','INVALID_TRANSITION','Completed task reopens explicitly to in_progress');
select lives_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','update',jsonb_build_object('id',(select value->>'id' from task_state where key='task'),'status','in_progress','expectedVersion',4))$$,'Employee can reopen completed task');
reset role;
select is((select count(*)::int from public.audit_logs where entity_type='workspace_tasks' and workspace_id='2a000000-0000-4000-8000-000000000001'),5,'Successful changes audit once, failed/duplicate operations do not audit');
select ok(not exists(select 1 from public.audit_logs where entity_type='workspace_tasks' and action='update' and workspace_id='2a000000-0000-4000-8000-000000000001' and actor_id<>'1a000000-0000-4000-8000-000000000003'),'Definer update audit actor is Employee');
delete from public.workspace_team_members where user_id='1a000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"1a000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((select count(*)::int from public.workspace_tasks),0,'Old JWT loses task visibility after Team removal');
reset role;
insert into public.workspace_team_members values('2a000000-0000-4000-8000-000000000001','1a000000-0000-4000-8000-000000000003','3a000000-0000-4000-8000-000000000001');
update platform_private.companies set status='Inactive' where workspace_id='2a000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"1a000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((select count(*)::int from public.workspace_tasks),0,'Old JWT loses direct task visibility when Inactive');
select throws_ok($$select public.employee_tasks('2a000000-0000-4000-8000-000000000001','summary')$$,'P0001','WORKSPACE_INACTIVE','Inactive blocks RPC');
reset role;
select ok(not has_function_privilege('anon','public.employee_tasks(uuid,text,jsonb)','EXECUTE'),'Anon cannot call task RPC');
select * from finish();
rollback;
