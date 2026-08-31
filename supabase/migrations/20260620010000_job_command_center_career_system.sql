-- Additive Career Canon, source document, resume lane, orchestration, and approval schema.
-- Apply only after Matthew approves the hosted database migration.
-- This migration does not drop, truncate, or rewrite existing tables.

create table if not exists public.jobcc_career_facts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null default 'positioning',
  status text not null default 'needs_review',
  canonical_claim text not null default '',
  source_document_ids text[] not null default '{}',
  evidence_notes text not null default '',
  approved_variants text[] not null default '{}',
  prohibited_variants text[] not null default '{}',
  usable_for text[] not null default '{}',
  sensitivity text not null default 'standard',
  last_reviewed_at date,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_source_documents (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null default 'other',
  title text not null default '',
  authority_level text not null default 'reference_only',
  source_date date,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_resume_lanes (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default '',
  active_resume_version text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_role_families (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default '',
  recommended_lane_id text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_job_fact_matches (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text not null references public.jobcc_jobs(id) on delete cascade,
  fact_id text not null,
  match_score numeric not null default 0,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_generated_packets (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text references public.jobcc_jobs(id) on delete set null,
  packet_type text not null default '',
  status text not null default 'draft',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_model_critiques (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text references public.jobcc_jobs(id) on delete set null,
  critique_type text not null default '',
  status text not null default 'ready_for_review',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_approvals (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_type text not null default '',
  job_id text references public.jobcc_jobs(id) on delete set null,
  status text not null default 'ready_for_review',
  title text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_application_history (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text not null references public.jobcc_jobs(id) on delete cascade,
  event_date date,
  event_type text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_interview_history (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text not null references public.jobcc_jobs(id) on delete cascade,
  event_date date,
  event_type text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_agent_runs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workflow_type text not null default '',
  model_role text not null default '',
  function_name text not null default '',
  status text not null default 'drafted',
  job_id text references public.jobcc_jobs(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_agent_steps (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  run_id text not null references public.jobcc_agent_runs(id) on delete cascade,
  step_index integer not null default 0,
  status text not null default '',
  label text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_browser_tasks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text references public.jobcc_jobs(id) on delete set null,
  status text not null default 'prepared',
  title text not null default '',
  stop_point text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_model_usage_logs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  provider text not null default '',
  model text not null default '',
  workflow_type text not null default '',
  cost_estimate text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_user_settings (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobcc_career_facts_user_status_idx on public.jobcc_career_facts(user_id, status);
create index if not exists jobcc_career_facts_user_category_idx on public.jobcc_career_facts(user_id, category);
create index if not exists jobcc_source_documents_user_authority_idx on public.jobcc_source_documents(user_id, authority_level);
create index if not exists jobcc_resume_lanes_user_idx on public.jobcc_resume_lanes(user_id);
create index if not exists jobcc_job_fact_matches_job_idx on public.jobcc_job_fact_matches(job_id);
create index if not exists jobcc_generated_packets_job_idx on public.jobcc_generated_packets(job_id);
create index if not exists jobcc_model_critiques_job_idx on public.jobcc_model_critiques(job_id);
create index if not exists jobcc_approvals_user_status_idx on public.jobcc_approvals(user_id, status);
create index if not exists jobcc_agent_runs_user_status_idx on public.jobcc_agent_runs(user_id, status);
create index if not exists jobcc_agent_steps_run_idx on public.jobcc_agent_steps(run_id, step_index);
create index if not exists jobcc_browser_tasks_user_status_idx on public.jobcc_browser_tasks(user_id, status);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'jobcc_career_facts',
    'jobcc_source_documents',
    'jobcc_resume_lanes',
    'jobcc_role_families',
    'jobcc_job_fact_matches',
    'jobcc_generated_packets',
    'jobcc_model_critiques',
    'jobcc_approvals',
    'jobcc_application_history',
    'jobcc_interview_history',
    'jobcc_agent_runs',
    'jobcc_agent_steps',
    'jobcc_browser_tasks',
    'jobcc_model_usage_logs',
    'jobcc_user_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_owner_all', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (user_id = auth.uid() and public.jobcc_is_allowed_user()) with check (user_id = auth.uid() and public.jobcc_is_allowed_user())',
      table_name || '_owner_all',
      table_name
    );
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('revoke all on public.%I from anon', table_name);
    execute format('drop trigger if exists %I on public.%I', table_name || '_touch_updated_at', table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.jobcc_touch_updated_at()',
      table_name || '_touch_updated_at',
      table_name
    );
  end loop;
end $$;
