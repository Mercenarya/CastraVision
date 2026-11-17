create function membership_private.check_page(p_limit int,p_offset int) returns void
language plpgsql immutable set search_path='' as $$ begin
  if p_limit is null or p_limit not between 1 and 50 or p_offset is null or p_offset<0 then
    raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
end; $$;

-- Invitation workflow: references never confer authority without verified email ownership.
create function public.membership_invite(p_workspace_id uuid,p_email text,p_role text default 'member',p_team_id uuid default null) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_actor uuid:=membership_private.require_manager(p_workspace_id); v_email text:=lower(btrim(p_email)); v_row public.workspace_invitations; v_recipient uuid;
begin
  if v_email is null or length(v_email)>254 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or p_role is null or p_role not in ('member','manager') then
    raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
  perform membership_private.check_team(p_workspace_id,p_team_id);
  perform pg_advisory_xact_lock(hashtextextended('invite:'||p_workspace_id::text||':'||v_email,0));
  if exists(select 1 from public.workspace_members m join auth.users u on u.id=m.user_id where m.workspace_id=p_workspace_id and lower(u.email)=v_email) then
    raise exception using message='ALREADY_MEMBER',errcode='P0001'; end if;
  update public.workspace_invitations i set status='revoked' where i.workspace_id=p_workspace_id and i.normalized_email=v_email and i.status='pending'
    and (i.expires_at<=now() or not exists(select 1 from public.workspace_members m where m.workspace_id=p_workspace_id and m.user_id=i.invited_by and m.role='admin'));
  select * into v_row from public.workspace_invitations where workspace_id=p_workspace_id and normalized_email=v_email and status='pending';
  if found then
    if v_row.invited_role::text<>p_role or v_row.team_id is distinct from p_team_id then raise exception using message='INVITATION_CONFLICT',errcode='P0001'; end if;
    return membership_private.invitation_json(v_row);
  end if;
  insert into public.workspace_invitations(workspace_id,normalized_email,invited_role,team_id,invited_by)
  values(p_workspace_id,v_email,p_role::public.workspace_role,p_team_id,v_actor) returning * into v_row;
  perform membership_private.audit(p_workspace_id,'workspace_invitations',v_row.id,'create',null,jsonb_build_object('role',p_role,'teamId',p_team_id));
  select id into v_recipient from auth.users where lower(email)=v_email and email_confirmed_at is not null;
  if v_recipient is not null then perform membership_private.notify(p_workspace_id,v_recipient,'invitation_created',null,v_row.id); end if;
  return membership_private.invitation_json(v_row);
end; $$;
create function public.membership_revoke_invitation(p_workspace_id uuid,p_invitation_id uuid) returns jsonb
language plpgsql volatile security definer set search_path='' as $$ declare v_row public.workspace_invitations; begin
  perform membership_private.require_manager(p_workspace_id);
  select * into v_row from public.workspace_invitations where id=p_invitation_id and workspace_id=p_workspace_id for update;
  if not found then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  if v_row.status='revoked' then return membership_private.invitation_json(v_row); end if;
  if v_row.status<>'pending' then raise exception using message='REQUEST_CLOSED',errcode='P0001'; end if;
  update public.workspace_invitations set status='revoked' where id=v_row.id returning * into v_row;
  perform membership_private.audit(p_workspace_id,'workspace_invitations',v_row.id,'revoke',jsonb_build_object('status','pending'),jsonb_build_object('status','revoked'));
  return membership_private.invitation_json(v_row);
end; $$;
create function public.membership_my_invitations(p_limit int default 20,p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$ declare v_email text; v_items jsonb; v_total int; begin
  perform membership_private.actor(); perform membership_private.check_page(p_limit,p_offset);
  v_email:=membership_private.own_email();
  select count(*) into v_total from public.workspace_invitations where normalized_email=v_email;
  select coalesce(jsonb_agg(x.item),'[]') into v_items from (select membership_private.invitation_json(i) item
    from public.workspace_invitations i where normalized_email=v_email order by created_at desc,id limit p_limit offset p_offset) x;
  return jsonb_build_object('items',v_items,'total',v_total,'limit',p_limit,'offset',p_offset);
end; $$;
create function public.membership_accept_invitation(p_invitation_id uuid) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_actor uuid:=membership_private.actor(); v_row public.workspace_invitations; v_added uuid; v_request record; v_manager record;
begin
  perform membership_private.require_password();
  select * into v_row from public.workspace_invitations where id=p_invitation_id and normalized_email=membership_private.own_email();
  if not found then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  perform membership_private.lock_member(v_row.workspace_id,v_actor);
  select * into v_row from public.workspace_invitations where id=p_invitation_id for update;
  if v_row.status='accepted' and v_row.accepted_by=v_actor then return membership_private.invitation_json(v_row); end if;
  if v_row.status<>'pending' then raise exception using message='INVITATION_REVOKED',errcode='P0001'; end if;
  if v_row.expires_at<=now() then raise exception using message='INVITATION_EXPIRED',errcode='P0001'; end if;
  if not exists(select 1 from public.workspace_members where workspace_id=v_row.workspace_id and user_id=v_row.invited_by and role='admin') then
    raise exception using message='INVITATION_REVOKED',errcode='P0001'; end if;
  perform membership_private.check_team(v_row.workspace_id,v_row.team_id);
  insert into public.workspace_members(workspace_id,user_id,role) values(v_row.workspace_id,v_actor,v_row.invited_role)
    on conflict do nothing returning user_id into v_added;
  if v_added is not null then
    if v_row.team_id is not null then insert into public.workspace_team_members values(v_row.workspace_id,v_actor,v_row.team_id); end if;
    perform membership_private.audit(v_row.workspace_id,'workspace_members',v_actor,'create',null,jsonb_build_object('role',v_row.invited_role));
  end if;
  for v_request in update public.workspace_join_requests set status='approved',reviewed_by=v_row.invited_by,reviewed_at=now(),
      assigned_team_id=case when v_added is not null then v_row.team_id else null end
    where workspace_id=v_row.workspace_id and applicant_id=v_actor and status='pending' returning id
  loop
    perform membership_private.audit(v_row.workspace_id,'workspace_join_requests',v_request.id,'approve',jsonb_build_object('status','pending'),jsonb_build_object('status','approved','viaInvitation',v_row.id));
    perform membership_private.notify(v_row.workspace_id,v_actor,'join_approved',v_request.id);
  end loop;
  update public.workspace_invitations set status='accepted',accepted_by=v_actor,accepted_at=now() where id=v_row.id returning * into v_row;
  perform membership_private.audit(v_row.workspace_id,'workspace_invitations',v_row.id,'accept',jsonb_build_object('status','pending'),jsonb_build_object('status','accepted'));
  for v_manager in select user_id from public.workspace_members where workspace_id=v_row.workspace_id and role='admin'
  loop perform membership_private.notify(v_row.workspace_id,v_manager.user_id,'invitation_accepted',null,v_row.id); end loop;
  return membership_private.invitation_json(v_row);
end; $$;
create function public.membership_claim_delivery(p_workspace_id uuid,p_invitation_id uuid) returns jsonb
language plpgsql volatile security definer set search_path='' as $$ declare v_row public.workspace_invitations; v_attempt uuid:=gen_random_uuid(); begin
  perform membership_private.require_manager(p_workspace_id);
  select * into v_row from public.workspace_invitations where id=p_invitation_id and workspace_id=p_workspace_id for update;
  if not found then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  if v_row.status<>'pending' then raise exception using message='INVITATION_REVOKED',errcode='P0001'; end if;
  if v_row.expires_at<=now() then raise exception using message='INVITATION_EXPIRED',errcode='P0001'; end if;
  if v_row.delivery_lease_until>now() or v_row.last_sent_at>now()-interval '60 seconds' then raise exception using message='RATE_LIMITED',errcode='P0001'; end if;
  update public.workspace_invitations set delivery_attempt_id=v_attempt,delivery_lease_until=now()+interval '120 seconds',delivery_status='pending',last_sent_at=now() where id=v_row.id;
  return jsonb_build_object('attemptId',v_attempt,'recipientEmail',v_row.normalized_email,'invitationId',v_row.id);
end; $$;
create function public.membership_record_delivery(p_invitation_id uuid,p_attempt_id uuid,p_succeeded boolean) returns jsonb
language plpgsql volatile security definer set search_path='' as $$ begin
  if p_succeeded is null then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
  update public.workspace_invitations set delivery_status=case when p_succeeded then 'sent' else 'failed' end,delivery_lease_until=null
  where id=p_invitation_id and delivery_attempt_id=p_attempt_id;
  if not found then raise exception using message='REQUEST_CLOSED',errcode='P0001'; end if;
  return '{"ok":true}'::jsonb;
end; $$;

create function membership_private.member_json(m public.workspace_members) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('userId',m.user_id,'name',coalesce(p.full_name,''),'email',u.email,'role',m.role,'joinedAt',m.joined_at,
 'teamIds',coalesce((select jsonb_agg(t.team_id) from public.workspace_team_members t where t.workspace_id=m.workspace_id and t.user_id=m.user_id),'[]'))
 from auth.users u left join public.profiles p on p.id=u.id where u.id=m.user_id;
$$;
create function public.membership_personnel(p_workspace_id uuid,p_tab text default 'members',p_search text default '',p_role text default '',p_status text default '',p_team_id uuid default null,p_sort text default 'newest',p_limit int default 20,p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$ declare v_items jsonb; v_total int; begin
  perform membership_private.require_manager(p_workspace_id); perform membership_private.check_page(p_limit,p_offset);
  if p_tab is null or p_tab not in ('members','requests','invitations') or p_search is null or length(p_search)>254 or p_sort is null or p_sort not in ('newest','oldest') then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
  with source as (
    select membership_private.member_json(m) item,m.joined_at ts,m.user_id id,m.role::text role,'' status,m.user_id user_id,null::uuid assigned_team from public.workspace_members m where m.workspace_id=p_workspace_id and p_tab='members'
    union all
    select membership_private.request_json(r),r.requested_at,r.id,'member',r.status,r.applicant_id,r.assigned_team_id from public.workspace_join_requests r where r.workspace_id=p_workspace_id and p_tab='requests'
    union all
    select membership_private.invitation_json(i),i.created_at,i.id,i.invited_role::text,case when i.status='pending' and i.expires_at<=now() then 'expired' else i.status end,null::uuid,i.team_id from public.workspace_invitations i where i.workspace_id=p_workspace_id and p_tab='invitations'
  ), filtered as (
    select * from source where (coalesce(p_role,'')='' or role=p_role) and (coalesce(p_status,'')='' or status=p_status)
    and (id::text=p_search or coalesce(item->>'email',item->>'applicantEmail','') ilike '%'||p_search||'%' or coalesce(item->>'name',item->>'applicantName','') ilike '%'||p_search||'%')
    and (p_team_id is null or assigned_team=p_team_id or exists(select 1 from public.workspace_team_members t where t.workspace_id=p_workspace_id and t.user_id=source.user_id and t.team_id=p_team_id))
  ), sliced as (
    select item from filtered order by case when p_sort='newest' then ts end desc,case when p_sort='oldest' then ts end asc,id limit p_limit offset p_offset
  ) select coalesce((select jsonb_agg(item) from sliced),'[]'),(select count(*)::int from filtered) into v_items,v_total;
  return jsonb_build_object('items',v_items,'total',v_total,'limit',p_limit,'offset',p_offset);
end; $$;
create function public.membership_update_member(p_workspace_id uuid,p_user_id uuid,p_role text,p_team_ids uuid[] default '{}') returns jsonb
language plpgsql volatile security definer set search_path='' as $$ declare v_row public.workspace_members; v_before jsonb; v_team uuid; begin
  perform membership_private.require_manager(p_workspace_id);
  if p_role is null or p_role not in ('member','manager') or p_team_ids is null or cardinality(p_team_ids)>20 then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
  perform membership_private.lock_member(p_workspace_id,p_user_id);
  select * into v_row from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id for update;
  if not found or v_row.role='admin' then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  v_before:=membership_private.member_json(v_row);
  foreach v_team in array p_team_ids loop
    if v_team is null then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
    perform membership_private.check_team(p_workspace_id,v_team);
  end loop;
  update public.workspace_members set role=p_role::public.workspace_role where workspace_id=p_workspace_id and user_id=p_user_id returning * into v_row;
  delete from public.workspace_team_members where workspace_id=p_workspace_id and user_id=p_user_id;
  insert into public.workspace_team_members select p_workspace_id,p_user_id,t from (select distinct unnest(p_team_ids) t) x;
  perform membership_private.audit(p_workspace_id,'workspace_members',p_user_id,'update',v_before,membership_private.member_json(v_row));
  perform membership_private.notify(p_workspace_id,p_user_id,'membership_updated');
  return membership_private.member_json(v_row);
end; $$;
create function public.membership_remove_member(p_workspace_id uuid,p_user_id uuid) returns jsonb
language plpgsql volatile security definer set search_path='' as $$ declare v_row public.workspace_members; begin
  perform membership_private.require_manager(p_workspace_id);
  perform membership_private.lock_member(p_workspace_id,p_user_id);
  select * into v_row from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id for update;
  if not found or v_row.role='admin' then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  delete from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id;
  perform membership_private.audit(p_workspace_id,'workspace_members',p_user_id,'delete',jsonb_build_object('role',v_row.role),null);
  perform membership_private.notify(p_workspace_id,p_user_id,'membership_removed');
  return '{"ok":true}'::jsonb;
end; $$;
create function membership_private.lock_member(p_workspace_id uuid,p_user_id uuid) returns void
language sql volatile set search_path='' as $$
  select pg_advisory_xact_lock(hashtextextended(p_workspace_id::text||':'||p_user_id::text,0));
$$;
create function membership_private.check_team(p_workspace_id uuid,p_team_id uuid) returns void
language plpgsql stable security definer set search_path='' as $$ begin
  if p_team_id is not null and not exists(select 1 from public.workspace_teams where id=p_team_id and workspace_id=p_workspace_id) then
    raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
end; $$;
create function membership_private.audit(p_ws uuid,p_entity text,p_id uuid,p_action text,p_before jsonb,p_after jsonb) returns void
language sql volatile security definer set search_path='' as $$
  insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,before_value,after_value)
  values(p_ws,auth.uid(),p_action,p_entity,p_id,p_before,p_after);
$$;
create function membership_private.notify(p_ws uuid,p_user uuid,p_event text,p_request uuid default null,p_invite uuid default null) returns void
language sql volatile security definer set search_path='' as $$
  insert into public.membership_notifications(workspace_id,recipient_id,event_type,request_id,invitation_id)
  values(p_ws,p_user,p_event,p_request,p_invite) on conflict do nothing;
$$;
create function membership_private.request_json(r public.workspace_join_requests) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',r.id,'workspaceId',r.workspace_id,'companyName',w.name,
   'applicantId',r.applicant_id,'applicantName',coalesce(p.full_name,''),'applicantEmail',u.email,
   'message',r.message,'status',r.status,'requestedAt',r.requested_at,'reviewedAt',r.reviewed_at,
   'rejectionReason',r.rejection_reason,'assignedTeamId',r.assigned_team_id)
 from public.workspaces w join auth.users u on u.id=r.applicant_id left join public.profiles p on p.id=u.id where w.id=r.workspace_id;
$$;
create function membership_private.invitation_json(i public.workspace_invitations) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',i.id,'workspaceId',i.workspace_id,'companyName',w.name,
   'email',i.normalized_email,'role',i.invited_role,'teamId',i.team_id,
   'status',case when i.status='pending' and i.expires_at<=now() then 'expired' else i.status end,
   'expiresAt',i.expires_at,'deliveryStatus',i.delivery_status,'lastSentAt',i.last_sent_at)
 from public.workspaces w where w.id=i.workspace_id;
$$;

create function public.membership_get_recruitment(p_workspace_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$ declare v_result jsonb; begin
  perform membership_private.require_manager(p_workspace_id);
  select jsonb_build_object('acceptingJoinRequests',accepting_join_requests,'publicDescription',public_description)
  into v_result from public.workspace_recruitment_settings where workspace_id=p_workspace_id;
  return coalesce(v_result,'{"acceptingJoinRequests":false,"publicDescription":""}'::jsonb);
end; $$;
create function public.membership_set_recruitment(p_workspace_id uuid,p_accepting boolean,p_description text) returns jsonb
language plpgsql volatile security definer set search_path='' as $$ declare v_before jsonb; begin
  perform membership_private.require_manager(p_workspace_id);
  if p_accepting is null or p_description is null or length(p_description)>300 then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
  v_before:=public.membership_get_recruitment(p_workspace_id);
  insert into public.workspace_recruitment_settings(workspace_id,accepting_join_requests,public_description)
  values(p_workspace_id,p_accepting,btrim(p_description)) on conflict(workspace_id) do update
  set accepting_join_requests=excluded.accepting_join_requests,public_description=excluded.public_description,updated_at=now();
  perform membership_private.audit(p_workspace_id,'workspace_recruitment_settings',p_workspace_id,'update',v_before,public.membership_get_recruitment(p_workspace_id));
  return public.membership_get_recruitment(p_workspace_id);
end; $$;
create function public.membership_teams(p_workspace_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$ declare v_items jsonb; begin
  perform membership_private.require_manager(p_workspace_id);
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'workspaceId',workspace_id,'name',name) order by name),'[]')
  into v_items from public.workspace_teams where workspace_id=p_workspace_id;
  return jsonb_build_object('items',v_items);
end; $$;
create function public.membership_create_team(p_workspace_id uuid,p_name text) returns jsonb
language plpgsql volatile security definer set search_path='' as $$ declare v_id uuid; v_result jsonb; begin
  perform membership_private.require_manager(p_workspace_id);
  if p_name is null or length(btrim(p_name)) not between 1 and 80 then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
  insert into public.workspace_teams(workspace_id,name) values(p_workspace_id,btrim(p_name)) returning id into v_id;
  v_result:=jsonb_build_object('id',v_id,'workspaceId',p_workspace_id,'name',btrim(p_name));
  perform membership_private.audit(p_workspace_id,'workspace_teams',v_id,'create',null,v_result);
  return v_result;
exception when unique_violation then raise exception using message='INVITATION_CONFLICT',errcode='P0001';
end; $$;

create function public.membership_my_requests(p_limit int default 20,p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$ declare v_actor uuid:=membership_private.actor(); v_items jsonb; v_total int; begin
  perform membership_private.check_page(p_limit,p_offset);
  select count(*) into v_total from public.workspace_join_requests where applicant_id=v_actor;
  select coalesce(jsonb_agg(x.item),'[]') into v_items from (
    select membership_private.request_json(r) item from public.workspace_join_requests r where applicant_id=v_actor order by requested_at desc,id limit p_limit offset p_offset) x;
  return jsonb_build_object('items',v_items,'total',v_total,'limit',p_limit,'offset',p_offset);
end; $$;
create function public.membership_request_join(p_workspace_id uuid,p_message text default '') returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_actor uuid:=membership_private.actor(); v_row public.workspace_join_requests; v_manager record;
begin
  perform membership_private.require_password();
  if p_workspace_id is null or p_message is null or length(p_message)>1000 then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
  perform pg_advisory_xact_lock(hashtextextended('membership-request:'||v_actor::text,0));
  perform membership_private.lock_member(p_workspace_id,v_actor);
  select * into v_row from public.workspace_join_requests where workspace_id=p_workspace_id and applicant_id=v_actor and status='pending';
  if found then return membership_private.request_json(v_row); end if;
  if exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=v_actor) then raise exception using message='ALREADY_MEMBER',errcode='P0001'; end if;
  if not exists(select 1 from public.workspace_recruitment_settings where workspace_id=p_workspace_id and accepting_join_requests)
     or not exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and role='admin') then
    raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  if (select count(*) from public.workspace_join_requests where applicant_id=v_actor and status='pending')>=5
    or exists(select 1 from public.workspace_join_requests where workspace_id=p_workspace_id and applicant_id=v_actor and coalesce(reviewed_at,requested_at)>now()-interval '60 seconds') then
    raise exception using message='RATE_LIMITED',errcode='P0001'; end if;
  insert into public.workspace_join_requests(workspace_id,applicant_id,message) values(p_workspace_id,v_actor,btrim(p_message)) returning * into v_row;
  perform membership_private.audit(p_workspace_id,'workspace_join_requests',v_row.id,'create',null,jsonb_build_object('status','pending','applicantId',v_actor));
  for v_manager in select m.user_id from public.workspace_members m join auth.users u on u.id=m.user_id
    where m.workspace_id=p_workspace_id and m.role='admin' and coalesce(u.raw_app_meta_data->>'platform_role',u.raw_app_meta_data->>'role','')<>'system_admin'
  loop perform membership_private.notify(p_workspace_id,v_manager.user_id,'join_requested',v_row.id); end loop;
  return membership_private.request_json(v_row);
end; $$;
create function public.membership_cancel_request(p_request_id uuid) returns jsonb
language plpgsql volatile security definer set search_path='' as $$ declare v_actor uuid:=membership_private.actor(); v_row public.workspace_join_requests; begin
  select * into v_row from public.workspace_join_requests where id=p_request_id and applicant_id=v_actor;
  if not found then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  perform membership_private.lock_member(v_row.workspace_id,v_actor);
  select * into v_row from public.workspace_join_requests where id=p_request_id for update;
  if v_row.status='cancelled' then return membership_private.request_json(v_row); end if;
  if v_row.status<>'pending' then raise exception using message='REQUEST_CLOSED',errcode='P0001'; end if;
  update public.workspace_join_requests set status='cancelled',reviewed_at=now(),reviewed_by=v_actor where id=v_row.id returning * into v_row;
  perform membership_private.audit(v_row.workspace_id,'workspace_join_requests',v_row.id,'cancel',jsonb_build_object('status','pending'),jsonb_build_object('status','cancelled'));
  return membership_private.request_json(v_row);
end; $$;
create function public.membership_review_request(p_workspace_id uuid,p_request_id uuid,p_decision text,p_team_id uuid default null,p_reason text default '') returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_actor uuid:=membership_private.require_manager(p_workspace_id); v_row public.workspace_join_requests; v_status text; v_added uuid;
begin
  if p_decision is null or p_decision not in ('approve','reject') or p_reason is null or length(p_reason)>500
     or (p_decision='reject' and length(btrim(p_reason))=0) then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
  select * into v_row from public.workspace_join_requests where id=p_request_id and workspace_id=p_workspace_id;
  if not found then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  perform membership_private.lock_member(p_workspace_id,v_row.applicant_id);
  select * into v_row from public.workspace_join_requests where id=p_request_id for update;
  v_status:=case when p_decision='approve' then 'approved' else 'rejected' end;
  if v_row.status=v_status then return membership_private.request_json(v_row); end if;
  if v_row.status<>'pending' then raise exception using message='REQUEST_CLOSED',errcode='P0001'; end if;
  perform membership_private.check_team(p_workspace_id,p_team_id);
  if p_decision='approve' then
    insert into public.workspace_members(workspace_id,user_id,role) values(p_workspace_id,v_row.applicant_id,'member')
      on conflict do nothing returning user_id into v_added;
    if v_added is not null and p_team_id is not null then insert into public.workspace_team_members values(p_workspace_id,v_added,p_team_id); end if;
    if v_added is not null then perform membership_private.audit(p_workspace_id,'workspace_members',v_added,'create',null,jsonb_build_object('role','member')); end if;
  end if;
  update public.workspace_join_requests set status=v_status,reviewed_by=v_actor,reviewed_at=now(),
    rejection_reason=case when p_decision='reject' then btrim(p_reason) else null end,
    assigned_team_id=case when v_added is not null then p_team_id else null end where id=p_request_id returning * into v_row;
  perform membership_private.audit(p_workspace_id,'workspace_join_requests',v_row.id,p_decision,jsonb_build_object('status','pending'),jsonb_build_object('status',v_status));
  perform membership_private.notify(p_workspace_id,v_row.applicant_id,case when p_decision='approve' then 'join_approved' else 'join_rejected' end,v_row.id);
  return membership_private.request_json(v_row);
end; $$;

create function public.membership_list_notifications(p_unread_only boolean default false,p_limit int default 20,p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$ declare v_actor uuid:=membership_private.actor(); v_items jsonb; v_total int; v_unread int; begin
  perform membership_private.check_page(p_limit,p_offset);
  if p_unread_only is null then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
  select count(*),count(*) filter(where read_at is null) into v_total,v_unread from public.membership_notifications where recipient_id=v_actor;
  select coalesce(jsonb_agg(x.item),'[]') into v_items from (
    select jsonb_build_object('id',n.id,'workspaceId',n.workspace_id,'companyName',w.name,'eventType',n.event_type,
      'requestId',n.request_id,'invitationId',n.invitation_id,'createdAt',n.created_at,'readAt',n.read_at) item
    from public.membership_notifications n join public.workspaces w on w.id=n.workspace_id where n.recipient_id=v_actor and (not p_unread_only or n.read_at is null)
    order by n.created_at desc,n.id limit p_limit offset p_offset) x;
  return jsonb_build_object('items',v_items,'total',case when p_unread_only then v_unread else v_total end,'unreadCount',v_unread,'limit',p_limit,'offset',p_offset);
end; $$;
create function public.membership_read_notification(p_notification_id uuid) returns jsonb
language plpgsql volatile security definer set search_path='' as $$ declare v_actor uuid:=membership_private.actor(); begin
  update public.membership_notifications set read_at=coalesce(read_at,now()) where id=p_notification_id and recipient_id=v_actor;
  if not found then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  return '{"ok":true}'::jsonb;
end; $$;

-- Deny direct mutations; explicit operator service access and guarded RPC replace them.
drop policy if exists workspace_members_admin_insert on public.workspace_members;
drop policy if exists workspace_members_admin_update on public.workspace_members;
drop policy if exists workspace_members_admin_delete on public.workspace_members;
revoke insert,update,delete on public.workspace_members from public,anon,authenticated;
revoke execute on function public.create_workspace_with_admin(text) from public,anon,authenticated;

revoke all on all functions in schema membership_private from public,anon,authenticated;
grant execute on function membership_private.valid_actor(),membership_private.is_manager(uuid),membership_private.own_email() to authenticated;
do $$ declare f record; begin
  for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and left(p.proname,11)='membership_'
  loop execute format('revoke all on function %s from public,anon',f.signature);
       execute format('grant execute on function %s to authenticated',f.signature); end loop;
end; $$;
revoke execute on function public.membership_record_delivery(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.membership_record_delivery(uuid,uuid,boolean) to service_role;
