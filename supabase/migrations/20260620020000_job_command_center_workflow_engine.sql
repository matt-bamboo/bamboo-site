-- Additive workflow/search orchestration engine for the private Job Command Center.
-- This migration creates durable workflow state, search tasks, artifacts, and coverage.
-- It does not drop, truncate, or rewrite existing tables.

create table if not exists public.jobcc_workflow_runs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workflow_type text not null default '',
  status text not null default 'queued',
  trigger_type text not null default 'manual',
  parent_run_id text,
  search_run_id text,
  job_id text references public.jobcc_jobs(id) on delete set null,
  current_step text not null default '',
  total_steps integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  error_code text,
  error_message text,
  cost_estimate numeric,
  actual_cost numeric,
  input_record jsonb not null default '{}'::jsonb,
  output_record jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_workflow_steps (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  run_id text not null references public.jobcc_workflow_runs(id) on delete cascade,
  step_id text not null default '',
  step_order integer not null default 0,
  step_type text not null default '',
  model_role text,
  provider text,
  function_name text,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  max_attempts integer not null default 1,
  input_artifact_ids text[] not null default '{}',
  output_artifact_ids text[] not null default '{}',
  started_at timestamptz,
  completed_at timestamptz,
  error jsonb,
  cost numeric,
  token_usage jsonb not null default '{}'::jsonb,
  search_query_count integer not null default 0,
  idempotency_key text,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_workflow_artifacts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  run_id text not null references public.jobcc_workflow_runs(id) on delete cascade,
  step_id text,
  artifact_type text not null default '',
  schema_name text not null default '',
  schema_version text not null default 'job-command-center-v2',
  job_id text references public.jobcc_jobs(id) on delete set null,
  status text not null default 'draft',
  idempotency_key text,
  record jsonb not null default '{}'::jsonb,
  raw_output text,
  validation_errors text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_search_tasks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  run_id text not null references public.jobcc_workflow_runs(id) on delete cascade,
  search_run_id text not null,
  company_cluster text[] not null default '{}',
  role_family_cluster text[] not null default '{}',
  location_constraints text not null default '',
  compensation_constraints text not null default '',
  official_career_urls text[] not null default '{}',
  query_text text not null default '',
  status text not null default 'queued',
  attempts integer not null default 0,
  source_coverage jsonb not null default '{}'::jsonb,
  result_count integer not null default 0,
  error text,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_search_coverage (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  run_id text not null references public.jobcc_workflow_runs(id) on delete cascade,
  search_run_id text not null,
  companies_requested text[] not null default '{}',
  companies_searched text[] not null default '{}',
  companies_failed text[] not null default '{}',
  companies_not_searched text[] not null default '{}',
  role_families_requested text[] not null default '{}',
  role_families_searched text[] not null default '{}',
  role_families_failed text[] not null default '{}',
  sources_used text[] not null default '{}',
  official_sources_checked integer not null default 0,
  linkedin_sources_checked integer not null default 0,
  aggregator_sources_checked integer not null default 0,
  jobs_found integer not null default 0,
  jobs_verified integer not null default 0,
  jobs_rejected integer not null default 0,
  duplicates_removed integer not null default 0,
  jobs_needing_verification integer not null default 0,
  search_queries_executed integer not null default 0,
  search_complete boolean not null default false,
  coverage_percent numeric not null default 0,
  coverage_notes text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobcc_workflow_runs_user_status_idx on public.jobcc_workflow_runs(user_id, status);
create index if not exists jobcc_workflow_runs_user_job_idx on public.jobcc_workflow_runs(user_id, job_id);
create index if not exists jobcc_workflow_steps_run_order_idx on public.jobcc_workflow_steps(run_id, step_order);
create index if not exists jobcc_workflow_artifacts_run_idx on public.jobcc_workflow_artifacts(run_id);
create index if not exists jobcc_search_tasks_run_status_idx on public.jobcc_search_tasks(run_id, status);
create index if not exists jobcc_search_coverage_run_idx on public.jobcc_search_coverage(run_id);
create unique index if not exists jobcc_workflow_runs_idempotency_idx on public.jobcc_workflow_runs(user_id, idempotency_key) where idempotency_key is not null;
create unique index if not exists jobcc_workflow_steps_idempotency_idx on public.jobcc_workflow_steps(user_id, idempotency_key) where idempotency_key is not null;
create unique index if not exists jobcc_workflow_artifacts_idempotency_idx on public.jobcc_workflow_artifacts(user_id, idempotency_key) where idempotency_key is not null;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'jobcc_workflow_runs',
    'jobcc_workflow_steps',
    'jobcc_workflow_artifacts',
    'jobcc_search_tasks',
    'jobcc_search_coverage'
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
