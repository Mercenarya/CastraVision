-- Security hardening for the workspace-scoped Supabase schema.
-- This is a forward-only migration; the initial migration is left immutable.

-- The RAG table was the only business table missing RLS in init_schema.
alter table public.strategy_context_embeddings enable row level security;

-- Pin the search path for this SECURITY DEFINER helper. All referenced objects
-- remain schema-qualified to prevent object-shadowing attacks.
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_member(uuid) to service_role;

-- Make self-profile writes explicit instead of relying on the implicit check
-- inherited from a FOR ALL USING clause.
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- A signed-in user may create a workspace owned by themselves. Owners can see
-- the row before inserting their first workspace_members record.
drop policy if exists "workspaces_member_select" on public.workspaces;
create policy "workspaces_member_select" on public.workspaces
  for select
  using (owner_id = auth.uid() or public.is_workspace_member(id));

drop policy if exists "workspaces_owner_modify" on public.workspaces;
create policy "workspaces_owner_modify" on public.workspaces
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "workspaces_owner_insert" on public.workspaces
  for insert
  with check (owner_id = auth.uid());

create policy "workspaces_owner_delete" on public.workspaces
  for delete
  using (owner_id = auth.uid());

-- Membership changes are owner-only. This prevents ordinary members from
-- promoting themselves while still allowing all members to view the roster.
drop policy if exists "workspace_members_select" on public.workspace_members;
create policy "workspace_members_select" on public.workspace_members
  for select
  using (
    public.is_workspace_member(workspace_id)
    or exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
  );

create policy "workspace_members_owner_insert" on public.workspace_members
  for insert
  with check (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
  );

create policy "workspace_members_owner_update" on public.workspace_members
  for update
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
  );

create policy "workspace_members_owner_delete" on public.workspace_members
  for delete
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
    and user_id <> auth.uid()
  );

create policy "strategy_context_embeddings_scoped"
  on public.strategy_context_embeddings
  for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- A notification must belong both to the signed-in recipient and to one of
-- their workspaces; user_id alone was not sufficient tenant isolation.
drop policy if exists "notifications_scoped" on public.notifications;
create policy "notifications_scoped" on public.notifications
  for all
  using (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
  );

-- PostgreSQL does not automatically index foreign keys. These indexes keep
-- RLS membership checks and workspace-scoped API queries predictable.
create index if not exists idx_workspace_members_user
  on public.workspace_members(user_id);
create index if not exists idx_business_profiles_workspace
  on public.business_profiles(workspace_id);
create index if not exists idx_strategies_workspace
  on public.strategies(workspace_id);
create index if not exists idx_strategy_embeddings_workspace
  on public.strategy_context_embeddings(workspace_id);
create index if not exists idx_ad_contents_workspace
  on public.ad_contents(workspace_id);
create index if not exists idx_budget_proposals_workspace
  on public.budget_proposals(workspace_id);
create index if not exists idx_approvals_workspace
  on public.approvals(workspace_id);
create index if not exists idx_notifications_workspace
  on public.notifications(workspace_id);
create index if not exists idx_competitor_insights_workspace
  on public.competitor_insights(workspace_id);
create index if not exists idx_reports_workspace
  on public.reports(workspace_id);
