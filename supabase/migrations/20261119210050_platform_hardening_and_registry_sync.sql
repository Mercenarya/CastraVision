begin;
-- Platform accounts with legacy business memberships still cannot read tenant
-- data. Keep this distinct from Active: platform RPCs can manage inactive rows.
create function platform_private.business_actor() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and coalesce(raw_app_meta_data->>'platform_role',raw_app_meta_data->>'role','')<>'system_admin');
$$;
revoke all on function platform_private.business_actor() from public,anon;
grant execute on function platform_private.business_actor() to authenticated,service_role;
do $$declare r record;v_new text;begin
 for r in select c.table_name from information_schema.columns c join pg_catalog.pg_tables t on t.schemaname=c.table_schema and t.tablename=c.table_name
 where c.table_schema='public' and c.column_name='workspace_id' and c.udt_name='uuid' loop
  execute format('alter policy platform_active_tenant on public.%I using(platform_private.business_actor() and platform_private.workspace_active(workspace_id)) with check(platform_private.business_actor() and platform_private.workspace_active(workspace_id))',r.table_name);
 end loop;
 alter policy platform_active_tenant on public.workspaces using(platform_private.business_actor() and platform_private.workspace_active(id)) with check(platform_private.business_actor() and platform_private.workspace_active(id));
 for r in select p.prosrc,pg_get_functiondef(p.oid) definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('is_workspace_member','workspace_role') loop
  v_new:=replace(r.prosrc,'where platform_private.workspace_active(ws_id)','where platform_private.business_actor() and platform_private.workspace_active(ws_id)');
  if v_new=r.prosrc then raise exception 'Business scope helper missing';end if;
  execute replace(r.definition,r.prosrc,v_new);
 end loop;
end $$;

-- Workspaces created by trusted legacy/operator paths must also be visible in
-- the platform registry. Do not infer their manager email from the employee roster.
create function platform_private.register_workspace() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into platform_private.companies(workspace_id,slug,legal_entity,created_at)
 values(new.id,'ws-'||new.id::text,new.name,new.created_at) on conflict do nothing;
 return new;
end $$;
revoke all on function platform_private.register_workspace() from public,anon,authenticated;
create trigger platform_register_workspace after insert on public.workspaces for each row execute function platform_private.register_workspace();
do $$declare r record;v_new text;begin
 select p.prosrc,pg_get_functiondef(p.oid) definition into r from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='platform_create';
 v_new:=replace(r.prosrc,'v_actor,v_request,p_data);','v_actor,v_request,p_data) on conflict(workspace_id) do update set slug=excluded.slug,legal_entity=excluded.legal_entity,domain=excluded.domain,notes=excluded.notes,status=excluded.status,created_by=excluded.created_by,request_id=excluded.request_id,request_payload=excluded.request_payload;');
 if v_new=r.prosrc then raise exception 'Platform create registry synchronization missing';end if;
 execute replace(r.definition,r.prosrc,v_new);
end $$;

-- Strong type checks also apply to direct RPC calls, not only Django input.
do $$declare r record;v_new text;begin
 select p.prosrc,pg_get_functiondef(p.oid) definition into r from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='platform_private' and p.proname='validate';
 v_new:=replace(r.prosrc,'if jsonb_typeof(p_data)','if p_data is null or jsonb_typeof(p_data)');
 execute replace(r.definition,r.prosrc,v_new);
end $$;
notify pgrst,'reload schema';
commit;
