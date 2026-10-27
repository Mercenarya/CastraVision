-- SCRUM-157: canonical RLS helpers and atomic first-workspace onboarding.
-- Forward-only correction of the helpers introduced by earlier migrations.

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as wm
    where wm.workspace_id = ws_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.workspace_role(ws_id uuid)
returns public.workspace_role
language sql
security definer
stable
set search_path = ''
as $$
  select wm.role
  from public.workspace_members as wm
  where wm.workspace_id = ws_id
    and wm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.has_workspace_role(
  ws_id uuid,
  allowed_roles public.workspace_role[]
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(public.workspace_role(ws_id) = any(allowed_roles), false);
$$;

revoke execute on function public.is_workspace_member(uuid) from public, anon;
revoke execute on function public.workspace_role(uuid) from public, anon;
revoke execute on function public.has_workspace_role(uuid, public.workspace_role[])
  from public, anon;

grant execute on function public.is_workspace_member(uuid)
  to authenticated, service_role;
grant execute on function public.workspace_role(uuid)
  to authenticated, service_role;
grant execute on function public.has_workspace_role(uuid, public.workspace_role[])
  to authenticated, service_role;

create or replace function public.create_workspace_with_admin(workspace_name text)
returns table (workspace_id uuid, role public.workspace_role)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_name text := btrim(workspace_name);
  created_workspace_id uuid;
  caller_name text;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED: authenticated user required'
      using errcode = '42501';
  end if;

  if normalized_name is null
     or char_length(normalized_name) < 1
     or char_length(normalized_name) > 100 then
    raise exception 'WORKSPACE_NAME_INVALID: name must contain 1 to 100 characters'
      using errcode = '22023';
  end if;

  -- Serialize onboarding attempts for the same authenticated user so two
  -- concurrent RPC calls cannot both pass the membership existence check.
  select nullif(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), '')
  into caller_name
  from auth.users as u
  where u.id = caller_id
  for update;

  if not found then
    raise exception 'AUTH_REQUIRED: authenticated user does not exist'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.workspace_members as wm
    where wm.user_id = caller_id
  ) then
    raise exception 'ALREADY_ONBOARDED: user already belongs to a workspace'
      using errcode = '23505';
  end if;

  insert into public.profiles as p (id, full_name)
  values (caller_id, caller_name)
  on conflict (id) do update
    set full_name = coalesce(p.full_name, excluded.full_name),
        updated_at = case
          when p.full_name is null and excluded.full_name is not null then now()
          else p.updated_at
        end;

  insert into public.workspaces (name, owner_id)
  values (normalized_name, caller_id)
  returning id into created_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (created_workspace_id, caller_id, 'admin'::public.workspace_role);

  return query
  select created_workspace_id, 'admin'::public.workspace_role;
end;
$$;

revoke execute on function public.create_workspace_with_admin(text)
  from public, anon, service_role;
grant execute on function public.create_workspace_with_admin(text)
  to authenticated;
