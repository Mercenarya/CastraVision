begin;
create function platform_private.workspace_active(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select status='Active' from platform_private.companies where workspace_id=p_id),true);
$$;
create function platform_private.require_active(p_id uuid) returns void language plpgsql stable security definer set search_path='' as $$begin
 if p_id is not null and not platform_private.workspace_active(p_id) then raise exception using message='WORKSPACE_INACTIVE',errcode='P0001';end if;
end $$;
grant usage on schema platform_private to authenticated,service_role;
revoke all on function platform_private.workspace_active(uuid),platform_private.require_active(uuid) from public,anon;
grant execute on function platform_private.workspace_active(uuid) to authenticated,service_role;

-- Restrictive policies protect direct REST, including caller-owned membership rows.
do $$declare r record;begin
 for r in select c.table_name from information_schema.columns c join pg_catalog.pg_tables t on t.schemaname=c.table_schema and t.tablename=c.table_name
 where c.table_schema='public' and c.column_name='workspace_id' and c.udt_name='uuid' loop
  execute format('alter table public.%I enable row level security',r.table_name);
  execute format('create policy platform_active_tenant on public.%I as restrictive for all to authenticated using(platform_private.workspace_active(workspace_id)) with check(platform_private.workspace_active(workspace_id))',r.table_name);
 end loop;
end $$;
create policy platform_active_tenant on public.workspaces as restrictive for all to authenticated
 using(platform_private.workspace_active(id)) with check(platform_private.workspace_active(id));

-- Serialize business writes with a suspension commit. Do not retroactively cancel
-- a transaction which obtained its shared lock before the suspension request.
create function platform_private.guard_business_write() returns trigger language plpgsql security definer set search_path='' as $$
declare v_ws uuid;v_active boolean;begin
 if tg_table_name='workspaces' then
  v_ws:=case when tg_op='DELETE' then old.id else new.id end;
  if exists(select 1 from auth.users where id=auth.uid() and coalesce(raw_app_meta_data->>'platform_role',raw_app_meta_data->>'role','')='system_admin') then
   if tg_op='DELETE' then return old;else return new;end if;
  end if;
 else v_ws:=case when tg_op='DELETE' then old.workspace_id else new.workspace_id end;end if;
 select status='Active' into v_active from platform_private.companies where workspace_id=v_ws for share;
 if v_active=false then raise exception using message='WORKSPACE_INACTIVE',errcode='P0001';end if;
 if tg_op='UPDATE' and tg_table_name<>'workspaces' then
  if old.workspace_id is distinct from new.workspace_id then perform platform_private.require_active(old.workspace_id);end if;
 end if;
 if tg_op='DELETE' then return old;else return new;end if;
end $$;
do $$declare r record;begin
 for r in select c.table_name from information_schema.columns c join pg_catalog.pg_tables t on t.schemaname=c.table_schema and t.tablename=c.table_name
 where c.table_schema='public' and c.column_name='workspace_id' and c.udt_name='uuid'
 union select 'workspaces' loop
  execute format('create trigger platform_active_write before insert or update or delete on public.%I for each row execute function platform_private.guard_business_write()',r.table_name);
 end loop;
end $$;

-- Preserve each function's identity/grants/attributes and only insert the guard.
-- Explicit name/argument/language filters avoid rewriting arbitrary database code.
do $$declare r record;v_source text;v_new text;begin
 for r in select p.oid,p.prosrc,pg_get_functiondef(p.oid) definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang
 where n.nspname='public' and p.prosecdef and l.lanname='plpgsql' and 'p_workspace_id'=any(p.proargnames)
 and (p.proname like 'membership\_%' escape '\' or p.proname='leader_workflow') loop
  v_new:=regexp_replace(r.prosrc,'\mBEGIN\M','begin perform platform_private.require_active(p_workspace_id);','i');
  if v_new=r.prosrc then raise exception 'Guard insertion failed for %',r.oid::regprocedure;end if;
  execute replace(r.definition,r.prosrc,v_new);
 end loop;
 for r in select p.oid,p.prosrc,pg_get_functiondef(p.oid) definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='public' and p.proname in ('is_workspace_member','workspace_role'))
 or (n.nspname='membership_private' and p.proname='is_manager')
 or (n.nspname='workflow_private' and p.proname in ('actor_role','can_team')) loop
  if r.oid::regprocedure::text like '%actor_role%' then
   v_new:=regexp_replace(r.prosrc,'\mBEGIN\M','begin perform platform_private.require_active(p_ws);','i');
  elsif r.oid::regprocedure::text like '%can_team%' then
   v_new:=replace(r.prosrc,'select membership_private.valid_actor()','select platform_private.workspace_active(p_ws) and membership_private.valid_actor()');
  elsif r.oid::regprocedure::text like '%is_manager%' then
   v_new:=replace(r.prosrc,'select membership_private.valid_actor()','select platform_private.workspace_active(p_workspace_id) and membership_private.valid_actor()');
  else
   v_new:=replace(r.prosrc,'where wm.workspace_id = ws_id','where platform_private.workspace_active(ws_id) and wm.workspace_id = ws_id');
  end if;
  if v_new=r.prosrc then raise exception 'Helper guard insertion failed for %',r.oid::regprocedure;end if;
  execute replace(r.definition,r.prosrc,v_new);
 end loop;
end $$;

-- Global onboarding lists must filter suspended workspaces without preventing
-- the same user from onboarding into an unrelated active company.
do $$declare r record;v_new text;begin
 for r in select p.proname,p.prosrc,pg_get_functiondef(p.oid) definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('membership_company_directory','membership_my_requests','membership_my_invitations','membership_list_notifications','membership_accept_invitation','membership_cancel_request','admin_workspace_overview') loop
  v_new:=r.prosrc;
  case r.proname
   when 'membership_company_directory' then v_new:=replace(v_new,'where s.accepting_join_requests','where platform_private.workspace_active(w.id) and s.accepting_join_requests');
   when 'membership_my_requests' then v_new:=replace(v_new,'where applicant_id=v_actor','where platform_private.workspace_active(workspace_id) and applicant_id=v_actor');
   when 'membership_my_invitations' then v_new:=replace(v_new,'where normalized_email=v_email','where platform_private.workspace_active(workspace_id) and normalized_email=v_email');
   when 'membership_list_notifications' then
    v_new:=replace(v_new,'where recipient_id=v_actor','where platform_private.workspace_active(workspace_id) and recipient_id=v_actor');
    v_new:=replace(v_new,'where n.recipient_id=v_actor','where platform_private.workspace_active(n.workspace_id) and n.recipient_id=v_actor');
   when 'admin_workspace_overview' then v_new:=replace(v_new,'and caller.role = ''admin''','and caller.role = ''admin'' and platform_private.workspace_active(w.id)');
   else v_new:=replace(v_new,'perform membership_private.lock_member(v_row.workspace_id,v_actor);','perform platform_private.require_active(v_row.workspace_id); perform membership_private.lock_member(v_row.workspace_id,v_actor);');
  end case;
  if v_new=r.prosrc then raise exception 'List/accept guard insertion failed for %',r.proname;end if;
  execute replace(r.definition,r.prosrc,v_new);
 end loop;
end $$;

create function public.platform_workspace_access(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 perform membership_private.actor();
 if not exists(select 1 from public.workspace_members where workspace_id=p_id and user_id=auth.uid()) then return '{"member":false,"active":false}'::jsonb;end if;
 return jsonb_build_object('member',true,'active',platform_private.workspace_active(p_id));
end $$;

create function public.platform_invitation_action(p_id uuid,p_action text) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_actor uuid:=platform_private.actor();v_row platform_private.manager_invitations;begin
 select * into v_row from platform_private.manager_invitations where id=p_id for update;
 if not found then raise exception using message='NOT_FOUND',errcode='P0001';end if;
 if p_action='revoke' then
  if v_row.status='accepted' then raise exception using message='REQUEST_CLOSED',errcode='P0001';end if;
  update platform_private.manager_invitations set status='revoked' where id=p_id;
  insert into platform_private.audit_events(workspace_id,actor_id,action,changes) values(v_row.workspace_id,v_actor,'manager_invitation_revoked','{}');
  return public.platform_company(v_row.workspace_id);
 end if;
 if p_action<>'claim' then raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
 perform platform_private.require_active(v_row.workspace_id);
 if v_row.status<>'pending' then raise exception using message='INVITATION_REVOKED',errcode='P0001';end if;
 if v_row.expires_at<=now() then raise exception using message='INVITATION_EXPIRED',errcode='P0001';end if;
 if v_row.attempt_at>now()-interval '60 seconds' then raise exception using message='RATE_LIMITED',errcode='P0001';end if;
 update platform_private.manager_invitations set attempt_id=gen_random_uuid(),attempt_at=now(),delivery_status='sending' where id=p_id returning * into v_row;
 return jsonb_build_object('id',v_row.id,'workspaceId',v_row.workspace_id,'recipientEmail',v_row.normalized_email,'attemptId',v_row.attempt_id);
end $$;
create function public.platform_record_delivery(p_id uuid,p_attempt uuid,p_succeeded boolean) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_row platform_private.manager_invitations;begin
 update platform_private.manager_invitations set delivery_status=case when p_succeeded then 'sent' else 'failed' end
 where id=p_id and attempt_id=p_attempt and status='pending' returning * into v_row;
 if not found then raise exception using message='REQUEST_CONFLICT',errcode='P0001';end if;
 insert into platform_private.audit_events(workspace_id,actor_id,action,changes) values(v_row.workspace_id,v_row.created_by,'manager_invitation_delivery',jsonb_build_object('status',v_row.delivery_status));
 return jsonb_build_object('deliveryStatus',v_row.delivery_status);
end $$;
create function public.platform_my_manager_invitations() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_items jsonb;begin
 perform membership_private.actor();
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'workspaceId',i.workspace_id,'companyName',w.name,'role','admin','status',i.status,'expiresAt',i.expires_at,'kind','platform_manager')),'[]') into v_items
 from platform_private.manager_invitations i join public.workspaces w on w.id=i.workspace_id
 where i.normalized_email=membership_private.own_email() and platform_private.workspace_active(i.workspace_id);
 return jsonb_build_object('items',v_items);
end $$;
create function public.platform_accept_manager_invitation(p_id uuid) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_actor uuid:=membership_private.actor();v_row platform_private.manager_invitations;v_role public.workspace_role;v_team uuid;begin
 perform membership_private.require_password();
 select * into v_row from platform_private.manager_invitations where id=p_id and normalized_email=membership_private.own_email() for update;
 if not found then raise exception using message='PERMISSION_DENIED',errcode='P0001';end if;
 perform platform_private.require_active(v_row.workspace_id);
 if v_row.status='accepted' and v_row.accepted_by=v_actor then return jsonb_build_object('workspaceId',v_row.workspace_id,'status','accepted');end if;
 if v_row.status<>'pending' then raise exception using message='INVITATION_REVOKED',errcode='P0001';end if;
 if v_row.expires_at<=now() then raise exception using message='INVITATION_EXPIRED',errcode='P0001';end if;
 perform membership_private.lock_member(v_row.workspace_id,v_actor);
 select role into v_role from public.workspace_members where workspace_id=v_row.workspace_id and user_id=v_actor;
 if found and v_role<>'admin' then raise exception using message='INVITATION_CONFLICT',errcode='P0001';end if;
 insert into public.workspace_members(workspace_id,user_id,role) values(v_row.workspace_id,v_actor,'admin') on conflict do nothing;
 select id into v_team from public.workspace_teams where workspace_id=v_row.workspace_id order by created_at,id limit 1;
 if v_team is null then insert into public.workspace_teams(workspace_id,name) values(v_row.workspace_id,'Default Team') returning id into v_team;end if;
 insert into public.workspace_team_members(workspace_id,user_id,team_id) values(v_row.workspace_id,v_actor,v_team) on conflict do nothing;
 update platform_private.manager_invitations set status='accepted',accepted_by=v_actor where id=p_id;
 insert into platform_private.audit_events(workspace_id,actor_id,action,changes) values(v_row.workspace_id,v_actor,'manager_invitation_accepted','{}');
 return jsonb_build_object('workspaceId',v_row.workspace_id,'status','accepted');
end $$;

revoke all on function platform_private.guard_business_write() from public,anon,authenticated;
revoke all on function public.platform_workspace_access(uuid),public.platform_invitation_action(uuid,text),public.platform_my_manager_invitations(),public.platform_accept_manager_invitation(uuid) from public,anon;
grant execute on function public.platform_workspace_access(uuid),public.platform_invitation_action(uuid,text),public.platform_my_manager_invitations(),public.platform_accept_manager_invitation(uuid) to authenticated;
revoke all on function public.platform_record_delivery(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.platform_record_delivery(uuid,uuid,boolean) to service_role;
notify pgrst,'reload schema';
commit;
