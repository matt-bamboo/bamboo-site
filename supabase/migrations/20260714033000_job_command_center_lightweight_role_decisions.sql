-- Small review actions should not rewrite a role's large JSON payload. Keep
-- starred/rating state in typed columns while preserving legacy JSON fallback.
alter table if exists public.jobcc_jobs
  add column if not exists starred boolean,
  add column if not exists matthew_rating numeric;

create or replace function public.jobcc_role_cards_v2(limit_count integer default 1000)
returns table (
  id text,
  company text,
  role_title text,
  location text,
  status text,
  user_decision text,
  opportunity_score numeric,
  starred boolean,
  matthew_rating numeric,
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
    coalesce(
      jobs.starred,
      case lower(coalesce(jobs.record ->> 'starred', ''))
        when 'true' then true
        when 'yes' then true
        when '1' then true
        else false
      end
    ) as starred,
    coalesce(
      jobs.matthew_rating,
      case
        when coalesce(jobs.record ->> 'matthew_rating', '') ~ '^[0-9]+([.][0-9]+)?$'
          then (jobs.record ->> 'matthew_rating')::numeric
        when coalesce(jobs.record ->> 'rating', '') ~ '^[0-9]+([.][0-9]+)?$'
          then (jobs.record ->> 'rating')::numeric
        else null
      end
    ) as matthew_rating,
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

revoke all on function public.jobcc_role_cards_v2(integer) from public;
revoke all on function public.jobcc_role_cards_v2(integer) from anon;
grant execute on function public.jobcc_role_cards_v2(integer) to authenticated;

comment on function public.jobcc_role_cards_v2(integer) is
  'Authenticated lightweight role-card projection with typed review controls and no full posting bodies.';
