-- Platform metadata is not a business membership or a second tenant identity.
begin;
create schema platform_private;
revoke all on schema platform_private from public,anon,authenticated;
create table platform_private.companies (
 workspace_id uuid primary key references public.workspaces(id) on delete cascade,
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=63),
 legal_entity text not null, domain text not null default '', notes text not null default '',
 status text not null default 'Active' check(status in ('Active','Inactive')),
 version int not null default 1 check(version>0),
 created_by uuid references auth.users(id), request_id uuid, request_payload jsonb,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(created_by,request_id)
);
insert into platform_private.companies(workspace_id,slug,legal_entity,created_at)
select id,'ws-'||id::text,name,created_at from public.workspaces;
create table platform_private.manager_invitations (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 normalized_email text not null, created_by uuid not null references auth.users(id),
 status text not null default 'pending' check(status in ('pending','accepted','revoked')),
 expires_at timestamptz not null default now()+interval '7 days',
 accepted_by uuid references auth.users(id), delivery_status text not null default 'pending'
 check(delivery_status in ('pending','sending','sent','failed')),
 attempt_id uuid,attempt_at timestamptz,created_at timestamptz not null default now()
);
create unique index platform_manager_pending on platform_private.manager_invitations(workspace_id) where status='pending';
create table platform_private.audit_events (
 id uuid primary key default gen_random_uuid(), workspace_id uuid references public.workspaces(id) on delete set null,
 actor_id uuid not null references auth.users(id), action text not null,
 changes jsonb not null default '{}',created_at timestamptz not null default now()
);
create index platform_events_time on platform_private.audit_events(created_at desc,id);
create table platform_private.event_receipts (
 event_id uuid not null references platform_private.audit_events(id),
 user_id uuid not null references auth.users(id),read_at timestamptz not null default now(),primary key(event_id,user_id)
);
alter table platform_private.companies enable row level security;
alter table platform_private.manager_invitations enable row level security;
alter table platform_private.audit_events enable row level security;
alter table platform_private.event_receipts enable row level security;
revoke all on all tables in schema platform_private from public,anon,authenticated;

create function platform_private.actor() returns uuid language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception using message='AUTH_REQUIRED',errcode='P0001'; end if;
 if not exists(select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null
 and coalesce(u.raw_app_meta_data->>'platform_role',u.raw_app_meta_data->>'role','')='system_admin') then
 raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
 return auth.uid();
end $$;
create function platform_private.company_json(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',w.id,'name',w.name,'legalEntity',c.legal_entity,'slug',c.slug,'tenantId',c.slug,
 'domain',c.domain,'notes',c.notes,'status',c.status,'version',c.version,'createdAt',c.created_at,
 'provisionedOn',c.created_at::date,'employeeCount',(select count(*) from public.workspace_members m where m.workspace_id=w.id),
 'licensedSeats',null,'accountEmail',(select i.normalized_email from platform_private.manager_invitations i where i.workspace_id=w.id order by i.created_at desc,i.id limit 1),
 'invitation',(select jsonb_build_object('id',i.id,'status',i.status,'expiresAt',i.expires_at,'deliveryStatus',i.delivery_status)
 from platform_private.manager_invitations i where i.workspace_id=w.id order by i.created_at desc,i.id limit 1))
 from public.workspaces w join platform_private.companies c on c.workspace_id=w.id where w.id=p_id;
$$;
create function public.platform_directory() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_items jsonb; begin
 perform platform_private.actor();
 select coalesce(jsonb_agg(platform_private.company_json(c.workspace_id) order by c.created_at desc,c.workspace_id),'[]') into v_items from platform_private.companies c;
 return jsonb_build_object('companies',v_items,'metrics',jsonb_build_object('totalRegistered',jsonb_array_length(v_items),
 'activeTenants',(select count(*) from platform_private.companies where status='Active'),
 'inactiveTenants',(select count(*) from platform_private.companies where status='Inactive'),
 'aggregateHeadcount',(select count(*) from public.workspace_members),'allocatedSeats',null));
end $$;
create function public.platform_company(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb; begin
 perform platform_private.actor(); v_result:=platform_private.company_json(p_id);
 if v_result is null then raise exception using message='NOT_FOUND',errcode='P0001'; end if;
 return v_result||jsonb_build_object('history',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'action',e.action,'changes',e.changes,'createdAt',e.created_at) order by e.created_at desc,e.id)
 from (select * from platform_private.audit_events where workspace_id=p_id order by created_at desc,id limit 50) e),'[]'));
end $$;
create function platform_private.validate(p_data jsonb,p_create boolean) returns void language plpgsql set search_path='' as $$
declare v_email text:=lower(btrim(p_data->>'accountEmail'));begin
 if jsonb_typeof(p_data)<>'object' or exists(select 1 from jsonb_object_keys(p_data) k where k not in ('requestId','name','slug','accountEmail','legalEntity','domain','notes','status'))
 or (p_data ? 'status' and (jsonb_typeof(p_data->'status')<>'string' or p_data->>'status' not in ('Active','Inactive')))
 or (p_data ? 'name' and (jsonb_typeof(p_data->'name')<>'string' or length(btrim(p_data->>'name')) not between 1 and 120))
 or (p_data ? 'legalEntity' and (jsonb_typeof(p_data->'legalEntity')<>'string' or length(btrim(p_data->>'legalEntity')) not between 1 and 120))
 or (p_data ? 'domain' and (jsonb_typeof(p_data->'domain')<>'string' or length(p_data->>'domain')>253))
 or (p_data ? 'notes' and (jsonb_typeof(p_data->'notes')<>'string' or length(p_data->>'notes')>2000)) then
 raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
 if p_create and (p_data->>'name' is null or p_data->>'slug' is null or p_data->>'requestId' is null
 or jsonb_typeof(p_data->'slug')<>'string' or length(btrim(p_data->>'slug')) not between 1 and 63
 or lower(btrim(p_data->>'slug')) !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
 or v_email is null or length(v_email)>254 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$') then
 raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
 if not p_create and (p_data ?| array['requestId','slug','accountEmail']) then
 raise exception using message='VALIDATION_ERROR',errcode='P0001';end if;
end $$;
create function public.platform_create(p_data jsonb) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_actor uuid:=platform_private.actor();v_request uuid;v_existing platform_private.companies;v_id uuid;v_invite uuid;v_slug text;
begin
 perform platform_private.validate(p_data,true);
 begin v_request:=(p_data->>'requestId')::uuid; exception when invalid_text_representation then raise exception using message='VALIDATION_ERROR',errcode='P0001';end;
 v_slug:=lower(btrim(p_data->>'slug'));
 perform pg_advisory_xact_lock(hashtextextended(v_actor::text||v_request::text,0));
 select * into v_existing from platform_private.companies where created_by=v_actor and request_id=v_request;
 if found then
  if v_existing.request_payload<>p_data then raise exception using message='REQUEST_CONFLICT',errcode='P0001';end if;
  return public.platform_company(v_existing.workspace_id);
 end if;
 if exists(select 1 from platform_private.companies where slug=v_slug) then raise exception using message='REQUEST_CONFLICT',errcode='P0001';end if;
 insert into public.workspaces(name,owner_id) values(btrim(p_data->>'name'),v_actor) returning id into v_id;
 insert into platform_private.companies(workspace_id,slug,legal_entity,domain,notes,status,created_by,request_id,request_payload)
 values(v_id,v_slug,coalesce(nullif(btrim(p_data->>'legalEntity'),''),btrim(p_data->>'name')),btrim(coalesce(p_data->>'domain','')),
 btrim(coalesce(p_data->>'notes','')),coalesce(p_data->>'status','Active'),v_actor,v_request,p_data);
 insert into platform_private.manager_invitations(workspace_id,normalized_email,created_by)
 values(v_id,lower(btrim(p_data->>'accountEmail')),v_actor) returning id into v_invite;
 insert into platform_private.audit_events(workspace_id,actor_id,action,changes) values(v_id,v_actor,'company_created',jsonb_build_object('slug',v_slug,'status',coalesce(p_data->>'status','Active')));
 return public.platform_company(v_id);
exception when unique_violation then raise exception using message='REQUEST_CONFLICT',errcode='P0001';
end $$;
create function public.platform_update(p_id uuid,p_version int,p_data jsonb) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_actor uuid:=platform_private.actor();v_old platform_private.companies;v_before jsonb;begin
 perform platform_private.validate(p_data,false);
 select * into v_old from platform_private.companies where workspace_id=p_id for update;
 if not found then raise exception using message='NOT_FOUND',errcode='P0001';end if;
 if p_version is null or v_old.version<>p_version then raise exception using message='STALE_VERSION',errcode='P0001';end if;
 v_before:=jsonb_build_object('status',v_old.status,'legalEntity',v_old.legal_entity,'domain',v_old.domain,'notes',v_old.notes);
 if p_data ? 'name' then update public.workspaces set name=btrim(p_data->>'name') where id=p_id;end if;
 update platform_private.companies set legal_entity=coalesce(btrim(p_data->>'legalEntity'),legal_entity),domain=coalesce(btrim(p_data->>'domain'),domain),
 notes=coalesce(btrim(p_data->>'notes'),notes),status=coalesce(p_data->>'status',status),version=version+1,updated_at=now() where workspace_id=p_id;
 insert into platform_private.audit_events(workspace_id,actor_id,action,changes) values(p_id,v_actor,'company_updated',jsonb_build_object('before',v_before,'after',p_data));
 return public.platform_company(p_id);
end $$;
create function public.platform_notifications(p_read_id uuid default null) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_actor uuid:=platform_private.actor();v_items jsonb;begin
 if p_read_id is not null then
  if not exists(select 1 from platform_private.audit_events where id=p_read_id) then raise exception using message='NOT_FOUND',errcode='P0001';end if;
  insert into platform_private.event_receipts(event_id,user_id) values(p_read_id,v_actor) on conflict do nothing;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'workspaceId',e.workspace_id,'action',e.action,'createdAt',e.created_at,'isRead',r.user_id is not null) order by e.created_at desc,e.id),'[]')
 into v_items from (select * from platform_private.audit_events order by created_at desc,id limit 50) e
 left join platform_private.event_receipts r on r.event_id=e.id and r.user_id=v_actor;
 return jsonb_build_object('items',v_items);
end $$;
create function platform_private.immutable_event() returns trigger language plpgsql set search_path='' as $$begin
 raise exception using message='AUDIT_LOG_IMMUTABLE',errcode='P0001';end $$;
create trigger platform_audit_immutable before update or delete on platform_private.audit_events for each row execute function platform_private.immutable_event();
revoke all on all functions in schema platform_private from public,anon,authenticated;
revoke all on function public.platform_directory(),public.platform_company(uuid),public.platform_create(jsonb),public.platform_update(uuid,int,jsonb),public.platform_notifications(uuid) from public,anon;
grant execute on function public.platform_directory(),public.platform_company(uuid),public.platform_create(jsonb),public.platform_update(uuid,int,jsonb),public.platform_notifications(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
