begin;

-- Pure validation helper; no table reads and no SECURITY DEFINER privileges.
create function employee_private.valid_brand_rules(p_rules jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare v_key text; v_item jsonb; v_term text;
begin
 if p_rules is null or jsonb_typeof(p_rules)<>'object' then return false; end if;
 if not (p_rules ?& array['schemaVersion','bannedTerms','requiredTerms','warnAbsoluteClaims','warnPersonalData'])
  or exists(select 1 from jsonb_object_keys(p_rules) k where k<>all(array['schemaVersion','bannedTerms','requiredTerms','warnAbsoluteClaims','warnPersonalData']))
  or p_rules->'schemaVersion'<>'1'::jsonb
  or jsonb_typeof(p_rules->'warnAbsoluteClaims')<>'boolean'
  or jsonb_typeof(p_rules->'warnPersonalData')<>'boolean' then return false; end if;
 foreach v_key in array array['bannedTerms','requiredTerms'] loop
  if jsonb_typeof(p_rules->v_key)<>'array' then return false; end if;
  if jsonb_array_length(p_rules->v_key)>50 then return false; end if;
  for v_item in select value from jsonb_array_elements(p_rules->v_key) loop
   if jsonb_typeof(v_item)<>'string' then return false; end if;
   v_term:=v_item#>>'{}';
   if length(v_term) not between 1 and 80 or v_term<>btrim(v_term) or v_term ~ '[[:cntrl:]]' then return false; end if;
  end loop;
  if (select count(*)<>count(distinct lower(value)) from jsonb_array_elements_text(p_rules->v_key)) then return false; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements_text(p_rules->'bannedTerms') b
  join jsonb_array_elements_text(p_rules->'requiredTerms') r on lower(b.value)=lower(r.value)) then return false; end if;
 return true;
end $$;
revoke all on function employee_private.valid_brand_rules(jsonb) from public,anon;
grant execute on function employee_private.valid_brand_rules(jsonb) to authenticated,service_role;

alter table public.business_profiles add column brand_safety_rules jsonb not null
 default '{"schemaVersion":1,"bannedTerms":[],"requiredTerms":[],"warnAbsoluteClaims":true,"warnPersonalData":true}'::jsonb;
alter table public.business_profiles add constraint business_profile_brand_rules_valid
 check(employee_private.valid_brand_rules(brand_safety_rules));
-- Existing business-profile RLS, Active guard and audit trigger remain authoritative.
notify pgrst,'reload schema';
commit;
