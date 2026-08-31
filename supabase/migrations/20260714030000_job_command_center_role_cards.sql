-- Keep the role-review payload small. Full posting bodies stay in
-- jobcc_job_descriptions and are loaded only after a role is opened.
create or replace function public.jobcc_role_cards(limit_count integer default 1000)
returns table (
  id text,
  company text,
  role_title text,
  location text,
  status text,
  user_decision text,
  opportunity_score numeric,
  record jsonb,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    jobs.id,
    jobs.company,
    jobs.role_title,
    jobs.location,
    jobs.status,
    jobs.user_decision,
    jobs.opportunity_score,
    jobs.record - array[
      'raw_posting_text',
      'job_description_text',
      'job_description_text_full',
      'full_posting_text',
      'full_job_description',
      'description_text',
      'posting_text'
    ]::text[] as record,
    jobs.updated_at
  from public.jobcc_jobs as jobs
  where jobs.user_id = auth.uid()
  order by jobs.updated_at desc
  limit least(greatest(coalesce(limit_count, 1000), 1), 2000);
$$;

revoke all on function public.jobcc_role_cards(integer) from public;
revoke all on function public.jobcc_role_cards(integer) from anon;
grant execute on function public.jobcc_role_cards(integer) to authenticated;

comment on function public.jobcc_role_cards(integer) is
  'Authenticated role-card projection that excludes full posting bodies from list hydration.';
