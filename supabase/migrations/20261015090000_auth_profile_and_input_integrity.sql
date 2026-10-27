-- Keep Supabase Auth and public application data synchronized, then harden
-- newly imported campaign rows. Existing migrations remain immutable.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists business_profiles_set_updated_at on public.business_profiles;
create trigger business_profiles_set_updated_at
before update on public.business_profiles
for each row execute function public.set_updated_at();

alter table public.campaign_performance
  add column if not exists clicks bigint,
  add column if not exists conversions bigint,
  add column if not exists revenue numeric,
  add column if not exists import_batch_id uuid,
  add column if not exists source_filename text,
  add column if not exists source_row integer,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.workspaces
  add constraint workspaces_name_length
  check (char_length(btrim(name)) between 1 and 100) not valid;

alter table public.campaign_performance
  add constraint campaign_performance_ctr_range
    check (ctr is null or (ctr >= 0 and ctr <= 100)) not valid,
  add constraint campaign_performance_cpa_nonnegative
    check (cpa is null or cpa >= 0) not valid,
  add constraint campaign_performance_roas_nonnegative
    check (roas is null or roas >= 0) not valid,
  add constraint campaign_performance_impressions_nonnegative
    check (impressions is null or impressions >= 0) not valid,
  add constraint campaign_performance_spend_nonnegative
    check (spend is null or spend >= 0) not valid,
  add constraint campaign_performance_clicks_nonnegative
    check (clicks is null or clicks >= 0) not valid,
  add constraint campaign_performance_clicks_within_impressions
    check (clicks is null or impressions is null or clicks <= impressions) not valid,
  add constraint campaign_performance_conversions_nonnegative
    check (conversions is null or conversions >= 0) not valid,
  add constraint campaign_performance_revenue_nonnegative
    check (revenue is null or revenue >= 0) not valid,
  add constraint campaign_performance_source_row_positive
    check (source_row is null or source_row >= 1) not valid;

create index if not exists idx_campaign_perf_workspace_batch
  on public.campaign_performance(workspace_id, import_batch_id)
  where import_batch_id is not null;

create index if not exists idx_campaign_perf_created_by
  on public.campaign_performance(created_by)
  where created_by is not null;

-- FR08 permits every workspace member to read and import rows. Mutation and
-- deletion remain restricted to Admin/Manager policies from the RBAC migration.
drop policy if exists "campaign_performance_operator_select"
  on public.campaign_performance;
drop policy if exists "campaign_performance_operator_insert"
  on public.campaign_performance;

create policy "campaign_performance_member_select"
  on public.campaign_performance
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "campaign_performance_member_insert"
  on public.campaign_performance
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.is_workspace_member(workspace_id)
  );

-- With an empty search_path, PostgreSQL also requires the pgvector operator
-- to be schema-qualified. This replaces the previous lint-failing body.
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
         (1 - (e.embedding operator(public.<=>) query_embedding))::double precision
  from public.strategy_context_embeddings as e
  where e.workspace_id = caller_workspace
    and e.embedding is not null
  order by e.embedding operator(public.<=>) query_embedding
  limit greatest(1, least(coalesce(match_count, 5), 20));
end;
$$;

revoke all on function public.match_strategy_context(vector, integer) from public;
grant execute on function public.match_strategy_context(vector, integer)
  to authenticated, service_role;

alter table public.workspaces validate constraint workspaces_name_length;
alter table public.campaign_performance validate constraint campaign_performance_ctr_range;
alter table public.campaign_performance validate constraint campaign_performance_cpa_nonnegative;
alter table public.campaign_performance validate constraint campaign_performance_roas_nonnegative;
alter table public.campaign_performance validate constraint campaign_performance_impressions_nonnegative;
alter table public.campaign_performance validate constraint campaign_performance_spend_nonnegative;
alter table public.campaign_performance validate constraint campaign_performance_clicks_nonnegative;
alter table public.campaign_performance validate constraint campaign_performance_clicks_within_impressions;
alter table public.campaign_performance validate constraint campaign_performance_conversions_nonnegative;
alter table public.campaign_performance validate constraint campaign_performance_revenue_nonnegative;
alter table public.campaign_performance validate constraint campaign_performance_source_row_positive;
