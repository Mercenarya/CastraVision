-- Read authorization as authenticated/JWT claims; fixture is always rolled back.
-- Uses only existing dedicated demo identities; never selects password columns.
begin;
set local statement_timeout='30s';
do $setup$
declare a uuid; w uuid; e uuid; l uuid;
begin
  if exists(select 1 from public.reports
    where id='f7880a00-e36a-4854-a891-8fae715828a1') then
    raise exception 'Probe ID already exists; stopped';
  end if;
  select m.user_id,m.workspace_id into strict a,w from public.workspace_members m
    join auth.users u on u.id=m.user_id
    where u.email='marketing.manager.demo@castravision.test' and m.role='admin' limit 1;
  select m.user_id into strict e from public.workspace_members m join auth.users u on u.id=m.user_id
    where m.workspace_id=w and m.role='member' and u.email='employee.demo@castravision.test' limit 1;
  select m.user_id into strict l from public.workspace_members m join auth.users u on u.id=m.user_id
    where m.workspace_id=w and m.role='manager' and u.email='leader.demo@castravision.test' limit 1;
  perform set_config('mmprobe.ws',w::text,true);
  perform set_config('mmprobe.admin',a::text,true);
  perform set_config('mmprobe.employee',e::text,true);
  perform set_config('mmprobe.leader',l::text,true);
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
end $setup$;
set local role authenticated;
insert into public.reports(id,workspace_id,format,status,requested_by,params) values
('f7880a00-e36a-4854-a891-8fae715828a1',current_setting('mmprobe.ws')::uuid,'csv','ready',
 current_setting('mmprobe.admin')::uuid,'{"source":"marketing_manager_v1","artifact":"cmxzLXByb2Jl"}');
do $admin$ begin
 if (select count(*) from public.reports
   where id='f7880a00-e36a-4854-a891-8fae715828a1')<>1 then
   raise exception 'MM cannot read its artifact'; end if;
 if not public.membership_manager_tools_ready(current_setting('mmprobe.ws')::uuid) then
   raise exception 'MM capability false'; end if;
end $admin$;
select set_config('request.jwt.claim.sub',current_setting('mmprobe.employee'),true);
select set_config('request.jwt.claims',jsonb_build_object(
 'sub',current_setting('mmprobe.employee'),'role','authenticated')::text,true);
do $employee$ begin
 if exists(select 1 from public.reports where id='f7880a00-e36a-4854-a891-8fae715828a1') then
   raise exception 'Employee can see private artifact'; end if;
 if public.membership_manager_tools_ready(current_setting('mmprobe.ws')::uuid) then
   raise exception 'Employee capability true'; end if;
end $employee$;
select set_config('request.jwt.claim.sub',current_setting('mmprobe.leader'),true);
select set_config('request.jwt.claims',jsonb_build_object(
 'sub',current_setting('mmprobe.leader'),'role','authenticated')::text,true);
do $leader$ begin
 if exists(select 1 from public.reports where id='f7880a00-e36a-4854-a891-8fae715828a1') then
   raise exception 'Leader can see private artifact'; end if;
 if public.membership_manager_tools_ready(current_setting('mmprobe.ws')::uuid) then
   raise exception 'Leader capability true'; end if;
end $leader$;
reset role;
rollback;
select true as authenticated_rls_probes_passed,
 not exists(select 1 from public.reports
   where id='f7880a00-e36a-4854-a891-8fae715828a1') as fixture_rolled_back;
