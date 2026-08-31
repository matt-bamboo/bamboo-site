-- Add explicit source-adapter metadata for source-first official job capture.
-- Additive only: no drops, truncates, or destructive rewrites.

alter table public.jobcc_company_sources
  add column if not exists source_adapter_type text not null default '',
  add column if not exists known_department_filters text[] not null default '{}',
  add column if not exists known_keyword_patterns text[] not null default '{}',
  add column if not exists capture_strategy text not null default '',
  add column if not exists browser_required_yes_no text not null default 'unknown';

