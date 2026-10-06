-- Expand the agreed business profile so the existing Sprint 1 onboarding UI
-- can move from Django-owned rows to Supabase without dropping user data.

alter table public.business_profiles
  add column if not exists product_service text,
  add column if not exists primary_goal text,
  add column if not exists preferred_channels jsonb not null default '[]'::jsonb,
  add column if not exists monthly_budget numeric not null default 0
    check (monthly_budget >= 0 and monthly_budget <= 1000000000),
  add column if not exists currency text not null default 'VND'
    check (currency in ('VND', 'USD'));

-- Sprint 1 has exactly one business profile per workspace. This also provides
-- the conflict target used by the idempotent onboarding upsert.
create unique index if not exists uq_business_profiles_workspace
  on public.business_profiles(workspace_id);

comment on column public.business_profiles.product_service is
  'Primary product or service described during FR12 onboarding.';
comment on column public.business_profiles.primary_goal is
  'Primary marketing goal described during FR12 onboarding.';
comment on column public.business_profiles.preferred_channels is
  'JSON array containing Meta, Google Ads, and/or TikTok.';
