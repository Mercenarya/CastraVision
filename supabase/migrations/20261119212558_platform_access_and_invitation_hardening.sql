begin;
-- Workspace provisioning must go through trusted, audited RPCs, not owner-id
-- inserts/deletes from the Data API. Business profile updates retain UPDATE.
revoke insert,delete on public.workspaces from public,anon,authenticated;
create function public.platform_my_workspace_states() returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 perform membership_private.actor();
 return coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'name',w.name,'status',c.status))
 from public.workspace_members m join public.workspaces w on w.id=m.workspace_id
 join platform_private.companies c on c.workspace_id=w.id where m.user_id=auth.uid() and c.status='Inactive'),'[]');
end $$;

-- Current authority of the invitation creator is checked at acceptance, just
-- as business-manager invitations are invalidated when their sender loses role.
do $$declare r record;v_new text;begin
 select p.prosrc,pg_get_functiondef(p.oid) definition into r from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='platform_accept_manager_invitation';
 v_new:=replace(r.prosrc,'if v_row.expires_at<=now()',
 'if not exists(select 1 from auth.users where id=v_row.created_by and email_confirmed_at is not null and coalesce(raw_app_meta_data->>''platform_role'',raw_app_meta_data->>''role'','''')=''system_admin'') then raise exception using message=''INVITATION_REVOKED'',errcode=''P0001'';end if; if v_row.expires_at<=now()');
 v_new:=replace(v_new,'insert into public.workspace_team_members(workspace_id,user_id,team_id)',
 'update public.workspaces w set owner_id=v_actor where w.id=v_row.workspace_id and exists(select 1 from auth.users u where u.id=w.owner_id and coalesce(u.raw_app_meta_data->>''platform_role'',u.raw_app_meta_data->>''role'','''')=''system_admin''); insert into public.workspace_team_members(workspace_id,user_id,team_id)');
 if v_new=r.prosrc then raise exception 'Invitation hardening insertion failed';end if;
 execute replace(r.definition,r.prosrc,v_new);
 select p.prosrc,pg_get_functiondef(p.oid) definition into r from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='admin_workspace_overview';
 v_new:=replace(r.prosrc,'and caller.role = ''admin''','and caller.role = ''admin'' and platform_private.business_actor()');
 execute replace(r.definition,r.prosrc,v_new);
end $$;

-- Reissuing is explicit: a revoked/expired invite is never silently reopened by
-- an email resend. Existing memberships are not demoted or transferred.
create function public.platform_issue_manager_invitation(p_workspace_id uuid,p_email text) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_actor uuid:=platform_private.actor();v_row platform_private.manager_invitations;v_email text:=lower(btrim(p_email));begin
 if v_email is null or length(v_email)>254 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
 perform 1 from platform_private.companies where workspace_id=p_workspace_id for update;
 if not found then raise exception using message='NOT_FOUND',errcode='P0001';end if;
 if exists(select 1 from public.workspace_members m join auth.users u on u.id=m.user_id where m.workspace_id=p_workspace_id and lower(u.email)=v_email) then raise exception using message='ALREADY_MEMBER',errcode='P0001';end if;
 select * into v_row from platform_private.manager_invitations where workspace_id=p_workspace_id and status='pending' for update;
 if found and v_row.expires_at>now() then
  if v_row.normalized_email<>v_email then raise exception using message='INVITATION_CONFLICT',errcode='P0001';end if;
  return public.platform_company(p_workspace_id);
 end if;
 if v_row.id is not null then update platform_private.manager_invitations set status='revoked' where id=v_row.id;end if;
 insert into platform_private.manager_invitations(workspace_id,normalized_email,created_by) values(p_workspace_id,v_email,v_actor);
 insert into platform_private.audit_events(workspace_id,actor_id,action,changes) values(p_workspace_id,v_actor,'manager_invitation_created','{}');
 return public.platform_company(p_workspace_id);
end $$;
revoke all on function public.platform_my_workspace_states(),public.platform_issue_manager_invitation(uuid,text) from public,anon;
grant execute on function public.platform_my_workspace_states(),public.platform_issue_manager_invitation(uuid,text) to authenticated;
notify pgrst,'reload schema';
commit;
