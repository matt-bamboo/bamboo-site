-- Keep stored source classification aligned with the strict workflow schema.
-- This corrects only the captured OpenAI role and preserves all other fields.

with actor as (
  select id as user_id
  from auth.users
  where lower(email) = 'matt@bamboo.holdings'
  limit 1
)
update public.jobcc_jobs j
set
  record = jsonb_set(coalesce(j.record, '{}'::jsonb), '{source_type}', '"official"'::jsonb, true),
  updated_at = now()
from actor a
where j.user_id = a.user_id
  and j.id = 'resurfaced-5988b6dbf357b866fbe96e5e';

with actor as (
  select id as user_id
  from auth.users
  where lower(email) = 'matt@bamboo.holdings'
  limit 1
)
update public.jobcc_job_descriptions d
set
  record = jsonb_set(coalesce(d.record, '{}'::jsonb), '{source_type}', '"official"'::jsonb, true),
  updated_at = now()
from actor a
where d.user_id = a.user_id
  and d.job_id = 'resurfaced-5988b6dbf357b866fbe96e5e';
