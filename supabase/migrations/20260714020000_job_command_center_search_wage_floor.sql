-- Persist the requested listed-base floor on each durable source-search task.
-- Additive only: existing tasks keep a zero floor and no rows are rewritten.

alter table public.jobcc_search_tasks
  add column if not exists minimum_listed_base_salary numeric not null default 0;

comment on column public.jobcc_search_tasks.minimum_listed_base_salary is
  'Lowest trusted listed base salary accepted by this search task; zero means no explicit floor.';
