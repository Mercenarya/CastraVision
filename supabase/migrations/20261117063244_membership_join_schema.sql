-- Additive onboarding tables. Credential/session authority stays in Supabase Auth.
create schema if not exists membership_private;
revoke all on schema membership_private from public, anon;
grant usage on schema membership_private to authenticated, service_role;

-- GoTrue OTP can generate an internal password hash on INSERT. Only a later
-- Auth password change proves completion for accounts created after rollout.
-- Preserve pre-rollout password users without resetting existing credentials.
create table membership_private.password_setup (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed boolean not null default false
);
alter table membership_private.password_setup enable row level security;
revoke all on membership_private.password_setup from public,anon,authenticated;
insert into membership_private.password_setup(user_id,completed)
select id,coalesce(encrypted_password,'')<>'' from auth.users;
create function membership_private.track_auth_password() returns trigger
language plpgsql security definer set search_path='' as $$ begin
  if tg_op='INSERT' then
    insert into membership_private.password_setup(user_id,completed) values(new.id,false)
      on conflict do nothing;
  elsif new.encrypted_password is distinct from old.encrypted_password then
    insert into membership_private.password_setup(user_id,completed)
      values(new.id,coalesce(new.encrypted_password,'')<>'')
      on conflict(user_id) do update set completed=excluded.completed;
  end if;
  return new;
end; $$;
create trigger membership_track_auth_password after insert or update of encrypted_password
on auth.users for each row execute function membership_private.track_auth_password();

create function membership_private.valid_actor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null
    and coalesce(u.raw_app_meta_data->>'platform_role',u.raw_app_meta_data->>'role','') <> 'system_admin');
$$;
create function membership_private.actor() returns uuid
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception using message='AUTH_REQUIRED',errcode='P0001'; end if;
  if not membership_private.valid_actor() then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  return auth.uid();
end; $$;
create function membership_private.is_manager(p_workspace_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select membership_private.valid_actor() and exists(select 1 from public.workspace_members m
    where m.workspace_id=p_workspace_id and m.user_id=auth.uid() and m.role='admin');
$$;
create function membership_private.require_manager(p_workspace_id uuid) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v_actor uuid := membership_private.actor();
begin
  if not membership_private.is_manager(p_workspace_id) then raise exception using message='PERMISSION_DENIED',errcode='P0001'; end if;
  return v_actor;
end; $$;
create function membership_private.require_password() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  perform membership_private.actor();
  if not exists(select 1 from membership_private.password_setup where user_id=auth.uid() and completed) then
    raise exception using message='PASSWORD_SETUP_REQUIRED',errcode='P0001';
  end if;
end; $$;

create table public.workspace_recruitment_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  accepting_join_requests boolean not null default false,
  public_description text not null default '' check(length(public_description)<=300),
  updated_at timestamptz not null default now()
);
create table public.workspace_teams (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check(length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique(workspace_id,id)
);
create unique index workspace_teams_name_unique on public.workspace_teams(workspace_id,lower(btrim(name)));
create table public.workspace_team_members (
  workspace_id uuid not null,
  user_id uuid not null,
  team_id uuid not null,
  primary key(workspace_id,user_id,team_id),
  foreign key(workspace_id,user_id) references public.workspace_members(workspace_id,user_id) on delete cascade,
  foreign key(workspace_id,team_id) references public.workspace_teams(workspace_id,id) on delete cascade
);
create table public.workspace_join_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '' check(length(message)<=1000),
  status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  rejection_reason text check(rejection_reason is null or length(btrim(rejection_reason)) between 1 and 500),
  assigned_team_id uuid,
  foreign key(workspace_id,assigned_team_id) references public.workspace_teams(workspace_id,id) deferrable initially deferred,
  check(status <> 'rejected' or rejection_reason is not null)
);
create unique index workspace_join_requests_one_pending on public.workspace_join_requests(workspace_id,applicant_id) where status='pending';
create index workspace_join_requests_inbox on public.workspace_join_requests(workspace_id,status,requested_at desc);
create index workspace_join_requests_own on public.workspace_join_requests(applicant_id,requested_at desc);
create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  normalized_email text not null check(normalized_email=lower(btrim(normalized_email)) and length(normalized_email)<=254 and normalized_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  invited_role public.workspace_role not null default 'member' check(invited_role in ('member','manager')),
  team_id uuid,
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null default (now()+interval '7 days'),
  status text not null default 'pending' check(status in ('pending','accepted','revoked')),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  delivery_status text not null default 'pending' check(delivery_status in ('pending','sent','failed')),
  last_sent_at timestamptz,
  delivery_attempt_id uuid,
  delivery_lease_until timestamptz,
  foreign key(workspace_id,team_id) references public.workspace_teams(workspace_id,id) deferrable initially deferred
);
create unique index workspace_invitations_one_pending on public.workspace_invitations(workspace_id,normalized_email) where status='pending';
create index workspace_invitations_own on public.workspace_invitations(normalized_email,created_at desc);
create table public.membership_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check(event_type in ('join_requested','join_approved','join_rejected','invitation_created','invitation_accepted','membership_removed','membership_updated')),
  request_id uuid references public.workspace_join_requests(id) on delete set null,
  invitation_id uuid references public.workspace_invitations(id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index membership_notifications_recipient on public.membership_notifications(recipient_id,created_at desc);
create unique index membership_notifications_request_once on public.membership_notifications(recipient_id,event_type,request_id) where request_id is not null;
create unique index membership_notifications_invite_once on public.membership_notifications(recipient_id,event_type,invitation_id) where invitation_id is not null;

alter table public.workspace_recruitment_settings enable row level security;
alter table public.workspace_teams enable row level security;
alter table public.workspace_team_members enable row level security;
alter table public.workspace_join_requests enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.membership_notifications enable row level security;
create policy recruitment_manager_read on public.workspace_recruitment_settings for select to authenticated using(membership_private.is_manager(workspace_id));
create policy teams_manager_read on public.workspace_teams for select to authenticated using(membership_private.is_manager(workspace_id));
create policy team_members_manager_read on public.workspace_team_members for select to authenticated using(membership_private.is_manager(workspace_id));
create policy requests_scoped_read on public.workspace_join_requests for select to authenticated using(membership_private.valid_actor() and (applicant_id=auth.uid() or membership_private.is_manager(workspace_id)));
-- Read only the current verified actor's email, never expose auth.users.
create function membership_private.own_email() returns text language sql stable security definer set search_path='' as $$
  select lower(email) from auth.users where id=auth.uid() and membership_private.valid_actor();
$$;
create policy invitations_scoped_read on public.workspace_invitations for select to authenticated using(membership_private.is_manager(workspace_id) or (membership_private.valid_actor() and normalized_email=membership_private.own_email()));
create policy membership_notifications_recipient_read on public.membership_notifications for select to authenticated using(membership_private.valid_actor() and recipient_id=auth.uid());

revoke all on public.workspace_recruitment_settings,public.workspace_teams,public.workspace_team_members,public.workspace_join_requests,public.workspace_invitations,public.membership_notifications from public,anon,authenticated;
grant select on public.workspace_recruitment_settings,public.workspace_teams,public.workspace_team_members,public.workspace_join_requests,public.workspace_invitations,public.membership_notifications to authenticated;
grant all on public.workspace_recruitment_settings,public.workspace_teams,public.workspace_team_members,public.workspace_join_requests,public.workspace_invitations,public.membership_notifications to service_role;
revoke all on all functions in schema membership_private from public,anon,authenticated;
grant execute on function membership_private.valid_actor(),membership_private.is_manager(uuid),membership_private.own_email() to authenticated;

create function public.membership_onboarding_state() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_password boolean;
begin
  if auth.uid() is null then raise exception using message='AUTH_REQUIRED',errcode='P0001'; end if;
  select coalesce(s.completed,false) into v_password from auth.users u
    left join membership_private.password_setup s on s.user_id=u.id
    where u.id=auth.uid() and u.email_confirmed_at is not null;
  if not found then raise exception using message='AUTH_REQUIRED',errcode='P0001'; end if;
  return jsonb_build_object('passwordSetupRequired',not v_password);
end; $$;
create function public.membership_company_directory(p_search text default '',p_limit int default 20,p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_items jsonb; v_total int;
begin
  perform membership_private.actor();
  if p_limit is null or p_offset is null or p_search is null or p_limit not between 1 and 50 or p_offset<0 or length(p_search)>120 then raise exception using message='VALIDATION_ERROR',errcode='P0001'; end if;
  select count(*) into v_total from public.workspaces w join public.workspace_recruitment_settings s on s.workspace_id=w.id
    where s.accepting_join_requests and w.name ilike '%'||p_search||'%';
  select coalesce(jsonb_agg(x.item),'[]') into v_items from (
    select jsonb_build_object('id',w.id,'name',w.name,'publicDescription',s.public_description) item
    from public.workspaces w join public.workspace_recruitment_settings s on s.workspace_id=w.id
    where s.accepting_join_requests and w.name ilike '%'||p_search||'%' order by w.name,w.id limit p_limit offset p_offset
  ) x;
  return jsonb_build_object('items',v_items,'total',v_total,'limit',p_limit,'offset',p_offset);
end; $$;
revoke all on function public.membership_onboarding_state(),public.membership_company_directory(text,int,int) from public,anon;
grant execute on function public.membership_onboarding_state(),public.membership_company_directory(text,int,int) to authenticated;
