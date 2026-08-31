-- Additive canon/public-profile version tracking.
-- This does not rerun or rewrite existing analyses. Old records keep their original
-- record payloads; future runs can stamp these version fields explicitly.

alter table public.jobcc_resume_bank
  add column if not exists career_canon_version text not null default '',
  add column if not exists public_profile_version text not null default '',
  add column if not exists preference_model_version text not null default '',
  add column if not exists resume_playbook_version text not null default '',
  add column if not exists outreach_playbook_version text not null default '';

alter table public.jobcc_career_canon
  add column if not exists career_canon_version text not null default '',
  add column if not exists public_profile_version text not null default '',
  add column if not exists preference_model_version text not null default '';

alter table public.jobcc_source_documents
  add column if not exists public_profile_version text not null default '',
  add column if not exists career_canon_version text not null default '';

alter table public.jobcc_jobs
  add column if not exists career_canon_version text not null default '',
  add column if not exists preference_model_version text not null default '';

alter table public.jobcc_ai_outputs
  add column if not exists career_canon_version text not null default '',
  add column if not exists public_profile_version text not null default '',
  add column if not exists preference_model_version text not null default '',
  add column if not exists resume_playbook_version text not null default '',
  add column if not exists outreach_playbook_version text not null default '';

alter table public.jobcc_generated_packets
  add column if not exists career_canon_version text not null default '',
  add column if not exists public_profile_version text not null default '',
  add column if not exists preference_model_version text not null default '',
  add column if not exists resume_playbook_version text not null default '',
  add column if not exists outreach_playbook_version text not null default '';

alter table public.jobcc_search_runs
  add column if not exists career_canon_version text not null default '',
  add column if not exists preference_model_version text not null default '';

alter table public.jobcc_document_versions
  add column if not exists career_canon_version text not null default '',
  add column if not exists public_profile_version text not null default '',
  add column if not exists preference_model_version text not null default '',
  add column if not exists resume_playbook_version text not null default '',
  add column if not exists outreach_playbook_version text not null default '';
