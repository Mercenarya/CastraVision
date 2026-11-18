create function public.leader_workflow(p_workspace_id uuid,p_command text,p_data jsonb default '{}') returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare
  v_actor uuid:=membership_private.actor();
  v_role text:=workflow_private.actor_role(p_workspace_id);
  v_team uuid; v_id uuid; v_request uuid; v_target uuid; v_version int;
  v_campaign public.campaigns; v_approval public.approvals;
  v_items jsonb; v_result jsonb; v_payload jsonb; v_row jsonb;
  v_kind text; v_title text; v_note text; v_decision text; v_status text;
  v_limit int:=20; v_offset int:=0; v_total int; v_count int; v_exceeds boolean;
  v_start date:=current_date-29; v_end date:=current_date;
  v_spend numeric; v_revenue numeric; v_conversions numeric; v_clicks numeric; v_impressions numeric;
  v_allowed text[];
  v_allocations jsonb; v_channels text[]; v_amount numeric; v_currency text;
begin
  if p_command is null or p_data is null or jsonb_typeof(p_data)<>'object' then
    raise exception using message='VALIDATION_ERROR',errcode='P0001';
  end if;
  v_allowed:=case p_command
    when 'context' then array[]::text[]
    when 'campaign' then array['id']
    when 'campaigns' then array['search','status','limit','offset']
    when 'create_campaign' then array['teamId','name','budget','currency','channels','requestId']
    when 'proposals' then array['search','status','kind','mine','limit','offset']
    when 'proposal' then array['id']
    when 'submit' then array['campaignId','kind','title','payload','requestId','submit']
    when 'revise' then array['id','payload','expectedVersion','note']
    when 'decide' then array['id','decision','expectedVersion','note','requestId']
    when 'analytics' then array['campaignId','from','to']
    when 'notifications' then array['limit','offset']
    when 'read_notification' then array['id']
    when 'profile' then array[]::text[]
    when 'save_profile' then array['fullName','avatarUrl']
    when 'import' then array['campaignId','batchId','filename','rows']
    when 'imports' then array['campaignId','limit','offset']
    else null end;
  if v_allowed is null or exists(select 1 from jsonb_object_keys(p_data) k where not k=any(v_allowed)) then
    raise exception using message='VALIDATION_ERROR',errcode='P0001';
  end if;
  if p_command in ('campaigns','proposals','notifications','imports') then
    v_limit:=coalesce((p_data->>'limit')::int,20); v_offset:=coalesce((p_data->>'offset')::int,0);
    if v_limit not between 1 and 100 or v_offset<0 or length(coalesce(p_data->>'search',''))>120 then
      raise exception using message='VALIDATION_ERROR',errcode='P0001';
    end if;
  end if;

  if p_command in ('context','profile','save_profile') then
    if p_command='save_profile' then
      if length(btrim(coalesce(p_data->>'fullName',''))) not between 1 and 100
        or length(coalesce(p_data->>'avatarUrl',''))>500
        or (coalesce(p_data->>'avatarUrl','')<>'' and p_data->>'avatarUrl' !~ '^https://') then
        raise exception using message='VALIDATION_ERROR',errcode='P0001';
      end if;
      insert into public.profiles(id,full_name,avatar_url) values(v_actor,btrim(p_data->>'fullName'),nullif(p_data->>'avatarUrl',''))
      on conflict(id) do update set full_name=excluded.full_name,avatar_url=excluded.avatar_url;
    end if;
    select jsonb_build_object('id',u.id,'email',u.email,'fullName',coalesce(nullif(p.full_name,''),u.raw_user_meta_data->>'display_name',split_part(u.email,'@',1)),'avatarUrl',p.avatar_url)
    into v_result from auth.users u left join public.profiles p on p.id=u.id where u.id=v_actor;
    if p_command<>'context' then return v_result; end if;
    return jsonb_build_object('actor',v_result,'role',v_role,
      'workspace',(select jsonb_build_object('id',id,'name',name) from public.workspaces where id=p_workspace_id),
      'teams',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name) from public.workspace_teams where workspace_id=p_workspace_id and workflow_private.can_team(p_workspace_id,id)),'[]'::jsonb));
  end if;

  if p_command='create_campaign' then
    if v_role not in ('admin','manager') then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
    v_team:=(p_data->>'teamId')::uuid; v_request:=(p_data->>'requestId')::uuid;
    perform workflow_private.require_team(p_workspace_id,v_team);
    if v_request is null or length(btrim(coalesce(p_data->>'name',''))) not between 1 and 120
      or coalesce((p_data->>'budget')::numeric,-1)<=0 or (p_data->>'budget')::numeric>1000000000
      or (p_data->>'budget')::numeric::text in ('NaN','Infinity','-Infinity')
      or coalesce(p_data->>'currency','') not in ('USD','VND')
      or jsonb_typeof(p_data->'channels') is distinct from 'array'
      or jsonb_array_length(p_data->'channels') not between 1 and 3
      or exists(select 1 from jsonb_array_elements_text(p_data->'channels') c where c not in ('Meta','Google Ads','TikTok')) then
      raise exception using message='VALIDATION_ERROR',errcode='P0001';
    end if;
    perform pg_advisory_xact_lock(hashtext(p_workspace_id::text),hashtext(v_actor::text||v_request::text));
    select * into v_campaign from public.campaigns where workspace_id=p_workspace_id and created_by=v_actor and request_id=v_request;
    if found then
      if v_campaign.name<>btrim(p_data->>'name') or v_campaign.team_id<>v_team or v_campaign.budget<>(p_data->>'budget')::numeric
        or to_jsonb(v_campaign.channels)<>p_data->'channels' or v_campaign.currency<>p_data->>'currency' then
        raise exception using message='REQUEST_CONFLICT',errcode='P0001';
      end if;
      return to_jsonb(v_campaign);
    end if;
    v_channels:=array(select jsonb_array_elements_text(p_data->'channels'));
    if cardinality(v_channels)<>(select count(distinct c) from unnest(v_channels) c) then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
    v_amount:=round((p_data->>'budget')::numeric/cardinality(v_channels),2);
    select jsonb_object_agg(c,case when n=cardinality(v_channels) then (p_data->>'budget')::numeric-v_amount*(cardinality(v_channels)-1) else v_amount end)
      into v_allocations from unnest(v_channels) with ordinality x(c,n);
    insert into public.campaigns(workspace_id,team_id,name,budget,currency,channels,allocations,created_by,request_id)
    values(p_workspace_id,v_team,btrim(p_data->>'name'),(p_data->>'budget')::numeric,p_data->>'currency',v_channels,v_allocations,v_actor,v_request)
    returning * into v_campaign;
    insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,after_value)
      values(p_workspace_id,v_actor,'create','campaigns',v_campaign.id,to_jsonb(v_campaign));
    return to_jsonb(v_campaign);
  end if;

  if p_command='campaign' then
    select * into v_campaign from public.campaigns where id=(p_data->>'id')::uuid and workspace_id=p_workspace_id;
    if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
    perform workflow_private.require_team(p_workspace_id,v_campaign.team_id);
    return to_jsonb(v_campaign);
  end if;
  if p_command='campaigns' then
    with scoped as (select c.*,t.name team_name from public.campaigns c join public.workspace_teams t on t.id=c.team_id and t.workspace_id=c.workspace_id
      where c.workspace_id=p_workspace_id and workflow_private.can_team(p_workspace_id,c.team_id)
      and (coalesce(p_data->>'search','')='' or c.name ilike '%'||(p_data->>'search')||'%')
      and (coalesce(p_data->>'status','')='' or c.status=p_data->>'status'))
    select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from scoped order by created_at desc,id limit v_limit offset v_offset) x),'[]'::jsonb),
      'total',(select count(*) from scoped),'limit',v_limit,'offset',v_offset) into v_result;
    return v_result;
  end if;

  if p_command='submit' then
    perform membership_private.require_password();
    select * into v_campaign from public.campaigns where id=(p_data->>'campaignId')::uuid and workspace_id=p_workspace_id;
    if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
    perform workflow_private.require_team(p_workspace_id,v_campaign.team_id);
    v_kind:=p_data->>'kind'; v_payload:=p_data->'payload'; v_title:=btrim(p_data->>'title'); v_request:=(p_data->>'requestId')::uuid;
    if v_request is null or v_title is null or length(v_title) not between 1 and 160 then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
    v_exceeds:=workflow_private.validate_payload(v_kind,v_payload,v_campaign.budget);
    if v_kind='ad_content' and not (v_payload->>'channel')=any(v_campaign.channels) then
      raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
    if v_kind='ad_content' and v_payload->>'source'='template' and not exists(
      select 1 from public.approvals a where a.id=(v_payload->>'strategyId')::uuid
        and a.workspace_id=p_workspace_id and a.campaign_id=v_campaign.id
        and a.target_type='strategy' and a.status='approved'
    ) then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
    if v_kind='pause_variant' and length(btrim(coalesce(v_payload->>'reason',''))) not between 3 and 2000 then
      raise exception using message='REASON_REQUIRED',errcode='P0001'; end if;
    if v_kind='budget_proposal' then perform workflow_private.check_baseline(v_payload,v_campaign); end if;
    if v_kind='budget_proposal' and (v_payload->>'totalBudget')::numeric is distinct from v_campaign.budget then raise exception using message='BUDGET_ENVELOPE_MISMATCH',errcode='P0001'; end if;
    if v_kind='pause_variant' and not exists(select 1 from public.ad_contents where id=(v_payload->>'variantId')::uuid and workspace_id=p_workspace_id and campaign_id=v_campaign.id and team_id=v_campaign.team_id and status='approved') then
      raise exception using message='VALIDATION_ERROR',errcode='P0001';
    end if;
    perform pg_advisory_xact_lock(hashtext(p_workspace_id::text),hashtext(v_actor::text||v_request::text));
    select * into v_approval from public.approvals where workspace_id=p_workspace_id and created_by=v_actor and request_id=v_request;
    if found then
      if v_approval.payload<>v_payload or v_approval.campaign_id<>v_campaign.id or v_approval.target_type<>v_kind or v_approval.title<>v_title then raise exception using message='REQUEST_CONFLICT',errcode='P0001'; end if;
      return to_jsonb(v_approval);
    end if;
    v_status:=case when coalesce((p_data->>'submit')::boolean,true) then 'pending' else 'draft' end;
    if v_kind='ad_content' then
      insert into public.ad_contents(workspace_id,team_id,campaign_id,strategy_id,channel,headline,description,cta,status,created_by)
      values(p_workspace_id,v_campaign.team_id,v_campaign.id,
        case when v_payload->>'source'='template' then (select a.target_id from public.approvals a where a.id=(v_payload->>'strategyId')::uuid and a.workspace_id=p_workspace_id) else null end,
        case v_payload->>'channel' when 'Meta' then 'facebook' when 'Google Ads' then 'google' when 'TikTok' then 'tiktok' else '' end,v_payload->>'headline',v_payload->>'body',v_payload->>'cta',v_status,v_actor) returning id into v_target;
    elsif v_kind='strategy' then
      insert into public.strategies(workspace_id,team_id,campaign_id,objective,expected_budget,recommended_channels,key_message,target_segment,ai_reasoning,created_by,generation)
      values(p_workspace_id,v_campaign.team_id,v_campaign.id,v_title,v_campaign.budget,v_payload->'strategy'->'budget_allocation',v_payload->'strategy'->>'message',v_payload->'strategy'->>'segment',v_payload->'strategy'->>'rationale',v_actor,v_payload) returning id into v_target;
    elsif v_kind='budget_proposal' then
      insert into public.budget_proposals(workspace_id,team_id,campaign_id,channel,current_allocation,proposed_allocation)
      values(p_workspace_id,v_campaign.team_id,v_campaign.id,'multi_channel',v_campaign.budget,v_campaign.budget) returning id into v_target;
    else v_target:=(v_payload->>'variantId')::uuid;
    end if;
    insert into public.approvals(workspace_id,team_id,campaign_id,created_by,target_type,target_id,title,payload,request_id,status)
    values(p_workspace_id,v_campaign.team_id,v_campaign.id,v_actor,v_kind,v_target,v_title,v_payload,v_request,v_status) returning * into v_approval;
    insert into public.proposal_revisions(workspace_id,approval_id,version,actor_id,operation,payload)
      values(p_workspace_id,v_approval.id,1,v_actor,'create',v_payload);
    if v_status='pending' then perform workflow_private.notify(v_approval,'pending'); end if;
    return to_jsonb(v_approval);
  end if;

  if p_command in ('proposal','revise','decide') then
    v_id:=(p_data->>'id')::uuid;
    select * into v_approval from public.approvals where id=v_id and workspace_id=p_workspace_id for update;
    if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
    perform workflow_private.require_team(p_workspace_id,v_approval.team_id);
    if v_approval.status='draft' and v_approval.created_by<>v_actor then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
    if p_command='proposal' then
      return to_jsonb(v_approval)||jsonb_build_object('campaign',(select to_jsonb(c) from public.campaigns c where c.id=v_approval.campaign_id and c.workspace_id=p_workspace_id),'history',coalesce((select jsonb_agg(to_jsonb(r)||jsonb_build_object('actor_name',coalesce(p.full_name,'Workspace user')) order by r.version desc) from public.proposal_revisions r left join public.profiles p on p.id=r.actor_id where r.approval_id=v_id and r.workspace_id=p_workspace_id),'[]'::jsonb));
    end if;
    if p_command='decide' then
      v_request:=(p_data->>'requestId')::uuid;
      if v_request is null then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
      if v_approval.last_decision_request=v_request then
        if not exists(select 1 from public.proposal_revisions r where r.approval_id=v_id
          and r.version=v_approval.version and r.actor_id=v_actor
          and r.operation=p_data->>'decision' and r.note=btrim(coalesce(p_data->>'note',''))) then
          raise exception using message='REQUEST_CONFLICT',errcode='P0001';
        end if;
        return to_jsonb(v_approval);
      end if;
    end if;
    if (p_data->>'expectedVersion')::int is distinct from v_approval.version then raise exception using message='STALE_VERSION',errcode='P0001'; end if;
    select * into v_campaign from public.campaigns where id=v_approval.campaign_id and workspace_id=p_workspace_id for update;
    if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
    if p_command='revise' then
      if v_approval.status not in ('draft','pending','revision_requested') or
        (v_role='member' and v_approval.created_by<>v_actor) or
        (v_approval.status='revision_requested' and v_approval.created_by<>v_actor and v_role<>'admin') then
        raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
      v_payload:=p_data->'payload';
      v_exceeds:=workflow_private.validate_payload(v_approval.target_type,v_payload,v_campaign.budget);
      if v_approval.target_type='ad_content' and
        (v_payload->>'channel' is distinct from v_approval.payload->>'channel'
         or v_payload->>'source' is distinct from v_approval.payload->>'source'
         or v_payload->>'strategyId' is distinct from v_approval.payload->>'strategyId') then
        raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
      if v_approval.target_type='budget_proposal' then perform workflow_private.check_baseline(v_payload,v_campaign); end if;
      if v_approval.target_type='budget_proposal' and (v_payload->>'totalBudget')::numeric is distinct from v_campaign.budget then raise exception using message='BUDGET_ENVELOPE_MISMATCH',errcode='P0001'; end if;
      update public.approvals set payload=v_payload,version=version+1 where id=v_id returning * into v_approval;
      if v_approval.target_type='ad_content' then
        update public.ad_contents set headline=v_payload->>'headline',description=v_payload->>'body',cta=v_payload->>'cta' where id=v_approval.target_id and workspace_id=p_workspace_id;
      elsif v_approval.target_type='strategy' then
        update public.strategies set generation=v_payload,
          recommended_channels=v_payload->'strategy'->'budget_allocation',
          key_message=v_payload->'strategy'->>'message',target_segment=v_payload->'strategy'->>'segment',
          ai_reasoning=v_payload->'strategy'->>'rationale'
          where id=v_approval.target_id and workspace_id=p_workspace_id;
      end if;
      v_decision:='revise'; v_note:=left(coalesce(p_data->>'note',''),2000);
    else
      v_decision:=p_data->>'decision'; v_note:=btrim(coalesce(p_data->>'note',''));
      if v_decision='submit' then
        if v_approval.created_by<>v_actor or v_approval.status not in ('draft','revision_requested') then raise exception using message='INVALID_TRANSITION',errcode='P0001'; end if;
        v_status:='pending';
      else
        if v_role not in ('admin','manager') then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
        if v_approval.status not in ('pending','escalated') or (v_approval.status='escalated' and v_role<>'admin') then raise exception using message='INVALID_TRANSITION',errcode='P0001'; end if;
        if coalesce(v_decision,'') not in ('approve','reject','revision','escalate') then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
        if v_decision='approve' and v_approval.created_by=v_actor and not(v_role='admin' and v_approval.target_type='strategy') then raise exception using message='SELF_APPROVAL_FORBIDDEN',errcode='P0001'; end if;
        if v_decision<>'approve' and length(v_note) not between 3 and 2000 then raise exception using message='REASON_REQUIRED',errcode='P0001'; end if;
        v_exceeds:=workflow_private.validate_payload(v_approval.target_type,v_approval.payload,v_campaign.budget);
        if v_approval.target_type='budget_proposal' and v_decision='approve' then perform workflow_private.check_baseline(v_approval.payload,v_campaign); end if;
        if v_decision='approve' and v_role='manager' and v_approval.target_type='budget_proposal' and v_exceeds then raise exception using message='BUDGET_ESCALATION_REQUIRED',errcode='P0001'; end if;
        v_status:=case v_decision when 'approve' then 'approved' when 'reject' then 'rejected' when 'revision' then 'revision_requested' else 'escalated' end;
      end if;
      update public.approvals set status=v_status,reviewer_id=case when v_decision='submit' then null else v_actor end,
        reviewed_at=now(),reject_reason=nullif(v_note,''),last_decision_request=v_request,version=version+1
        where id=v_id returning * into v_approval;
      if v_approval.target_type='ad_content' then
        update public.ad_contents set status=case when v_status in ('approved','rejected') then v_status when v_status='revision_requested' then 'draft' else 'pending' end where id=v_approval.target_id and workspace_id=p_workspace_id;
      elsif v_approval.target_type='budget_proposal' then
        update public.budget_proposals set status=case when v_status in ('approved','rejected') then v_status else 'pending' end where id=v_approval.target_id and workspace_id=p_workspace_id;
        if v_status='approved' then
          update public.campaigns set allocations=(select jsonb_object_agg(x->>'channel',(x->>'proposed')::numeric) from jsonb_array_elements(v_approval.payload->'allocations') x)
            where id=v_approval.campaign_id and workspace_id=p_workspace_id;
        end if;
      end if;
      perform workflow_private.notify(v_approval,v_status);
    end if;
    insert into public.proposal_revisions(workspace_id,approval_id,version,actor_id,operation,payload,note)
      values(p_workspace_id,v_id,v_approval.version,v_actor,v_decision,v_approval.payload,v_note);
    return to_jsonb(v_approval);
  end if;

  if p_command='proposals' then
    with scoped as (select a.*,coalesce(p.full_name,'Workspace user') author_name,c.name campaign_name from public.approvals a
      join public.campaigns c on c.id=a.campaign_id and c.workspace_id=a.workspace_id left join public.profiles p on p.id=a.created_by
      where a.workspace_id=p_workspace_id and workflow_private.can_team(p_workspace_id,a.team_id)
        and (a.status<>'draft' or a.created_by=v_actor)
        and (coalesce((p_data->>'mine')::boolean,false)=false or a.created_by=v_actor)
        and (coalesce(p_data->>'search','')='' or a.title ilike '%'||(p_data->>'search')||'%')
        and (coalesce(p_data->>'status','')='' or a.status=p_data->>'status')
        and (coalesce(p_data->>'kind','')='' or a.target_type=p_data->>'kind'))
    select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from scoped order by created_at desc,id limit v_limit offset v_offset) x),'[]'::jsonb),
      'total',(select count(*) from scoped),'limit',v_limit,'offset',v_offset) into v_result;
    return v_result;
  end if;

  if p_command='imports' then
    v_id:=nullif(p_data->>'campaignId','')::uuid;
    if v_id is not null then
      select * into v_campaign from public.campaigns where id=v_id and workspace_id=p_workspace_id;
      if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
      perform workflow_private.require_team(p_workspace_id,v_campaign.team_id);
    end if;
    with batches as (
      select import_batch_id id,source_filename filename,campaign_id,max(campaign_name) campaign_name,
        count(*) row_count,min(created_at) created_at
      from public.campaign_performance where workspace_id=p_workspace_id
        and workflow_private.can_team(p_workspace_id,team_id) and metric_provenance='observed'
        and import_batch_id is not null and (v_id is null or campaign_id=v_id)
      group by import_batch_id,source_filename,campaign_id
    ) select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(x)) from
      (select * from batches order by created_at desc,id limit v_limit offset v_offset) x),'[]'::jsonb),
      'total',(select count(*) from batches)) into v_result;
    return v_result;
  end if;
  if p_command='import' then
    select * into v_campaign from public.campaigns where id=(p_data->>'campaignId')::uuid and workspace_id=p_workspace_id;
    if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
    perform workflow_private.require_team(p_workspace_id,v_campaign.team_id);
    v_request:=(p_data->>'batchId')::uuid;
    if v_request is null or jsonb_typeof(p_data->'rows') is distinct from 'array' or jsonb_array_length(p_data->'rows') not between 1 and 2000
      or length(coalesce(p_data->>'filename','')) not between 1 and 255 then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
    perform pg_advisory_xact_lock(hashtext(p_workspace_id::text),hashtext(v_actor::text||v_request::text));
    select count(*) into v_count from public.campaign_performance where workspace_id=p_workspace_id and import_batch_id=v_request;
    if v_count>0 then
      if v_count<>jsonb_array_length(p_data->'rows') or exists(
        select 1 from public.campaign_performance d
        left join jsonb_array_elements(p_data->'rows') with ordinality r(value,n) on d.source_row=r.n+1
        where d.workspace_id=p_workspace_id and d.import_batch_id=v_request and
          (d.created_by<>v_actor or d.campaign_id<>v_campaign.id or d.source_filename is distinct from p_data->>'filename'
           or r.value is null or jsonb_build_object('channel',d.channel,'record_date',d.record_date,
             'spend',d.spend,'clicks',d.clicks,'impressions',d.impressions,'conversions',d.conversions,'revenue',d.revenue) is distinct from r.value)
      ) then
        raise exception using message='REQUEST_CONFLICT',errcode='P0001';
      end if;
      return jsonb_build_object('batchId',v_request,'rowCount',v_count,'reused',true);
    end if;
    v_count:=2;
    for v_row in select value from jsonb_array_elements(p_data->'rows') loop
      if coalesce(v_row->>'channel','') not in ('facebook','google','tiktok')
        or not (case v_row->>'channel' when 'facebook' then 'Meta' when 'google' then 'Google Ads' else 'TikTok' end)=any(v_campaign.channels)
        or coalesce((v_row->>'clicks')::bigint,-1)<0
        or coalesce((v_row->>'impressions')::bigint,-1)<0 or (v_row->>'clicks')::bigint>(v_row->>'impressions')::bigint
        or coalesce((v_row->>'spend')::numeric,-1)<0 or coalesce((v_row->>'conversions')::bigint,-1)<0
        or coalesce((v_row->>'revenue')::numeric,-1)<0
        or (v_row->>'spend')::numeric::text in ('NaN','Infinity','-Infinity') or (v_row->>'revenue')::numeric::text in ('NaN','Infinity','-Infinity') then
        raise exception using message='VALIDATION_ERROR',errcode='P0001';
      end if;
      insert into public.campaign_performance(workspace_id,team_id,campaign_id,campaign_name,channel,ctr,cpa,roas,impressions,spend,record_date,source,
        clicks,conversions,revenue,import_batch_id,source_filename,source_row,created_by,metric_provenance)
      values(p_workspace_id,v_campaign.team_id,v_campaign.id,v_campaign.name,v_row->>'channel',
        case when (v_row->>'impressions')::numeric>0 then (v_row->>'clicks')::numeric/(v_row->>'impressions')::numeric*100 else 0 end,
        case when (v_row->>'conversions')::numeric>0 then (v_row->>'spend')::numeric/(v_row->>'conversions')::numeric else 0 end,
        case when (v_row->>'spend')::numeric>0 then (v_row->>'revenue')::numeric/(v_row->>'spend')::numeric else 0 end,
        (v_row->>'impressions')::bigint,(v_row->>'spend')::numeric,(v_row->>'record_date')::date,'csv_import',
        (v_row->>'clicks')::bigint,(v_row->>'conversions')::bigint,(v_row->>'revenue')::numeric,v_request,p_data->>'filename',v_count,v_actor,'observed');
      v_count:=v_count+1;
    end loop;
    insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,after_value)
      values(p_workspace_id,v_actor,'import','campaign_performance',v_campaign.id,jsonb_build_object('batchId',v_request,'rows',v_count-2));
    return jsonb_build_object('batchId',v_request,'rowCount',v_count-2,'reused',false);
  end if;

  if p_command in ('notifications','read_notification') then
    if p_command='read_notification' then
      update public.notifications set is_read=true where id=(p_data->>'id')::uuid and workspace_id=p_workspace_id and user_id=v_actor;
      if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
    end if;
    return jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from public.notifications where workspace_id=p_workspace_id and user_id=v_actor order by created_at desc,id limit v_limit offset v_offset) x),'[]'::jsonb),
      'unreadCount',(select count(*) from public.notifications where workspace_id=p_workspace_id and user_id=v_actor and not is_read));
  end if;

  if p_command='analytics' then
    v_start:=coalesce((p_data->>'from')::date,current_date-29); v_end:=coalesce((p_data->>'to')::date,current_date);
    if v_end<v_start or v_end-v_start>366 then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
    v_id:=nullif(p_data->>'campaignId','')::uuid;
    if v_id is not null then
      select * into v_campaign from public.campaigns where id=v_id and workspace_id=p_workspace_id;
      if not found then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
      perform workflow_private.require_team(p_workspace_id,v_campaign.team_id);
    end if;
    v_currency:=case when v_id is not null then v_campaign.currency else coalesce((select currency from public.business_profiles where workspace_id=p_workspace_id limit 1),'VND') end;
    select coalesce(sum(spend),0),coalesce(sum(revenue),0),coalesce(sum(conversions),0),coalesce(sum(clicks),0),coalesce(sum(impressions),0),count(*)
    into v_spend,v_revenue,v_conversions,v_clicks,v_impressions,v_count
    from public.campaign_performance where workspace_id=p_workspace_id and workflow_private.can_team(p_workspace_id,team_id)
      and metric_provenance='observed' and record_date between v_start and v_end and (v_id is null or campaign_id=v_id)
      and campaign_id in (select id from public.campaigns where workspace_id=p_workspace_id and currency=v_currency);
    select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into v_items from (
      select channel,sum(spend) spend,sum(revenue) revenue,sum(conversions) conversions,sum(clicks) clicks,sum(impressions) impressions,
        case when sum(spend)>0 then sum(revenue)/sum(spend) else null end roas,
        case when sum(conversions)>0 then sum(spend)/sum(conversions) else null end cpa
      from public.campaign_performance where workspace_id=p_workspace_id and workflow_private.can_team(p_workspace_id,team_id)
        and metric_provenance='observed' and record_date between v_start and v_end and (v_id is null or campaign_id=v_id)
        and campaign_id in (select id from public.campaigns where workspace_id=p_workspace_id and currency=v_currency) group by channel
    ) x;
    return jsonb_build_object('from',v_start,'to',v_end,'currency',v_currency,'rowCount',v_count,'spend',v_spend,'revenue',v_revenue,'conversions',v_conversions,'clicks',v_clicks,'impressions',v_impressions,
      'roas',case when v_spend>0 then v_revenue/v_spend else null end,'cpa',case when v_conversions>0 then v_spend/v_conversions else null end,
      'ctr',case when v_impressions>0 then v_clicks/v_impressions*100 else null end,'channels',v_items,'insightSource','rule_based',
      'campaignCount',(select count(*) from public.campaigns where workspace_id=p_workspace_id and workflow_private.can_team(p_workspace_id,team_id)),
      'pendingCount',(select count(*) from public.approvals where workspace_id=p_workspace_id and workflow_private.can_team(p_workspace_id,team_id) and status='pending'),
      'escalatedCount',(select count(*) from public.approvals where workspace_id=p_workspace_id and workflow_private.can_team(p_workspace_id,team_id) and status='escalated'));
  end if;
  raise exception using message='VALIDATION_ERROR',errcode='P0001';
exception when invalid_text_representation or numeric_value_out_of_range or invalid_datetime_format or datetime_field_overflow or check_violation or not_null_violation then
  raise exception using message='VALIDATION_ERROR',errcode='P0001';
end $$;
revoke all on function public.leader_workflow(uuid,text,jsonb) from public,anon;
grant execute on function public.leader_workflow(uuid,text,jsonb) to authenticated;
revoke all on all functions in schema workflow_private from public,anon,authenticated;
grant execute on function workflow_private.can_team(uuid,uuid) to authenticated;
grant execute on function workflow_private.can_read_target(uuid,text,uuid) to authenticated;
notify pgrst,'reload schema';
