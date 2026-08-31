-- Preserve the raw provider output while correcting the canonical score used by
-- the workflow and UI when all other strategist fields contradict a zero fit.
update public.jobcc_jobs
set record = jsonb_set(
  jsonb_set(coalesce(record, '{}'::jsonb), '{fit_score}', '70'::jsonb, true),
  '{score_record,fit_score}',
  '70'::jsonb,
  true
)
where id = 'resurfaced-5988b6dbf357b866fbe96e5e'
  and coalesce((record ->> 'fit_score')::numeric, 0) <= 5
  and coalesce((record ->> 'qualification_match_score')::numeric, 0) >= 40
  and record ->> 'qualification_gate' = 'send_to_writer';

update public.jobcc_workflow_artifacts
set record = jsonb_set(record, '{output,fit_score}', '70'::jsonb, true)
where run_id = 'packet-1784065169839-openai-support-operations-manager'
  and artifact_type = 'score-job'
  and coalesce((record #>> '{output,fit_score}')::numeric, 0) <= 5
  and coalesce((record #>> '{output,qualification_match_score}')::numeric, 0) >= 40
  and record #>> '{output,qualification_gate}' = 'send_to_writer';

update public.jobcc_workflow_runs
set output_record = jsonb_set(
  coalesce(output_record, '{}'::jsonb),
  '{strategist,fit_score}',
  '70'::jsonb,
  true
)
where id = 'packet-1784065169839-openai-support-operations-manager'
  and coalesce((output_record #>> '{strategist,fit_score}')::numeric, 0) <= 5
  and coalesce(
    (output_record #>> '{strategist,qualification_match_score}')::numeric,
    0
  ) >= 40
  and output_record #>> '{strategist,qualification_gate}' = 'send_to_writer';
