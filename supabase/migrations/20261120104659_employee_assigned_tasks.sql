begin;
create schema employee_private;
revoke all on schema employee_private from public,anon,authenticated;

create table public.workspace_tasks (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 team_id uuid not null,
 campaign_id uuid not null,
 assignee_id uuid not null references auth.users(id),
 assigned_by uuid not null references auth.users(id),
 title text not null check(length(btrim(title)) between 1 and 120),
 description text not null default '' check(length(description)<=4000),
 due_at timestamptz,
 status text not null default 'todo' check(status in ('todo','in_progress','blocked','completed','cancelled')),
 proposal_id uuid references public.approvals(id),
 version integer not null default 1 check(version>0),
 request_id uuid not null,
 request_payload jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(workspace_id,assigned_by,request_id),
 foreign key(team_id,workspace_id) references public.workspace_teams(id,workspace_id),
 foreign key(campaign_id,workspace_id) references public.campaigns(id,workspace_id)
);
-- Supports the primary own-task list and FK workspace cascades; not an ANN/perf experiment.
create index workspace_tasks_assignee on public.workspace_tasks(workspace_id,assignee_id,created_at desc,id);

create function employee_private.can_read(p_ws uuid,p_team uuid,p_assignee uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select workflow_private.can_team(p_ws,p_team) and exists(
 select 1 from public.workspace_members m where m.workspace_id=p_ws and m.user_id=auth.uid()
 and (m.role in ('admin','manager') or m.user_id=p_assignee));
$$;
create function employee_private.task_json(p_task public.workspace_tasks) returns jsonb
language sql stable security definer set search_path='' as $$
 select to_jsonb(p_task)-'request_payload'-'request_id' || jsonb_build_object(
 'assignee_name',coalesce((select nullif(full_name,'') from public.profiles where id=p_task.assignee_id),'Nhân viên'),
 'assigned_by_name',coalesce((select nullif(full_name,'') from public.profiles where id=p_task.assigned_by),'Người giao việc'),
 'campaign_name',(select name from public.campaigns where id=p_task.campaign_id),
 'team_name',(select name from public.workspace_teams where id=p_task.team_id));
$$;
create function employee_private.validate_task() returns trigger
language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.campaigns c where c.id=new.campaign_id and c.workspace_id=new.workspace_id and c.team_id=new.team_id) then
  raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
 if new.proposal_id is not null and not exists(select 1 from public.approvals a where a.id=new.proposal_id
  and a.workspace_id=new.workspace_id and a.team_id=new.team_id and a.campaign_id=new.campaign_id and a.created_by=new.assignee_id) then
  raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
 return new;
end $$;
create trigger workspace_task_scope before insert or update on public.workspace_tasks
for each row execute function employee_private.validate_task();
alter table public.workspace_tasks enable row level security;
create policy workspace_tasks_scoped_select on public.workspace_tasks for select to authenticated
 using(employee_private.can_read(workspace_id,team_id,assignee_id));
create policy platform_active_tenant on public.workspace_tasks as restrictive for all to authenticated
 using(platform_private.workspace_active(workspace_id)) with check(platform_private.workspace_active(workspace_id));
create trigger platform_active_write before insert or update or delete on public.workspace_tasks
for each row execute function platform_private.guard_business_write();
select public.attach_audit_trigger('public.workspace_tasks'::regclass);
revoke all on public.workspace_tasks from public,anon,authenticated;
grant select on public.workspace_tasks to authenticated;
grant all on public.workspace_tasks to service_role;
revoke all on all functions in schema employee_private from public,anon,authenticated;
grant usage on schema employee_private to authenticated;
grant execute on function employee_private.can_read(uuid,uuid,uuid) to authenticated;

create function public.employee_tasks(p_workspace_id uuid,p_command text,p_data jsonb default '{}') returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare
 v_actor uuid:=membership_private.actor();v_role text:=workflow_private.actor_role(p_workspace_id);
 v_task public.workspace_tasks;v_campaign public.campaigns;v_id uuid;v_request uuid;v_assignee uuid;
 v_proposal uuid;v_due timestamptz;v_status text;v_allowed text[];v_items jsonb;v_total int;
 v_limit int:=20;v_offset int:=0;v_candidate record;
begin
 perform platform_private.require_active(p_workspace_id);
 if p_data is null or jsonb_typeof(p_data)<>'object' or p_command is null then raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
 v_allowed:=case p_command
 when 'list' then array['search','status','campaignId','limit','offset']
 when 'summary' then array[]::text[]
 when 'task' then array['id']
 when 'candidates' then array['campaignId']
 when 'create' then array['campaignId','assigneeId','title','description','dueAt','requestId']
 when 'update' then array['id','status','expectedVersion','proposalId'] else null end;
 if v_allowed is null or exists(select 1 from jsonb_object_keys(p_data) k where not k=any(v_allowed)) then raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;

 if p_command in ('list','summary') then
  if p_data ? 'search' and (jsonb_typeof(p_data->'search')<>'string' or length(p_data->>'search')>120)
   or p_data ? 'status' and (jsonb_typeof(p_data->'status')<>'string' or p_data->>'status' not in ('','active','todo','in_progress','blocked','completed','cancelled')) then
   raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
  v_limit:=coalesce((p_data->>'limit')::int,20);v_offset:=coalesce((p_data->>'offset')::int,0);
  if v_limit not between 1 and 100 or v_offset<0 or v_offset>1000000 then raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
  if p_data ? 'campaignId' and coalesce(p_data->>'campaignId','')<>'' then v_id:=(p_data->>'campaignId')::uuid;end if;
  if p_command='summary' then
   select jsonb_build_object('total',count(*),'active',count(*) filter(where status not in ('completed','cancelled')),
    'completed',count(*) filter(where status='completed'),'overdue',count(*) filter(where due_at<now() and status not in ('completed','cancelled')))
    into v_items from public.workspace_tasks t where t.workspace_id=p_workspace_id and employee_private.can_read(t.workspace_id,t.team_id,t.assignee_id);
   return v_items;
  end if;
  with scoped as(select t.* from public.workspace_tasks t where t.workspace_id=p_workspace_id
   and employee_private.can_read(t.workspace_id,t.team_id,t.assignee_id)
   and (v_id is null or t.campaign_id=v_id)
   and (coalesce(p_data->>'status','')='' or t.status=p_data->>'status' or p_data->>'status'='active' and t.status not in ('completed','cancelled'))
   and (coalesce(p_data->>'search','')='' or t.title ilike '%'||(p_data->>'search')||'%'))
  select jsonb_build_object('items',coalesce((select jsonb_agg(employee_private.task_json(x) order by x.due_at asc nulls last,x.created_at desc,x.id)
   from (select * from scoped order by due_at asc nulls last,created_at desc,id limit v_limit offset v_offset) x),'[]'::jsonb),
   'total',(select count(*) from scoped),'limit',v_limit,'offset',v_offset) into v_items;
  return v_items;
 end if;

 if p_command in ('create','candidates') then
  if v_role not in ('admin','manager') then raise exception using message='PERMISSION_DENIED',errcode='P0001';end if;
  select * into v_campaign from public.campaigns where workspace_id=p_workspace_id and id=(p_data->>'campaignId')::uuid for share;
  if not found then raise exception using message='NOT_FOUND',errcode='P0001';end if;
  perform workflow_private.require_team(p_workspace_id,v_campaign.team_id);
  if p_command='candidates' then
   select coalesce(jsonb_agg(jsonb_build_object('id',m.user_id,'name',coalesce(nullif(p.full_name,''),'Nhân viên')) order by p.full_name,m.user_id),'[]'::jsonb)
    into v_items from public.workspace_members m join public.workspace_team_members tm on tm.workspace_id=m.workspace_id and tm.user_id=m.user_id
    left join public.profiles p on p.id=m.user_id where m.workspace_id=p_workspace_id and tm.team_id=v_campaign.team_id and m.role='member'
    and exists(select 1 from auth.users u where u.id=m.user_id and u.email_confirmed_at is not null and coalesce(u.raw_app_meta_data->>'platform_role',u.raw_app_meta_data->>'role','')<>'system_admin');
   return jsonb_build_object('items',v_items);
  end if;
  v_request:=(p_data->>'requestId')::uuid;v_assignee:=(p_data->>'assigneeId')::uuid;
  if v_request is null or v_assignee is null or jsonb_typeof(p_data->'title') is distinct from 'string'
   or length(btrim(p_data->>'title')) not between 1 and 120
   or p_data ? 'description' and (jsonb_typeof(p_data->'description')<>'string' or length(p_data->>'description')>4000) then
   raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
  if p_data ? 'dueAt' and p_data->'dueAt'<>'null'::jsonb then
   if jsonb_typeof(p_data->'dueAt')<>'string' or p_data->>'dueAt' !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
   v_due:=(p_data->>'dueAt')::timestamptz;
   if not isfinite(v_due) then raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
  end if;
  perform pg_advisory_xact_lock(hashtext(p_workspace_id::text),hashtext(v_actor::text||v_request::text));
  select * into v_task from public.workspace_tasks where workspace_id=p_workspace_id and assigned_by=v_actor and request_id=v_request;
  if found then
   if v_task.request_payload is distinct from p_data then raise exception using message='REQUEST_CONFLICT',errcode='P0001';end if;
   return employee_private.task_json(v_task);
  end if;
  perform 1 from public.workspace_members m where m.workspace_id=p_workspace_id and m.user_id=v_assignee and m.role='member'
   and exists(select 1 from auth.users u where u.id=m.user_id and u.email_confirmed_at is not null and coalesce(u.raw_app_meta_data->>'platform_role',u.raw_app_meta_data->>'role','')<>'system_admin') for share;
  if not found then raise exception using message='PERMISSION_DENIED',errcode='P0001';end if;
  perform 1 from public.workspace_team_members where workspace_id=p_workspace_id and team_id=v_campaign.team_id and user_id=v_assignee for share;
  if not found then raise exception using message='PERMISSION_DENIED',errcode='P0001';end if;
  insert into public.workspace_tasks(workspace_id,team_id,campaign_id,assignee_id,assigned_by,title,description,due_at,request_id,request_payload)
   values(p_workspace_id,v_campaign.team_id,v_campaign.id,v_assignee,v_actor,btrim(p_data->>'title'),coalesce(p_data->>'description',''),v_due,v_request,p_data) returning * into v_task;
  insert into public.notifications(workspace_id,user_id,type,message,entity_id,entity_type)
   values(p_workspace_id,v_assignee,'task_assigned','Bạn được giao nhiệm vụ: '||v_task.title,v_task.id,'workspace_task');
  return employee_private.task_json(v_task);
 end if;

 v_id:=(p_data->>'id')::uuid;
 select * into v_task from public.workspace_tasks t where t.workspace_id=p_workspace_id and t.id=v_id
  and employee_private.can_read(t.workspace_id,t.team_id,t.assignee_id) for update;
 if not found then raise exception using message='NOT_FOUND',errcode='P0001';end if;
 if p_command='task' then return employee_private.task_json(v_task);end if;
 if jsonb_typeof(p_data->'expectedVersion') is distinct from 'number' or (p_data->>'expectedVersion') !~ '^[0-9]+$' then raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
 if (p_data->>'expectedVersion')::int<>v_task.version then raise exception using message='STALE_VERSION',errcode='P0001';end if;
 v_status:=p_data->>'status';
 if v_status is null or v_status not in ('todo','in_progress','blocked','completed','cancelled') then raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
 if v_task.status='cancelled' then raise exception using message='INVALID_TRANSITION',errcode='P0001';end if;
 if v_status='cancelled' and v_role='member' then raise exception using message='PERMISSION_DENIED',errcode='P0001';end if;
 if v_task.status='completed' and v_status not in ('completed','in_progress','cancelled') then raise exception using message='INVALID_TRANSITION',errcode='P0001';end if;
 v_proposal:=v_task.proposal_id;
 if p_data ? 'proposalId' then
  if v_actor<>v_task.assignee_id then raise exception using message='PERMISSION_DENIED',errcode='P0001';end if;
  v_proposal:=(p_data->>'proposalId')::uuid;
  if v_proposal is not null and not exists(select 1 from public.approvals a where a.id=v_proposal and a.workspace_id=p_workspace_id
   and a.campaign_id=v_task.campaign_id and a.team_id=v_task.team_id and a.created_by=v_actor) then raise exception using message='PERMISSION_DENIED',errcode='P0001';end if;
 end if;
 if v_status=v_task.status and v_proposal is not distinct from v_task.proposal_id then return employee_private.task_json(v_task);end if;
 update public.workspace_tasks set status=v_status,proposal_id=v_proposal,version=version+1,updated_at=now() where id=v_id returning * into v_task;
 if v_actor<>v_task.assigned_by then insert into public.notifications(workspace_id,user_id,type,message,entity_id,entity_type)
  values(p_workspace_id,v_task.assigned_by,'task_updated','Nhiệm vụ được cập nhật: '||v_task.title,v_task.id,'workspace_task');end if;
 return employee_private.task_json(v_task);
exception when invalid_text_representation or datetime_field_overflow or invalid_datetime_format or numeric_value_out_of_range then
 raise exception using message='VALIDATION_ERROR',errcode='P0001';
end $$;
revoke all on function public.employee_tasks(uuid,text,jsonb) from public,anon;
grant execute on function public.employee_tasks(uuid,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
