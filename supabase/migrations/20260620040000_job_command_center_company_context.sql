-- Add reusable company context profiles for sourced Job Command Center roles.
-- Additive only: no drops, truncates, or destructive rewrites.

create table if not exists public.jobcc_company_context (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_name text not null default '',
  official_website text not null default '',
  careers_url text not null default '',
  company_about text not null default '',
  business_model text not null default '',
  industry text not null default '',
  company_stage text not null default '',
  public_or_private text not null default '',
  approximate_size text not null default '',
  headquarters text not null default '',
  why_company_may_interest_matthew text not null default '',
  source_links text[] not null default '{}',
  last_updated_at timestamptz,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobcc_company_context_user_name_idx
  on public.jobcc_company_context(user_id, lower(company_name));

alter table public.jobcc_company_context enable row level security;

drop policy if exists jobcc_company_context_owner_all on public.jobcc_company_context;

create policy jobcc_company_context_owner_all
  on public.jobcc_company_context
  for all
  to authenticated
  using (user_id = auth.uid() and public.jobcc_is_allowed_user())
  with check (user_id = auth.uid() and public.jobcc_is_allowed_user());

grant select, insert, update, delete on public.jobcc_company_context to authenticated;
revoke all on public.jobcc_company_context from anon;

drop trigger if exists jobcc_company_context_touch_updated_at on public.jobcc_company_context;

create trigger jobcc_company_context_touch_updated_at
  before update on public.jobcc_company_context
  for each row
  execute function public.jobcc_touch_updated_at();
