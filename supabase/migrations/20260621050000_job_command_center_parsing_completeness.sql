alter table if exists public.jobcc_jobs
  add column if not exists parsing_model_version text not null default '',
  add column if not exists scoring_model_version text not null default '',
  add column if not exists posting_hash text not null default '',
  add column if not exists normalized_posting_hash text not null default '',
  add column if not exists prior_posting_hash text not null default '',
  add column if not exists posting_changed_yes_no boolean not null default false,
  add column if not exists first_captured_at timestamptz,
  add column if not exists last_captured_at timestamptz,
  add column if not exists last_verified_at timestamptz,
  add column if not exists analysis_status text not null default '',
  add column if not exists score_status text not null default '',
  add column if not exists analysis_reused boolean not null default false,
  add column if not exists rerun_reason text not null default '',
  add column if not exists analysis_cost numeric not null default 0,
  add column if not exists packet_eligibility text not null default '',
  add column if not exists packet_blocked_reason text not null default '';

alter table if exists public.jobcc_job_descriptions
  add column if not exists parsing_model_version text not null default '',
  add column if not exists scoring_model_version text not null default '',
  add column if not exists posting_hash text not null default '',
  add column if not exists normalized_posting_hash text not null default '',
  add column if not exists prior_posting_hash text not null default '',
  add column if not exists posting_changed_yes_no boolean not null default false,
  add column if not exists first_captured_at timestamptz,
  add column if not exists last_captured_at timestamptz,
  add column if not exists last_verified_at timestamptz,
  add column if not exists analysis_status text not null default '',
  add column if not exists score_status text not null default '',
  add column if not exists analysis_reused boolean not null default false,
  add column if not exists rerun_reason text not null default '',
  add column if not exists analysis_cost numeric not null default 0,
  add column if not exists packet_eligibility text not null default '',
  add column if not exists packet_blocked_reason text not null default '';

create index if not exists jobcc_jobs_posting_hash_idx
  on public.jobcc_jobs (user_id, posting_hash);

create index if not exists jobcc_jobs_score_status_idx
  on public.jobcc_jobs (user_id, score_status);

create index if not exists jobcc_job_descriptions_posting_hash_idx
  on public.jobcc_job_descriptions (user_id, posting_hash);
