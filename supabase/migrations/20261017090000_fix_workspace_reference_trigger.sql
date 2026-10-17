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
