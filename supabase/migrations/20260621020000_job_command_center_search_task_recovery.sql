-- Add explicit stale-task recovery metadata for Job Command Center search tasks.
-- This migration is additive and does not delete or rewrite existing search data.

alter table public.jobcc_search_tasks
  add column if not exists task_heartbeat_at timestamptz,
  add column if not exists task_timeout_at timestamptz,
  add column if not exists stale_detected_at timestamptz,
  add column if not exists recovery_attempt_count integer not null default 0,
  add column if not exists max_recovery_attempts integer not null default 2,
  add column if not exists stale_reason text,
  add column if not exists recovery_status text,
  add column if not exists lock_owner text,
  add column if not exists lock_expires_at timestamptz;

create index if not exists jobcc_search_tasks_recovery_idx
  on public.jobcc_search_tasks(run_id, status, task_heartbeat_at, lock_expires_at, updated_at);

create or replace function public.jobcc_recover_stale_search_tasks(
  p_run_id text,
  p_claim_ttl_seconds integer default 900
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_timeout_interval interval := make_interval(secs => greatest(p_claim_ttl_seconds, 60));
  v_requeued integer := 0;
  v_failed integer := 0;
begin
  with stale_requeue as (
    select id
      from public.jobcc_search_tasks
     where run_id = p_run_id
       and user_id = auth.uid()
       and status in ('claimed', 'running')
       and coalesce(task_heartbeat_at, claimed_at, started_at, updated_at) < now() - v_timeout_interval
       and attempts < max_attempts
       and recovery_attempt_count < max_recovery_attempts
     for update skip locked
  )
  update public.jobcc_search_tasks t
     set status = 'queued',
         claimed_at = null,
         worker_id = null,
         lock_owner = null,
         lock_expires_at = null,
         task_timeout_at = now(),
         stale_detected_at = now(),
         stale_reason = 'claim_ttl_expired',
         recovery_status = 'requeued_after_stale_timeout',
         recovery_attempt_count = recovery_attempt_count + 1,
         updated_at = now()
    from stale_requeue s
   where t.id = s.id;

  get diagnostics v_requeued = row_count;

  with stale_fail as (
    select id
      from public.jobcc_search_tasks
     where run_id = p_run_id
       and user_id = auth.uid()
       and status in ('claimed', 'running')
       and coalesce(task_heartbeat_at, claimed_at, started_at, updated_at) < now() - v_timeout_interval
       and (attempts >= max_attempts or recovery_attempt_count >= max_recovery_attempts)
     for update skip locked
  )
  update public.jobcc_search_tasks t
     set status = 'failed',
         claimed_at = null,
         worker_id = null,
         lock_owner = null,
         lock_expires_at = null,
         task_timeout_at = now(),
         stale_detected_at = now(),
         stale_reason = 'claim_ttl_expired',
         recovery_status = 'failed_after_stale_timeout',
         failed_at = coalesce(failed_at, now()),
         error = coalesce(nullif(error, ''), 'Search task exceeded stale recovery or max-attempt limit.'),
         updated_at = now()
    from stale_fail s
   where t.id = s.id;

  get diagnostics v_failed = row_count;

  return jsonb_build_object(
    'run_id', p_run_id,
    'stale_requeued', v_requeued,
    'stale_failed', v_failed,
    'claim_ttl_seconds', greatest(p_claim_ttl_seconds, 60)
  );
end;
$$;

grant execute on function public.jobcc_recover_stale_search_tasks(text, integer) to authenticated;

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
  v_ttl_seconds integer := greatest(p_claim_ttl_seconds, 60);
begin
  perform public.jobcc_recover_stale_search_tasks(p_run_id, v_ttl_seconds);

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
         task_heartbeat_at = now(),
         lock_owner = p_worker_id,
         lock_expires_at = now() + make_interval(secs => v_ttl_seconds),
         recovery_status = case
           when recovery_attempt_count > 0 then 'retry_claimed_after_recovery'
           else 'claimed'
         end,
         stale_reason = null,
         updated_at = now()
   where id = v_task.id
     and user_id = auth.uid()
   returning * into v_task;

  return v_task;
end;
$$;

grant execute on function public.jobcc_claim_next_search_task(text, text, integer) to authenticated;
