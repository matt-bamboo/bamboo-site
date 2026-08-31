-- Additive Resume + Outreach Playbook learning schema.
-- This migration is non-destructive. It stores document versions, feedback,
-- approved learning rules, before/after examples, playbooks, rule applications,
-- and model collaboration results for Matthew's private Job Command Center.

create table if not exists public.jobcc_document_playbooks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default '',
  document_type text not null default '',
  role_family text,
  company text,
  version integer not null default 1,
  status text not null default 'draft',
  purpose text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_document_versions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text references public.jobcc_jobs(id) on delete set null,
  document_type text not null default '',
  role_family text,
  company text,
  version_number integer not null default 1,
  content text not null default '',
  provider text not null default '',
  model_name text not null default '',
  prompt_version text not null default '',
  playbook_version text not null default '',
  rule_ids_used text[] not null default '{}',
  feedback_ids_used text[] not null default '{}',
  status text not null default 'draft',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_document_feedback (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id text references public.jobcc_document_versions(id) on delete cascade,
  job_id text references public.jobcc_jobs(id) on delete set null,
  feedback_text text not null default '',
  feedback_type text not null default '',
  apply_scope text not null default 'do_not_learn',
  applied boolean not null default false,
  accepted boolean not null default false,
  promoted_to_rule boolean not null default false,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_document_learning_rules (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rule_text text not null default '',
  rule_category text not null default 'global_writing_rule',
  applies_to_document_type text,
  applies_to_role_family text,
  applies_to_company text,
  scope text not null default 'one_time',
  strength text not null default 'suggestion',
  source_feedback_id text references public.jobcc_document_feedback(id) on delete set null,
  approved_by_matthew boolean not null default false,
  active boolean not null default true,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_document_before_after_examples (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text references public.jobcc_jobs(id) on delete set null,
  document_type text not null default '',
  role_family text,
  company text,
  original_draft text not null default '',
  matthew_feedback text not null default '',
  revised_draft text not null default '',
  final_approved_version text not null default '',
  accepted_changes text[] not null default '{}',
  rejected_changes text[] not null default '{}',
  learned_rule_candidate_ids text[] not null default '{}',
  promoted_rule_ids text[] not null default '{}',
  provider text not null default '',
  model_name text not null default '',
  prompt_version text not null default '',
  status text not null default 'needs_review',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_document_rule_applications (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id text references public.jobcc_document_versions(id) on delete cascade,
  rule_id text references public.jobcc_document_learning_rules(id) on delete cascade,
  job_id text references public.jobcc_jobs(id) on delete set null,
  applied_at timestamptz not null default now(),
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobcc_model_collaboration_results (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id text references public.jobcc_jobs(id) on delete set null,
  document_type text not null default '',
  role_family text,
  draft_provider text not null default '',
  critic_provider text not null default '',
  finalizer_provider text not null default '',
  user_rating numeric,
  approved_yes_no boolean,
  revision_count integer not null default 0,
  notes text not null default '',
  best_practice_learned text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobcc_document_playbooks_user_type_idx on public.jobcc_document_playbooks(user_id, document_type, status);
create index if not exists jobcc_document_versions_user_job_idx on public.jobcc_document_versions(user_id, job_id, document_type, status);
create index if not exists jobcc_document_feedback_document_idx on public.jobcc_document_feedback(document_id);
create index if not exists jobcc_document_learning_rules_user_scope_idx on public.jobcc_document_learning_rules(user_id, scope, active);
create index if not exists jobcc_document_learning_rules_category_idx on public.jobcc_document_learning_rules(user_id, rule_category);
create index if not exists jobcc_document_before_after_examples_user_type_idx on public.jobcc_document_before_after_examples(user_id, document_type, status);
create index if not exists jobcc_document_rule_applications_document_idx on public.jobcc_document_rule_applications(document_id);
create index if not exists jobcc_model_collaboration_results_user_type_idx on public.jobcc_model_collaboration_results(user_id, document_type);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'jobcc_document_playbooks',
    'jobcc_document_versions',
    'jobcc_document_feedback',
    'jobcc_document_learning_rules',
    'jobcc_document_before_after_examples',
    'jobcc_document_rule_applications',
    'jobcc_model_collaboration_results'
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
