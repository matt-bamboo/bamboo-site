-- Add durable queue controls for the private Job Command Center workflow engine.
-- This is additive only: no drops, truncates, or destructive rewrites.

alter table public.jobcc_workflow_runs
  add column if not exists worker_id text,
  add column if not exists last_heartbeat_at timestamptz,
  add column if not exists max_estimated_cost numeric,
  add column if not exists max_actual_cost numeric,
  add column if not exists max_error_rate numeric,
  add column if not exists cancellation_requested_at timestamptz;

alter table public.jobcc_workflow_steps
  add column if not exists actual_model text,
  add column if not exists provider_request_id text,
  add column if not exists latency_ms integer,
  add column if not exists estimated_cost numeric,
  add column if not exists actual_cost numeric;

alter table public.jobcc_search_tasks
  add column if not exists claimed_at timestamptz,
  add column if not exists worker_id text,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists max_attempts integer not null default 2,
  add column if not exists idempotency_key text;

create index if not exists jobcc_search_tasks_claim_idx
  on public.jobcc_search_tasks(run_id, status, claimed_at, created_at);

create unique index if not exists jobcc_search_tasks_idempotency_idx
  on public.jobcc_search_tasks(user_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.jobcc_claim_next_search_task(
  p_run_id text,
  p_worker_id text,
  p_claim_ttl_seconds integer default 900
)
returns public.jobcc_search_tasks
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_task public.jobcc_search_tasks%rowtype;
begin
  update public.jobcc_search_tasks
     set status = 'queued',
         claimed_at = null,
         worker_id = null,
         updated_at = now()
   where run_id = p_run_id
     and user_id = auth.uid()
     and status in ('claimed', 'running')
     and claimed_at is not null
     and claimed_at < now() - make_interval(secs => greatest(p_claim_ttl_seconds, 60));

  select *
    into v_task
    from public.jobcc_search_tasks
   where run_id = p_run_id
     and user_id = auth.uid()
     and status = 'queued'
     and attempts < max_attempts
   order by created_at asc, id asc
   for update skip locked
   limit 1;

  if not found then
    return null;
  end if;

  update public.jobcc_search_tasks
     set status = 'claimed',
         attempts = attempts + 1,
         claimed_at = now(),
         worker_id = p_worker_id,
         updated_at = now()
   where id = v_task.id
     and user_id = auth.uid()
   returning * into v_task;

  return v_task;
end;
$$;

grant execute on function public.jobcc_claim_next_search_task(text, text, integer) to authenticated;
