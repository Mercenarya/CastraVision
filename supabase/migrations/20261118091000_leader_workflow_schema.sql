-- Extend the existing FR01/02/03/04/10 entities; no second approval system.
create schema workflow_private;
revoke all on schema workflow_private from public,anon,authenticated;

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  team_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 120),
  budget numeric not null check (budget>=0 and budget<=1000000000 and budget::text not in ('NaN','Infinity','-Infinity')),
  currency text not null check (currency in ('USD','VND')),
  channels text[] not null check (cardinality(channels) between 1 and 3 and channels <@ array['Meta','Google Ads','TikTok']),
  allocations jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','active','paused','completed')),
  created_by uuid not null references auth.users(id),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  unique(id,workspace_id),
  unique(workspace_id,created_by,request_id),
  foreign key (team_id,workspace_id) references public.workspace_teams(id,workspace_id)
);
create index campaigns_workspace_team on public.campaigns(workspace_id,team_id,created_at desc);

alter table public.approvals
  drop constraint approvals_target_type_check,
  drop constraint approvals_status_check,
  add constraint approvals_target_type_check check (target_type in ('ad_content','budget_proposal','strategy','pause_variant')),
  add constraint approvals_status_check check (status in ('draft','pending','approved','rejected','edited','revision_requested','escalated')),
  add column team_id uuid,
  add column campaign_id uuid,
  add column created_by uuid references auth.users(id),
  add column title text,
  add column payload jsonb not null default '{}',
  add column version integer not null default 1 check (version>0),
  add column request_id uuid,
  add column last_decision_request uuid,
  add foreign key (team_id,workspace_id) references public.workspace_teams(id,workspace_id),
  add foreign key (campaign_id,workspace_id) references public.campaigns(id,workspace_id);
create unique index approvals_request_unique on public.approvals(workspace_id,created_by,request_id) where request_id is not null;
create index approvals_workspace_team_status on public.approvals(workspace_id,team_id,status,created_at desc);

create table public.proposal_revisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  approval_id uuid not null references public.approvals(id) on delete cascade,
  version integer not null,
  actor_id uuid not null references auth.users(id),
  operation text not null,
  payload jsonb not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  unique(approval_id,version)
);
create index proposal_revisions_workspace on public.proposal_revisions(workspace_id,approval_id);

alter table public.strategies add column team_id uuid,
  add column campaign_id uuid, add column generation jsonb,
  add foreign key (team_id,workspace_id) references public.workspace_teams(id,workspace_id),
  add foreign key (campaign_id,workspace_id) references public.campaigns(id,workspace_id);
alter table public.ad_contents add column team_id uuid, add column campaign_id uuid,
  add foreign key (team_id,workspace_id) references public.workspace_teams(id,workspace_id),
  add foreign key (campaign_id,workspace_id) references public.campaigns(id,workspace_id);
alter table public.budget_proposals add column team_id uuid, add column campaign_id uuid,
  add foreign key (team_id,workspace_id) references public.workspace_teams(id,workspace_id),
  add foreign key (campaign_id,workspace_id) references public.campaigns(id,workspace_id);
alter table public.campaign_performance add column team_id uuid, add column campaign_id uuid,
  add foreign key (team_id,workspace_id) references public.workspace_teams(id,workspace_id),
  add foreign key (campaign_id,workspace_id) references public.campaigns(id,workspace_id);
create index campaign_perf_team_date on public.campaign_performance(workspace_id,team_id,record_date);
-- Old duplicate batches are preserved. New RPC imports serialize by batch.
create index campaign_perf_batch_row on public.campaign_performance(workspace_id,import_batch_id,source_row);
alter table public.notifications add column entity_id uuid, add column entity_type text;

create function workflow_private.actor_role(p_ws uuid) returns text
language plpgsql stable security definer set search_path='' as $$
declare v_role text;
begin
  perform membership_private.actor();
  select role::text into v_role from public.workspace_members where workspace_id=p_ws and user_id=auth.uid();
  if v_role is null then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  return v_role;
end $$;
create function workflow_private.can_team(p_ws uuid,p_team uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select membership_private.valid_actor() and exists(
    select 1 from public.workspace_members m where m.workspace_id=p_ws and m.user_id=auth.uid()
      and ((m.role='admin' and (p_team is null or exists(select 1 from public.workspace_teams t where t.id=p_team and t.workspace_id=p_ws)))
        or exists(select 1 from public.workspace_team_members t where t.workspace_id=p_ws and t.team_id=p_team and t.user_id=m.user_id))
  );
$$;
create function workflow_private.require_team(p_ws uuid,p_team uuid) returns void
language plpgsql stable security definer set search_path='' as $$ begin
  if p_team is null or not workflow_private.can_team(p_ws,p_team) then
    raise exception using message='PERMISSION_DENIED',errcode='P0001';
  end if;
end $$;

-- Restrictive policies combine with the existing permissive role policies.
-- Unknown-provenance legacy rows stay MM-only; no automatic Team assignment.
do $$ declare v_table text; begin
  foreach v_table in array array['strategies','ad_contents','budget_proposals','approvals','campaign_performance'] loop
    execute format('create policy workflow_team_scope on public.%I as restrictive for all to authenticated using (workflow_private.can_team(workspace_id,team_id)) with check (workflow_private.can_team(workspace_id,team_id) and team_id is null and campaign_id is null and public.has_workspace_role(workspace_id,array[''admin'']::public.workspace_role[]))',v_table);
    execute format('create policy workflow_rpc_update on public.%I as restrictive for update to authenticated using (team_id is null and campaign_id is null) with check (team_id is null and campaign_id is null)',v_table);
    execute format('create policy workflow_rpc_delete on public.%I as restrictive for delete to authenticated using (team_id is null and campaign_id is null)',v_table);
  end loop;
end $$;
alter table public.campaigns enable row level security;
-- A draft is private to its author even through direct REST reads.
create policy workflow_draft_scope on public.approvals as restrictive for select to authenticated
  using (status<>'draft' or created_by=auth.uid());
create function workflow_private.can_read_target(p_ws uuid,p_kind text,p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select not exists(select 1 from public.approvals a where a.workspace_id=p_ws
    and a.target_type=p_kind and a.target_id=p_id and a.status='draft'
    and a.created_by is distinct from auth.uid());
$$;
do $$ declare v_table text; v_kind text; begin
  for v_table,v_kind in select * from (values ('ad_contents','ad_content'),
    ('strategies','strategy'),('budget_proposals','budget_proposal')) t(tab,kind) loop
    execute format('create policy workflow_draft_scope on public.%I as restrictive for select to authenticated using (workflow_private.can_read_target(workspace_id,%L,id))',v_table,v_kind);
  end loop;
end $$;
alter table public.proposal_revisions enable row level security;
create policy campaigns_scoped_select on public.campaigns for select to authenticated
  using (workflow_private.can_team(workspace_id,team_id));
create policy proposal_revisions_scoped_select on public.proposal_revisions for select to authenticated
  using (exists(select 1 from public.approvals a where a.id=approval_id and a.workspace_id=proposal_revisions.workspace_id and workflow_private.can_team(a.workspace_id,a.team_id)));
revoke all on public.campaigns,public.proposal_revisions from public,anon,authenticated;
grant select on public.campaigns,public.proposal_revisions to authenticated;
grant all on public.campaigns,public.proposal_revisions to service_role;
revoke all on all functions in schema workflow_private from public,anon,authenticated;
grant usage on schema workflow_private to authenticated;
grant execute on function workflow_private.can_team(uuid,uuid) to authenticated;
grant execute on function workflow_private.can_read_target(uuid,text,uuid) to authenticated;

-- Target payloads use existing FR entities; mutation is only through the scoped RPC.
create function workflow_private.validate_payload(p_kind text,p_payload jsonb,p_budget numeric) returns boolean
language plpgsql immutable set search_path='' as $$
declare v jsonb; v_current numeric:=0; v_proposed numeric:=0; v_exceeds boolean:=false; v_n int;
begin
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
  if p_kind='ad_content' then
    if length(coalesce(p_payload->>'hook','')) not between 10 and 500
      or length(coalesce(p_payload->>'headline','')) not between 1 and 60
      or length(coalesce(p_payload->>'body','')) not between 1 and 4000
      or length(coalesce(p_payload->>'cta','')) not between 1 and 80
      or coalesce(p_payload->>'channel','') not in ('Meta','Google Ads','TikTok') then
      raise exception using message='VALIDATION_ERROR',errcode='P0001';
    end if;
  elsif p_kind='budget_proposal' then
    if coalesce(p_payload->>'totalBudget','')::numeric is distinct from p_budget
      or jsonb_typeof(p_payload->'allocations') is distinct from 'array'
      or jsonb_array_length(p_payload->'allocations') not between 1 and 3 then
      raise exception using message='VALIDATION_ERROR',errcode='P0001';
    end if;
    select count(distinct x->>'channel') into v_n from jsonb_array_elements(p_payload->'allocations') x;
    if v_n<>jsonb_array_length(p_payload->'allocations') then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
    for v in select * from jsonb_array_elements(p_payload->'allocations') loop
      if coalesce(v->>'channel','') not in ('Meta','Google Ads','TikTok') or not(v ? 'current' and v ? 'proposed')
        or jsonb_typeof(v->'current') is distinct from 'number' or jsonb_typeof(v->'proposed') is distinct from 'number'
        or (v->>'current')::numeric<0 or (v->>'proposed')::numeric<0
        or (v->>'current')::numeric>1000000000 or (v->>'proposed')::numeric>1000000000
        or (v->>'current')::numeric::text in ('NaN','Infinity','-Infinity')
        or (v->>'proposed')::numeric::text in ('NaN','Infinity','-Infinity') then
        raise exception using message='VALIDATION_ERROR',errcode='P0001';
      end if;
      v_current:=v_current+(v->>'current')::numeric;
      v_proposed:=v_proposed+(v->>'proposed')::numeric;
      v_exceeds:=v_exceeds or case when (v->>'current')::numeric=0 then (v->>'proposed')::numeric>0
        else abs((v->>'proposed')::numeric-(v->>'current')::numeric)/(v->>'current')::numeric>0.20 end;
    end loop;
    if v_current<>p_budget or v_proposed<>p_budget then raise exception using message='BUDGET_ENVELOPE_MISMATCH',errcode='P0001'; end if;
  elsif p_kind='strategy' then
    if jsonb_typeof(p_payload->'strategy') is distinct from 'object' or coalesce(p_payload->>'provider','') not in ('openai','deterministic-fallback') then
      raise exception using message='VALIDATION_ERROR',errcode='P0001';
    end if;
    if (select sum((x->>'percentage')::numeric) from jsonb_array_elements(p_payload->'strategy'->'budget_allocation') x) is distinct from 100::numeric then
      raise exception using message='VALIDATION_ERROR',errcode='P0001';
    end if;
  elsif p_kind<>'pause_variant' then raise exception using message='VALIDATION_ERROR',errcode='P0001';
  end if;
  return v_exceeds;
exception when invalid_text_representation or numeric_value_out_of_range then
  raise exception using message='VALIDATION_ERROR',errcode='P0001';
end $$;

create function workflow_private.notify(p_approval public.approvals,p_event text) returns void
language plpgsql security definer set search_path='' as $$ begin
  insert into public.notifications(workspace_id,user_id,type,message,entity_id,entity_type)
  select p_approval.workspace_id,m.user_id,'proposal_'||p_event,p_approval.title||': '||p_event,p_approval.id,'approval'
  from public.workspace_members m
  where m.workspace_id=p_approval.workspace_id and (
    (p_event in ('approved','rejected','revision_requested') and m.user_id=p_approval.created_by)
    or (p_event='escalated' and m.role='admin')
    or (p_event='pending' and m.user_id<>p_approval.created_by and (m.role='admin' or
      (m.role='manager' and exists(select 1 from public.workspace_team_members t where t.workspace_id=m.workspace_id and t.team_id=p_approval.team_id and t.user_id=m.user_id))))
  );
end $$;
create function workflow_private.check_baseline(p_payload jsonb,p_campaign public.campaigns) returns void
language plpgsql immutable set search_path='' as $$ declare v jsonb; begin
  if jsonb_array_length(p_payload->'allocations')<>cardinality(p_campaign.channels) then
    raise exception using message='BUDGET_ENVELOPE_MISMATCH',errcode='P0001';
  end if;
  for v in select * from jsonb_array_elements(p_payload->'allocations') loop
    if not (v->>'channel')=any(p_campaign.channels) or
      (v->>'current')::numeric is distinct from (p_campaign.allocations->>(v->>'channel'))::numeric then
      raise exception using message='STALE_BASELINE',errcode='P0001';
    end if;
  end loop;
end $$;
revoke all on all functions in schema workflow_private from public,anon,authenticated;
grant execute on function workflow_private.can_team(uuid,uuid) to authenticated;
grant execute on function workflow_private.can_read_target(uuid,text,uuid) to authenticated;
