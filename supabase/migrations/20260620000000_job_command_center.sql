-- Private Job Command Center schema.
-- Apply only after Matthew approves the hosted database migration.
-- After applying, insert the allowed account in the SQL editor:
-- insert into public.jobcc_allowed_users (email) values ('configured-allowed-email@example.com');

create table if not exists public.jobcc_allowed_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.jobcc_allowed_users enable row level security;
revoke all on public.jobcc_allowed_users from anon, authenticated;

create or replace function public.jobcc_is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobcc_allowed_users allowed
    where lower(allowed.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.jobcc_is_allowed_user() to authenticated;

create or replace function public.jobcc_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.jobcc_jobs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company text not null default '',
  role_title text not null default '',
  location text not null default '',
  status text not null default '',
  user_decision text not null default '',
  opportunity_score numeric,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_job_descriptions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text not null references public.jobcc_jobs(id) on delete cascade,
  description_text text not null default '',
  job_summary text not null default '',
  responsibilities text[] not null default '{}',
  required_qualifications text[] not null default '{}',
  preferred_qualifications text[] not null default '{}',
  skills_keywords text[] not null default '{}',
  team_summary text not null default '',
  source_url text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_ai_outputs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text not null references public.jobcc_jobs(id) on delete cascade,
  output_type text not null default '',
  approved boolean not null default false,
  used boolean not null default false,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_search_runs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  search_run_id text not null,
  completed_at timestamptz,
  search_complete boolean not null default false,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_application_tracking (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text not null references public.jobcc_jobs(id) on delete cascade,
  application_status text not null default '',
  applied_date date,
  follow_up_date date,
  next_action text not null default '',
  next_action_due_date date,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_interview_tracking (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text not null references public.jobcc_jobs(id) on delete cascade,
  interview_stage text not null default '',
  interview_date date,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_decision_notes (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text not null references public.jobcc_jobs(id) on delete cascade,
  matthew_rating numeric,
  user_decision text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_resume_bank (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_career_canon (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  profile_summary text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobcc_jobs_user_id_idx on public.jobcc_jobs(user_id);
create index if not exists jobcc_jobs_company_idx on public.jobcc_jobs(company);
create index if not exists jobcc_jobs_updated_at_idx on public.jobcc_jobs(updated_at desc);
create index if not exists jobcc_job_descriptions_job_id_idx on public.jobcc_job_descriptions(job_id);
create index if not exists jobcc_ai_outputs_job_id_idx on public.jobcc_ai_outputs(job_id);
create index if not exists jobcc_search_runs_user_id_idx on public.jobcc_search_runs(user_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'jobcc_jobs',
    'jobcc_job_descriptions',
    'jobcc_ai_outputs',
    'jobcc_search_runs',
    'jobcc_application_tracking',
    'jobcc_interview_tracking',
    'jobcc_decision_notes',
    'jobcc_resume_bank',
    'jobcc_career_canon'
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
