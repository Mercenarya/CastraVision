begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
select has_function('public','leader_workflow',array['uuid','text','jsonb'],
  'Leader workflow executes authenticated scoped commands');
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('19000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','workflow-'||n||'@example.test',now(),'fixture','{}','{}',now(),now()
from generate_series(1,7) n;
update auth.users set encrypted_password='fixture-updated' where id::text like '19000000-%';
insert into public.workspaces(id,name,owner_id) values
('29000000-0000-4000-8000-000000000001','Workflow A','19000000-0000-4000-8000-000000000001'),
('29000000-0000-4000-8000-000000000002','Workflow B','19000000-0000-4000-8000-000000000006');
insert into public.workspace_members(workspace_id,user_id,role) values
('29000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000001','admin'),
('29000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000002','manager'),
('29000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000003','manager'),
('29000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000004','member'),
('29000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000005','member'),
('29000000-0000-4000-8000-000000000002','19000000-0000-4000-8000-000000000006','admin'),
('29000000-0000-4000-8000-000000000002','19000000-0000-4000-8000-000000000007','manager');
insert into public.workspace_teams(id,workspace_id,name) values
('39000000-0000-4000-8000-000000000001','29000000-0000-4000-8000-000000000001','Alpha'),
('39000000-0000-4000-8000-000000000002','29000000-0000-4000-8000-000000000001','Beta'),
('39000000-0000-4000-8000-000000000003','29000000-0000-4000-8000-000000000002','Other');
insert into public.workspace_team_members(workspace_id,user_id,team_id) values
('29000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000002','39000000-0000-4000-8000-000000000001'),
('29000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000003','39000000-0000-4000-8000-000000000002'),
('29000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000004','39000000-0000-4000-8000-000000000001'),
('29000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000005','39000000-0000-4000-8000-000000000002'),
('29000000-0000-4000-8000-000000000002','19000000-0000-4000-8000-000000000007','39000000-0000-4000-8000-000000000003');
create temp table workflow_test_state(key text primary key,value jsonb);
grant all on workflow_test_state to authenticated;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"19000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is(jsonb_array_length(public.leader_workflow('29000000-0000-4000-8000-000000000001','context')->'teams'),1,'Leader sees assigned Team only');
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000002','context')$$,'P0001','PERMISSION_DENIED','foreign workspace denied');
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','create_campaign','{"teamId":"39000000-0000-4000-8000-000000000002","name":"Forbidden","budget":100,"currency":"USD","channels":["Meta"],"requestId":"49000000-0000-4000-8000-000000000001"}')$$,'P0001','PERMISSION_DENIED','foreign Team denied');
insert into workflow_test_state values('campaign',public.leader_workflow('29000000-0000-4000-8000-000000000001','create_campaign','{"teamId":"39000000-0000-4000-8000-000000000001","name":"Actual Campaign","budget":1000,"currency":"USD","channels":["Meta","Google Ads"],"requestId":"49000000-0000-4000-8000-000000000001"}'));
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','campaigns')->>'total')::int,1,'campaign persisted and read back');
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','create_campaign','{"teamId":"39000000-0000-4000-8000-000000000001","name":"Actual Campaign","budget":1000,"currency":"USD","channels":["Meta","Google Ads"],"requestId":"49000000-0000-4000-8000-000000000001"}')->>'id'),(select value->>'id' from workflow_test_state where key='campaign'),'duplicate create is idempotent');
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','context','{"role":"admin"}')$$,'P0001','VALIDATION_ERROR','caller cannot inject role');
select is((select count(*)::int from public.campaigns),1,'RLS exposes assigned campaign');
select throws_ok($$update public.campaigns set budget=2000$$,'42501',null,'client cannot bypass workflow RPC');
select set_config('request.jwt.claims','{"sub":"19000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((select count(*)::int from public.campaigns),0,'same workspace other Leader cannot read campaign');
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','campaigns')->>'total')::int,0,'RPC also hides other Team campaign');
select set_config('request.jwt.claims','{"sub":"19000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','create_campaign','{"teamId":"39000000-0000-4000-8000-000000000001","name":"Employee","budget":100,"currency":"USD","channels":["Meta"],"requestId":"49000000-0000-4000-8000-000000000003"}')$$,'P0001','PERMISSION_DENIED','Employee cannot create campaigns');
insert into workflow_test_state values('content',public.leader_workflow('29000000-0000-4000-8000-000000000001','submit',jsonb_build_object('campaignId',(select value->>'id' from workflow_test_state where key='campaign'),'kind','ad_content','title','Employee Content','requestId','49000000-0000-4000-8000-000000000004','payload',jsonb_build_object('hook','A real audited hook','headline','Original','body','Body text','cta','Learn more','channel','Meta'))));
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','proposals','{"mine":true}')->>'total')::int,1,'Employee own proposal read back');
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','decide',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='content'),'decision','approve','expectedVersion',1,'requestId','49000000-0000-4000-8000-000000000005'))$$,'P0001','PERMISSION_DENIED','Employee cannot approve');
select set_config('request.jwt.claims','{"sub":"19000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','proposals','{"mine":true}')->>'total')::int,0,'My Proposals excludes other authors');
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','notifications')->>'unreadCount')::int,1,'assigned Leader notified');
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','decide',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='content'),'decision','revision','expectedVersion',1,'note','','requestId','49000000-0000-4000-8000-000000000005'))$$,'P0001','REASON_REQUIRED','revision requires nonempty reason');
select lives_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','revise',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='content'),'expectedVersion',1,'payload',jsonb_build_object('hook','An updated audited hook','headline','Edited persistent headline','body','Body text','cta','Learn more','channel','Meta')))$$,'Leader saves actual revision');
select is(public.leader_workflow('29000000-0000-4000-8000-000000000001','proposal',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='content')))->'payload'->>'headline','Edited persistent headline','detail reread retains edit');
select is(jsonb_array_length(public.leader_workflow('29000000-0000-4000-8000-000000000001','proposal',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='content')))->'history'),2,'real two-version history');
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','decide',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='content'),'decision','approve','expectedVersion',1,'requestId','49000000-0000-4000-8000-000000000005'))$$,'P0001','STALE_VERSION','stale review is rejected');
select is(public.leader_workflow('29000000-0000-4000-8000-000000000001','decide',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='content'),'decision','approve','expectedVersion',2,'requestId','49000000-0000-4000-8000-000000000005'))->>'status','approved','approval is persisted');
select is(public.leader_workflow('29000000-0000-4000-8000-000000000001','decide',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='content'),'decision','approve','expectedVersion',2,'requestId','49000000-0000-4000-8000-000000000005'))->>'status','approved','same approval request is idempotent');
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','decide',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='content'),'decision','reject','expectedVersion',3,'note','Contradiction','requestId','49000000-0000-4000-8000-000000000006'))$$,'P0001','INVALID_TRANSITION','contradictory second decision rejected');
insert into workflow_test_state values('own',public.leader_workflow('29000000-0000-4000-8000-000000000001','submit',jsonb_build_object('campaignId',(select value->>'id' from workflow_test_state where key='campaign'),'kind','ad_content','title','Own Content','requestId','49000000-0000-4000-8000-000000000007','payload',jsonb_build_object('hook','A real own content hook','headline','Own','body','Own body','cta','Learn more','channel','Meta'))));
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','decide',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='own'),'decision','approve','expectedVersion',1,'requestId','49000000-0000-4000-8000-000000000008'))$$,'P0001','SELF_APPROVAL_FORBIDDEN','Leader cannot approve own submission');
select set_config('request.jwt.claims','{"sub":"19000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
insert into workflow_test_state values('budget',public.leader_workflow('29000000-0000-4000-8000-000000000001','submit',jsonb_build_object('campaignId',(select value->>'id' from workflow_test_state where key='campaign'),'kind','budget_proposal','title','Budget over threshold','requestId','49000000-0000-4000-8000-000000000009','payload','{"totalBudget":1000,"allocations":[{"channel":"Meta","current":500,"proposed":700},{"channel":"Google Ads","current":500,"proposed":300}]}'::jsonb)));
select set_config('request.jwt.claims','{"sub":"19000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','decide',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='budget'),'decision','approve','expectedVersion',1,'requestId','49000000-0000-4000-8000-000000000010'))$$,'P0001','BUDGET_ESCALATION_REQUIRED','server enforces budget threshold');
select is(public.leader_workflow('29000000-0000-4000-8000-000000000001','decide',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='budget'),'decision','escalate','note','Budget exceeds authority','expectedVersion',1,'requestId','49000000-0000-4000-8000-000000000010'))->>'status','escalated','escalation is persisted');
select set_config('request.jwt.claims','{"sub":"19000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select is(public.leader_workflow('29000000-0000-4000-8000-000000000001','decide',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='budget'),'decision','approve','expectedVersion',2,'requestId','49000000-0000-4000-8000-000000000011'))->>'status','approved','Marketing Manager can resolve escalation');
select is((select count(*)::int from public.audit_logs where entity_type='approvals' and entity_id=(select (value->>'id')::uuid from workflow_test_state where key='budget') and actor_id='19000000-0000-4000-8000-000000000001' and after_value->>'status'='approved'),1,'approval decision is also recorded in the existing FR11 audit ledger');
select set_config('request.jwt.claims','{"sub":"19000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
insert into workflow_test_state values('import',jsonb_build_object('campaignId',(select value->>'id' from workflow_test_state where key='campaign'),'batchId','59000000-0000-4000-8000-000000000001','filename','test.csv','rows',jsonb_build_array(jsonb_build_object('channel','facebook','record_date',current_date,'spend',100,'impressions',1000,'clicks',20,'conversions',2,'revenue',250))));
select lives_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','import',(select value from workflow_test_state where key='import'))$$,'real import succeeds');
select lives_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','import',(select value from workflow_test_state where key='import'))$$,'repeat import is idempotent');
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','import',jsonb_set((select value from workflow_test_state where key='import'),'{rows,0,spend}','999'))$$,'P0001','REQUEST_CONFLICT','same batch with different metric cannot replay');
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','analytics')->>'spend')::numeric,0::numeric,'workspace VND summary does not mix USD metrics');
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','submit',jsonb_build_object('campaignId',(select value->>'id' from workflow_test_state where key='campaign'),'kind','budget_proposal','title','Invalid null allocation','requestId','49000000-0000-4000-8000-000000000099','payload','{"totalBudget":1000,"allocations":[{"channel":"Meta","current":700,"proposed":null},{"channel":"Google Ads","current":300,"proposed":1000}]}'::jsonb))$$,'P0001','VALIDATION_ERROR','NULL budget allocation rejected');
select is((select count(*)::int from public.campaign_performance where import_batch_id='59000000-0000-4000-8000-000000000001'),1,'one persisted metric row');
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','imports')->'items'->0->>'row_count')::int,1,'import history counts stored rows rather than a truncated client sample');
insert into workflow_test_state values('bad_import',jsonb_set(jsonb_set((select value from workflow_test_state where key='import'),'{batchId}','"59000000-0000-4000-8000-000000000099"'),'{rows}',
  (select value->'rows' from workflow_test_state where key='import') || jsonb_build_array(jsonb_build_object('channel','facebook','record_date',current_date,'spend',-1,'impressions',100,'clicks',5,'conversions',1,'revenue',20))));
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','import',(select value from workflow_test_state where key='bad_import'))$$,'P0001','VALIDATION_ERROR','invalid later row rejects the entire batch');
select is((select count(*)::int from public.campaign_performance where import_batch_id='59000000-0000-4000-8000-000000000099'),0,'no partial import rows survive a failed batch');
insert into workflow_test_state values('pause',public.leader_workflow('29000000-0000-4000-8000-000000000001','submit',jsonb_build_object('campaignId',(select value->>'id' from workflow_test_state where key='campaign'),'kind','pause_variant','title','Pause request','requestId','49000000-0000-4000-8000-000000000097','submit',true,'payload',jsonb_build_object('variantId',(select value->>'target_id' from workflow_test_state where key='content'),'reason','Review low performance'))));
select is((select value->>'status' from workflow_test_state where key='pause'),'pending','Pause is a governance request, not a fake applied action');
select is((select status from public.ad_contents where id=(select (value->>'target_id')::uuid from workflow_test_state where key='content')),'approved','Pause request does not change provider or content publishing status');
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','analytics',jsonb_build_object('campaignId',(select value->>'id' from workflow_test_state where key='campaign')))->>'spend')::numeric,100::numeric,'actual observed spend aggregate');
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','analytics',jsonb_build_object('campaignId',(select value->>'id' from workflow_test_state where key='campaign')))->>'roas')::numeric,2.5::numeric,'actual weighted ROAS');
select lives_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','save_profile','{"fullName":"Leader Actual Name","avatarUrl":""}')$$,'own personal profile saved');
select is(public.leader_workflow('29000000-0000-4000-8000-000000000001','profile')->>'fullName','Leader Actual Name','own profile retained');
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','save_profile','{"fullName":"Spoof","role":"admin"}')$$,'P0001','VALIDATION_ERROR','profile cannot change role');
insert into workflow_test_state values('draft',public.leader_workflow('29000000-0000-4000-8000-000000000001','submit',jsonb_build_object('campaignId',(select value->>'id' from workflow_test_state where key='campaign'),'kind','ad_content','title','Private draft','requestId','49000000-0000-4000-8000-000000000098','submit',false,'payload',jsonb_build_object('hook','Private draft hook','headline','Draft headline','body','Private body','cta','Read more','channel','Meta'))));
select is((select status from public.ad_contents where id=(select (value->>'target_id')::uuid from workflow_test_state where key='draft')),'draft','content entity and approval agree on draft status');
select set_config('request.jwt.claims','{"sub":"19000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select is((select count(*)::int from public.approvals where id=(select (value->>'id')::uuid from workflow_test_state where key='draft')),0,'other author draft hidden through direct REST RLS');
select is((select count(*)::int from public.ad_contents where id=(select (value->>'target_id')::uuid from workflow_test_state where key='draft')),0,'draft target also hidden through direct REST RLS');
select is((select count(*)::int from public.proposal_revisions where approval_id=(select (value->>'id')::uuid from workflow_test_state where key='draft')),0,'private draft history hidden');
select set_config('request.jwt.claims','{"sub":"19000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((select count(*)::int from public.campaign_performance where import_batch_id='59000000-0000-4000-8000-000000000001'),0,'other Team raw metrics hidden');
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','analytics')->>'spend')::numeric,0::numeric,'other Team aggregates hidden');
select throws_ok($$select public.leader_workflow('29000000-0000-4000-8000-000000000001','proposal',jsonb_build_object('id',(select value->>'id' from workflow_test_state where key='content')))$$,'P0001','PERMISSION_DENIED','detail IDOR across Team denied');
select is((public.leader_workflow('29000000-0000-4000-8000-000000000001','notifications')->>'unreadCount')::int,0,'notifications not leaked to other Team');
reset role;
select ok(not has_function_privilege('anon','public.leader_workflow(uuid,text,jsonb)','EXECUTE'),'anon cannot execute workflow');
select ok(not has_table_privilege('authenticated','public.proposal_revisions','INSERT,UPDATE,DELETE'),'revision history has no direct client write grant');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"19000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
with changed as (update public.ad_contents set team_id=null,campaign_id=null,status='rejected'
  where id=(select (value->>'target_id')::uuid from workflow_test_state where key='content') returning id)
select is((select count(*)::int from changed),0,'Marketing Manager cannot detach scoped content to bypass workflow');
with changed as (update public.approvals set team_id=null,campaign_id=null,status='rejected'
  where id=(select (value->>'id')::uuid from workflow_test_state where key='budget') returning id)
select is((select count(*)::int from changed),0,'Marketing Manager cannot detach scoped approval to bypass transition checks');
reset role;
select * from finish();
rollback;
