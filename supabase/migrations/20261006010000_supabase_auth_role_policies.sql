-- Role-aware authorization for the Supabase Auth cutover.
-- Forward-only migration: do not edit the previously applied schema migrations.

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------

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

revoke all on function public.workspace_role(uuid) from public;
revoke all on function public.has_workspace_role(uuid, public.workspace_role[]) from public;
grant execute on function public.workspace_role(uuid) to authenticated, service_role;
grant execute on function public.has_workspace_role(uuid, public.workspace_role[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Atomic first-workspace onboarding
-- ---------------------------------------------------------------------------

create or replace function public.create_workspace_with_admin(workspace_name text)
returns table (workspace_id uuid, role public.workspace_role)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_name text := btrim(workspace_name);
  new_workspace_id uuid;
  caller_name text;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if char_length(normalized_name) < 2 or char_length(normalized_name) > 120 then
    raise exception 'WORKSPACE_NAME_INVALID' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.workspace_members as wm
    where wm.user_id = caller_id
  ) then
    raise exception 'USER_ALREADY_ONBOARDED' using errcode = '23505';
  end if;

  select nullif(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), '')
  into caller_name
  from auth.users as u
  where u.id = caller_id;

  insert into public.profiles (id, full_name)
  values (caller_id, caller_name)
  on conflict (id) do update
    set full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_at = now();

  insert into public.workspaces (name, owner_id)
  values (normalized_name, caller_id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, caller_id, 'admin');

  return query select new_workspace_id, 'admin'::public.workspace_role;
end;
$$;

revoke all on function public.create_workspace_with_admin(text) from public;
grant execute on function public.create_workspace_with_admin(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Membership invariants
-- ---------------------------------------------------------------------------

create or replace function public.protect_workspace_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and (new.workspace_id <> old.workspace_id or new.user_id <> old.user_id) then
    raise exception 'MEMBERSHIP_IDENTITY_IMMUTABLE' using errcode = '23514';
  end if;

  if old.role = 'admin'
     and (tg_op = 'DELETE' or new.role <> 'admin') then
    perform 1
    from public.workspaces as w
    where w.id = old.workspace_id
    for update;

    if not exists (
      select 1
      from public.workspace_members as wm
      where wm.workspace_id = old.workspace_id
        and wm.role = 'admin'
        and wm.user_id <> old.user_id
    ) then
      raise exception 'LAST_ADMIN_REQUIRED' using errcode = '23514';
    end if;
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
before update or delete on public.workspace_members
for each row execute function public.protect_workspace_admin();

-- Prevent cross-workspace references that cannot be represented by the starter
-- schema's single-column foreign keys.
create or replace function public.validate_workspace_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'strategies' and new.business_profile_id is not null then
    if not exists (
      select 1 from public.business_profiles as bp
      where bp.id = new.business_profile_id
        and bp.workspace_id = new.workspace_id
    ) then
      raise exception 'CROSS_WORKSPACE_BUSINESS_PROFILE' using errcode = '23514';
    end if;
  elsif tg_table_name = 'ad_contents' and new.strategy_id is not null then
    if not exists (
      select 1 from public.strategies as s
      where s.id = new.strategy_id
        and s.workspace_id = new.workspace_id
    ) then
      raise exception 'CROSS_WORKSPACE_STRATEGY' using errcode = '23514';
    end if;
  elsif tg_table_name = 'approvals' then
    if new.target_type = 'ad_content' and not exists (
      select 1 from public.ad_contents as ac
      where ac.id = new.target_id
        and ac.workspace_id = new.workspace_id
    ) then
      raise exception 'CROSS_WORKSPACE_APPROVAL_TARGET' using errcode = '23514';
    elsif new.target_type = 'budget_proposal' and not exists (
      select 1 from public.budget_proposals as bp
      where bp.id = new.target_id
        and bp.workspace_id = new.workspace_id
    ) then
      raise exception 'CROSS_WORKSPACE_APPROVAL_TARGET' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.validate_workspace_reference() from public;

drop trigger if exists validate_strategy_workspace on public.strategies;
create trigger validate_strategy_workspace
before insert or update on public.strategies
for each row execute function public.validate_workspace_reference();

drop trigger if exists validate_ad_content_workspace on public.ad_contents;
create trigger validate_ad_content_workspace
before insert or update on public.ad_contents
for each row execute function public.validate_workspace_reference();

drop trigger if exists validate_approval_workspace on public.approvals;
create trigger validate_approval_workspace
before insert or update on public.approvals
for each row execute function public.validate_workspace_reference();

-- ---------------------------------------------------------------------------
-- RAG access: authenticated callers never receive direct table access.
-- ---------------------------------------------------------------------------

create or replace function public.match_strategy_context(
  query_embedding vector(1536),
  match_count integer default 5
)
returns table (
  id uuid,
  source_type text,
  source_id uuid,
  content text,
  similarity double precision
)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  caller_workspace uuid;
begin
  select wm.workspace_id
  into caller_workspace
  from public.workspace_members as wm
  where wm.user_id = auth.uid()
  order by wm.joined_at
  limit 1;

  if caller_workspace is null or not public.has_workspace_role(
    caller_workspace,
    array['admin', 'manager']::public.workspace_role[]
  ) then
    raise exception 'PERMISSION_DENIED' using errcode = '42501';
  end if;

  return query
  select e.id,
         e.source_type,
         e.source_id,
         e.content,
         (1 - (e.embedding <=> query_embedding))::double precision
  from public.strategy_context_embeddings as e
  where e.workspace_id = caller_workspace
    and e.embedding is not null
  order by e.embedding <=> query_embedding
  limit greatest(1, least(coalesce(match_count, 5), 20));
end;
$$;

revoke all on function public.match_strategy_context(vector, integer) from public;
grant execute on function public.match_strategy_context(vector, integer)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Replace broad membership policies with least-privilege command policies.
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles_self_insert" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_self_update" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "workspaces_member_select" on public.workspaces;
drop policy if exists "workspaces_owner_modify" on public.workspaces;
drop policy if exists "workspaces_owner_insert" on public.workspaces;
drop policy if exists "workspaces_owner_delete" on public.workspaces;
create policy "workspaces_member_select" on public.workspaces
  for select to authenticated using (public.is_workspace_member(id));
create policy "workspaces_admin_update" on public.workspaces
  for update to authenticated
  using (public.has_workspace_role(id, array['admin']::public.workspace_role[]))
  with check (public.has_workspace_role(id, array['admin']::public.workspace_role[]));

drop policy if exists "workspace_members_select" on public.workspace_members;
drop policy if exists "workspace_members_owner_insert" on public.workspace_members;
drop policy if exists "workspace_members_owner_update" on public.workspace_members;
drop policy if exists "workspace_members_owner_delete" on public.workspace_members;
create policy "workspace_members_member_select" on public.workspace_members
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "workspace_members_admin_insert" on public.workspace_members
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));
create policy "workspace_members_admin_update" on public.workspace_members
  for update to authenticated
  using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));
create policy "workspace_members_admin_delete" on public.workspace_members
  for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

drop policy if exists "business_profiles_scoped" on public.business_profiles;
create policy "business_profiles_member_select" on public.business_profiles
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "business_profiles_admin_insert" on public.business_profiles
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));
create policy "business_profiles_admin_update" on public.business_profiles
  for update to authenticated
  using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));
create policy "business_profiles_admin_delete" on public.business_profiles
  for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

drop policy if exists "campaign_performance_scoped" on public.campaign_performance;
create policy "campaign_performance_operator_select" on public.campaign_performance
  for select to authenticated
  using (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));
create policy "campaign_performance_operator_insert" on public.campaign_performance
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));
create policy "campaign_performance_operator_update" on public.campaign_performance
  for update to authenticated
  using (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));
create policy "campaign_performance_operator_delete" on public.campaign_performance
  for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));

drop policy if exists "strategies_scoped" on public.strategies;
create policy "strategies_member_select" on public.strategies
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "strategies_operator_insert" on public.strategies
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[])
  );
create policy "strategies_operator_update" on public.strategies
  for update to authenticated
  using (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));
create policy "strategies_operator_delete" on public.strategies
  for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));

drop policy if exists "strategy_context_embeddings_scoped"
  on public.strategy_context_embeddings;
create policy "strategy_context_embeddings_rpc_only"
  on public.strategy_context_embeddings
  for all to authenticated using (false) with check (false);

drop policy if exists "ad_contents_scoped" on public.ad_contents;
create policy "ad_contents_member_select" on public.ad_contents
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "ad_contents_member_insert" on public.ad_contents
  for insert to authenticated
  with check (created_by = auth.uid() and public.is_workspace_member(workspace_id));
create policy "ad_contents_author_or_operator_update" on public.ad_contents
  for update to authenticated
  using (
    public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[])
    or (created_by = auth.uid() and status = 'draft')
  )
  with check (
    public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[])
    or (created_by = auth.uid() and status = 'draft')
  );
create policy "ad_contents_author_or_operator_delete" on public.ad_contents
  for delete to authenticated
  using (
    public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[])
    or (created_by = auth.uid() and status = 'draft')
  );

drop policy if exists "budget_proposals_scoped" on public.budget_proposals;
create policy "budget_proposals_member_select" on public.budget_proposals
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "budget_proposals_operator_insert" on public.budget_proposals
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));
create policy "budget_proposals_operator_update" on public.budget_proposals
  for update to authenticated
  using (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));
create policy "budget_proposals_operator_delete" on public.budget_proposals
  for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));

drop policy if exists "approvals_scoped" on public.approvals;
create policy "approvals_member_select" on public.approvals
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "approvals_admin_insert" on public.approvals
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));
create policy "approvals_admin_update" on public.approvals
  for update to authenticated
  using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));
create policy "approvals_admin_delete" on public.approvals
  for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

drop policy if exists "notifications_scoped" on public.notifications;
create policy "notifications_recipient_select" on public.notifications
  for select to authenticated
  using (user_id = auth.uid() and public.is_workspace_member(workspace_id));
create policy "notifications_recipient_insert" on public.notifications
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));
create policy "notifications_recipient_update" on public.notifications
  for update to authenticated
  using (user_id = auth.uid() and public.is_workspace_member(workspace_id))
  with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));
create policy "notifications_recipient_delete" on public.notifications
  for delete to authenticated
  using (user_id = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "audit_logs_scoped" on public.audit_logs;
create policy "audit_logs_admin_select" on public.audit_logs
  for select to authenticated
  using (public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[]));

drop policy if exists "competitor_insights_scoped" on public.competitor_insights;
create policy "competitor_insights_member_select" on public.competitor_insights
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "competitor_insights_operator_insert" on public.competitor_insights
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[])
  );
create policy "competitor_insights_operator_update" on public.competitor_insights
  for update to authenticated
  using (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));
create policy "competitor_insights_operator_delete" on public.competitor_insights
  for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));

drop policy if exists "reports_scoped" on public.reports;
create policy "reports_member_select" on public.reports
  for select to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (
      status = 'ready'
      or public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[])
    )
  );
create policy "reports_operator_insert" on public.reports
  for insert to authenticated
  with check (
    requested_by = auth.uid()
    and public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[])
  );
create policy "reports_operator_update" on public.reports
  for update to authenticated
  using (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['admin', 'manager']::public.workspace_role[]));

-- Explicitly retain RLS on every exposed application table.
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.business_profiles enable row level security;
alter table public.campaign_performance enable row level security;
alter table public.strategies enable row level security;
alter table public.strategy_context_embeddings enable row level security;
alter table public.ad_contents enable row level security;
alter table public.budget_proposals enable row level security;
alter table public.approvals enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.competitor_insights enable row level security;
alter table public.reports enable row level security;
