-- Hosted preflight found the original cross-table validator and no FR11
-- triggers/immutability guard. Reconcile those prerequisites in a NEW version;
-- do not replay or mark older, unrelated migrations as applied.
-- No historical row, workspace role, Team assignment or Auth data is changed.

-- PostgreSQL does not guarantee short-circuit evaluation for boolean
-- expressions. Branch on the trigger table before referencing columns that
-- only exist on that table.
create or replace function public.validate_workspace_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'strategies' then
    if new.business_profile_id is not null and not exists (
      select 1
      from public.business_profiles as bp
      where bp.id = new.business_profile_id
        and bp.workspace_id = new.workspace_id
    ) then
      raise exception 'CROSS_WORKSPACE_BUSINESS_PROFILE' using errcode = '23514';
    end if;
  elsif tg_table_name = 'ad_contents' then
    if new.strategy_id is not null and not exists (
      select 1
      from public.strategies as s
      where s.id = new.strategy_id
        and s.workspace_id = new.workspace_id
    ) then
      raise exception 'CROSS_WORKSPACE_STRATEGY' using errcode = '23514';
    end if;
  elsif tg_table_name = 'approvals' then
    if new.target_type = 'ad_content' and not exists (
      select 1
      from public.ad_contents as ac
      where ac.id = new.target_id
        and ac.workspace_id = new.workspace_id
    ) then
      raise exception 'CROSS_WORKSPACE_APPROVAL_TARGET' using errcode = '23514';
    elsif new.target_type = 'budget_proposal' and not exists (
      select 1
      from public.budget_proposals as bp
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

-- SCRUM-195: immutable, tenant-scoped audit logging at the database boundary.

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_data jsonb;
  new_data jsonb;
  target_workspace_id uuid;
  target_entity_id uuid;
begin
  if tg_op = 'INSERT' then
    new_data := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    old_data := to_jsonb(old);
    new_data := to_jsonb(new);

    -- Timestamp maintenance alone is not a business change.
    if (old_data - 'updated_at') is not distinct from (new_data - 'updated_at') then
      return new;
    end if;
  elsif tg_op = 'DELETE' then
    old_data := to_jsonb(old);
  end if;

  target_workspace_id := coalesce(
    nullif(new_data ->> 'workspace_id', ''),
    nullif(old_data ->> 'workspace_id', '')
  )::uuid;

  -- During a workspace cascade the parent row is already gone. Skipping the
  -- child log avoids both a dangling FK and blocking the requested deletion.
  if target_workspace_id is null or not exists (
    select 1
    from public.workspaces as w
    where w.id = target_workspace_id
  ) then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_table_name = 'workspace_members' then
    target_entity_id := coalesce(
      nullif(new_data ->> 'user_id', ''),
      nullif(old_data ->> 'user_id', '')
    )::uuid;
  else
    target_entity_id := coalesce(
      nullif(new_data ->> 'id', ''),
      nullif(old_data ->> 'id', '')
    )::uuid;
  end if;

  insert into public.audit_logs (
    workspace_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    before_value,
    after_value
  )
  values (
    target_workspace_id,
    auth.uid(),
    case tg_op
      when 'INSERT' then 'create'
      when 'UPDATE' then 'update'
      when 'DELETE' then 'delete'
    end,
    tg_table_name,
    target_entity_id,
    old_data,
    new_data
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke execute on function public.audit_row_change() from public, anon, authenticated;

create or replace function public.attach_audit_trigger(target regclass)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_schema name;
  target_table name;
  audit_trigger_name name;
begin
  select n.nspname, c.relname
  into target_schema, target_table
  from pg_catalog.pg_class as c
  join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
  where c.oid = target;

  if target_schema is null then
    raise exception 'AUDIT_TRIGGER_INVALID_TARGET: relation does not exist';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_attribute as a
    where a.attrelid = target
      and a.attname = 'workspace_id'
      and a.attnum > 0
      and not a.attisdropped
  ) then
    raise exception 'AUDIT_TRIGGER_INVALID_TARGET: %.% must have workspace_id',
      target_schema,
      target_table;
  end if;

  audit_trigger_name := ('audit_' || target_table)::name;
  execute format(
    'drop trigger if exists %I on %I.%I',
    audit_trigger_name,
    target_schema,
    target_table
  );
  execute format(
    'create trigger %I after insert or update or delete on %I.%I for each row execute function public.audit_row_change()',
    audit_trigger_name,
    target_schema,
    target_table
  );
end;
$$;

revoke execute on function public.attach_audit_trigger(regclass)
  from public, anon, authenticated;

select public.attach_audit_trigger('public.ad_contents'::regclass);
select public.attach_audit_trigger('public.budget_proposals'::regclass);
select public.attach_audit_trigger('public.approvals'::regclass);
select public.attach_audit_trigger('public.workspace_members'::regclass);
select public.attach_audit_trigger('public.business_profiles'::regclass);

-- API clients may append only through trusted code or the audit trigger.
revoke update, delete, truncate on table public.audit_logs
  from anon, authenticated, service_role;
revoke insert on table public.audit_logs from anon, authenticated;
grant insert on table public.audit_logs to service_role;

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- The FK is ON DELETE CASCADE. Permit only the child deletion caused after
  -- the corresponding workspace has ceased to exist.
  if tg_op = 'DELETE' and not exists (
    select 1
    from public.workspaces as w
    where w.id = old.workspace_id
  ) then
    return old;
  end if;

  raise exception 'AUDIT_LOG_IMMUTABLE: audit logs cannot be updated or deleted'
    using errcode = '55000';
end;
$$;

revoke execute on function public.prevent_audit_log_mutation()
  from public, anon, authenticated;

drop trigger if exists audit_logs_immutable on public.audit_logs;
create trigger audit_logs_immutable
before update or delete on public.audit_logs
for each row execute function public.prevent_audit_log_mutation();

-- Hosted still has the legacy workspace-role lookup. Keep its workspace policy,
-- but require a verified business actor as well: platform admins with old
-- memberships and unconfirmed users must not read employee/business audit data.
create policy leader_audit_actor_scope on public.audit_logs
as restrictive for select to authenticated
using (membership_private.valid_actor());
