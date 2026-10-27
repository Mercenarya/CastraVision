-- SCRUM-172: serialize admin demotions/deletions and preserve one admin.

create or replace function public.protect_workspace_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  workspace_still_exists boolean;
  removes_old_admin boolean;
begin
  removes_old_admin := old.role = 'admin'::public.workspace_role
    and (
      tg_op = 'DELETE'
      or new.role is distinct from 'admin'::public.workspace_role
      or new.workspace_id is distinct from old.workspace_id
      or new.user_id is distinct from old.user_id
    );

  if not removes_old_admin then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  -- This parent-row lock serializes concurrent changes to admins belonging to
  -- the same workspace. If the parent has already been deleted, this is an
  -- ON DELETE CASCADE and the child deletion must be allowed to continue.
  select true
  into workspace_still_exists
  from public.workspaces as w
  where w.id = old.workspace_id
  for update;

  if not coalesce(workspace_still_exists, false) then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if not exists (
    select 1
    from public.workspace_members as wm
    where wm.workspace_id = old.workspace_id
      and wm.role = 'admin'::public.workspace_role
      and wm.user_id <> old.user_id
  ) then
    raise exception 'LAST_ADMIN_PROTECTED: workspace must retain at least one admin'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_workspace_admin() from public;

drop trigger if exists protect_workspace_admin_trigger
  on public.workspace_members;
create trigger protect_workspace_admin_trigger
before delete or update of role, workspace_id, user_id
on public.workspace_members
for each row execute function public.protect_workspace_admin();
