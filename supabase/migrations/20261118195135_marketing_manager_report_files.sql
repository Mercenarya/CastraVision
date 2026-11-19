-- Additive guard: private artifacts are embedded in reports.params (bounded to 512 KB
-- by the API). Existing reports retain their old semantics. Roll back this migration
-- only after removing new artifacts, otherwise legacy policies expose their contents.
begin;
create policy manager_artifact_select_guard on public.reports
  as restrictive for select to authenticated
  using (
    coalesce(params->>'source', '') <> 'marketing_manager_v1'
    or public.has_workspace_role(workspace_id, array['admin']::public.workspace_role[])
  );

-- Do not silently delete duplicates. A duplicate legacy registry requires explicit
-- review before this index can be installed on hosted.
create unique index idx_competitor_workspace_keyword_unique
  on public.competitor_insights(workspace_id, lower(btrim(keyword)));

-- Capability probe prevents API writes before this security guard is deployed.
create function public.membership_manager_tools_ready(p_workspace_id uuid) returns boolean
language sql stable security invoker set search_path='' as $$
  select public.has_workspace_role(p_workspace_id, array['admin']::public.workspace_role[]);
$$;
revoke all on function public.membership_manager_tools_ready(uuid) from public, anon;
grant execute on function public.membership_manager_tools_ready(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
