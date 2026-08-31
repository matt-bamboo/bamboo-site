-- Additive application-record layer for post-apply artifacts when the exact
-- job is not yet confirmed. This avoids falsely attaching a submitted artifact
-- to a concrete job row while keeping RLS ownership intact.

create table if not exists public.jobcc_application_records (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company text not null default '',
  job_id text references public.jobcc_jobs(id) on delete set null,
  application_status text not null default '',
  needs_user_selection boolean not null default false,
  submitted_date text not null default '',
  submitted_resume_document_id text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobcc_application_records_user_company_idx on public.jobcc_application_records(user_id, company, application_status);
create index if not exists jobcc_application_records_user_selection_idx on public.jobcc_application_records(user_id, needs_user_selection);

alter table public.jobcc_application_records enable row level security;

drop policy if exists jobcc_application_records_owner_all on public.jobcc_application_records;
create policy jobcc_application_records_owner_all
  on public.jobcc_application_records
  for all
  to authenticated
  using (user_id = auth.uid() and public.jobcc_is_allowed_user())
  with check (user_id = auth.uid() and public.jobcc_is_allowed_user());

grant select, insert, update, delete on public.jobcc_application_records to authenticated;
revoke all on public.jobcc_application_records from anon;

drop trigger if exists jobcc_application_records_touch_updated_at on public.jobcc_application_records;
create trigger jobcc_application_records_touch_updated_at
  before update on public.jobcc_application_records
  for each row
  execute function public.jobcc_touch_updated_at();
