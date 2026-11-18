-- Additive reconciliation for hosted installations that missed the raw-metric
-- expansion. Does not rerun old migrations or invent missing historical data.
alter table public.campaign_performance
  add column if not exists clicks bigint,
  add column if not exists conversions bigint,
  add column if not exists revenue numeric,
  add column if not exists import_batch_id uuid,
  add column if not exists source_filename text,
  add column if not exists source_row integer,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists metric_provenance text not null default 'legacy_unknown';
-- Old installations may have inferred raw metrics. Label all pre-rollout rows
-- conservatively; new import RPCs explicitly mark measurements as observed.
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.campaign_performance'::regclass and conname='campaign_raw_input_valid') then
    alter table public.campaign_performance add constraint campaign_raw_input_valid check (
      (clicks is null or clicks>=0) and (conversions is null or conversions>=0)
      and (revenue is null or (revenue>=0 and revenue::text not in ('NaN','Infinity','-Infinity')))
      and (source_row is null or source_row>=1)
      and (clicks is null or impressions is null or clicks<=impressions)
    ) not valid;
  end if;
end $$;
create index if not exists idx_campaign_perf_workspace_batch
  on public.campaign_performance(workspace_id,import_batch_id) where import_batch_id is not null;
