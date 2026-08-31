-- Add reusable company source directory for explicit job-source navigation.
-- Additive only: no drops, truncates, or destructive rewrites.

create table if not exists public.jobcc_company_sources (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_name text not null default '',
  priority_tier text not null default 'P2',
  company_group text not null default '',
  official_website text not null default '',
  official_careers_home_url text not null default '',
  official_job_search_url text not null default '',
  ats_provider text not null default '',
  ats_job_url_pattern text not null default '',
  linkedin_company_url text not null default '',
  linkedin_jobs_url text not null default '',
  company_about_source_url text not null default '',
  known_location_filters text[] not null default '{}',
  known_remote_filters text[] not null default '{}',
  known_keyword_search_patterns text[] not null default '{}',
  target_role_families text[] not null default '{}',
  compensation_source_notes text not null default '',
  job_posting_capture_notes text not null default '',
  navigation_notes text not null default '',
  source_confidence text not null default 'unverified',
  last_verified_at date,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobcc_company_sources_user_company_idx
  on public.jobcc_company_sources(user_id, lower(company_name));

create index if not exists jobcc_company_sources_user_priority_idx
  on public.jobcc_company_sources(user_id, priority_tier, company_group);

alter table public.jobcc_company_sources enable row level security;

drop policy if exists jobcc_company_sources_owner_all on public.jobcc_company_sources;

create policy jobcc_company_sources_owner_all
  on public.jobcc_company_sources
  for all
  to authenticated
  using (user_id = auth.uid() and public.jobcc_is_allowed_user())
  with check (user_id = auth.uid() and public.jobcc_is_allowed_user());

grant select, insert, update, delete on public.jobcc_company_sources to authenticated;
revoke all on public.jobcc_company_sources from anon;

drop trigger if exists jobcc_company_sources_touch_updated_at on public.jobcc_company_sources;

create trigger jobcc_company_sources_touch_updated_at
  before update on public.jobcc_company_sources
  for each row
  execute function public.jobcc_touch_updated_at();
