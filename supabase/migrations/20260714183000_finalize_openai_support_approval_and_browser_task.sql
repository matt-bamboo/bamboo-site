-- Reconcile the completed OpenAI role-kit proof with one canonical actionable
-- approval and an explicitly preparation-only browser task.

update public.jobcc_approvals
set
  status = 'archived',
  record = coalesce(record, '{}'::jsonb) || jsonb_build_object(
    'superseded_by', 'approval-jobcc-d3snwc',
    'resolved_by_workflow_run_id', 'packet-1784065169839-openai-support-operations-manager',
    'resolution', 'official_source_verified',
    'actionable', false
  ),
  updated_at = now()
where id = 'jobcc-1hymlza'
  and job_id = 'resurfaced-5988b6dbf357b866fbe96e5e'
  and item_type = 'verify-job-source'
  and status = 'needs_manual_review';

update public.jobcc_browser_tasks
set
  record = coalesce(record, '{}'::jsonb) || jsonb_build_object(
    'workflow_run_id', 'packet-1784065169839-openai-support-operations-manager',
    'external_action_allowed', false,
    'preparation_only', true
  ),
  updated_at = now()
where id = 'jobcc-mpp4pa'
  and job_id = 'resurfaced-5988b6dbf357b866fbe96e5e';
