-- Backfill raw FR08 metrics separately from the schema change. Historical
-- rows remain identifiable because import_batch_id/source_filename stay null.

update public.campaign_performance
set clicks = greatest(
      0,
      round(coalesce(impressions, 0)::numeric * coalesce(ctr, 0) / 100)::bigint
    )
where clicks is null;

update public.campaign_performance
set conversions = greatest(
      0,
      case
        when coalesce(cpa, 0) > 0 then round(coalesce(spend, 0) / cpa)::bigint
        else 0
      end
    )
where conversions is null;

update public.campaign_performance
set revenue = greatest(0, coalesce(spend, 0) * coalesce(roas, 0))
where revenue is null;

alter table public.campaign_performance
  alter column clicks set default 0,
  alter column clicks set not null,
  alter column conversions set default 0,
  alter column conversions set not null,
  alter column revenue set default 0,
  alter column revenue set not null;
