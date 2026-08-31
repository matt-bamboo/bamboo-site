-- Add durable, incremental job identity and search-observation history.
-- Additive only: this migration does not rewrite existing jobs or search runs.
-- public.jobcc_jobs remains the current mutable projection consumed by the app.
--
-- An identity fingerprint answers "is this the same opening?" It must be derived
-- from stable identity evidence such as an ATS/requisition id, canonical URL, or
-- a versioned normalized company/title/location fallback. A material hash answers
-- "did the substance of this posting change?" It must exclude retrieval noise and
-- is comparable only with another material hash produced by the same hash version.
--
-- Accounting invariant: every seen observation receives exactly one classification,
-- so seen = new + changed + unchanged + suppressed. "Seen" is the total, not a
-- fifth classification. Suppressed observations count as seen but do not advance
-- the material baseline or mutate public.jobcc_jobs.

create table if not exists public.jobcc_job_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  projection_job_id text,
  fingerprint_version text not null default 'v1',
  identity_fingerprint text not null,
  canonical_company text not null default '',
  canonical_title text not null default '',
  canonical_location text not null default '',
  canonical_requisition_id text not null default '',
  canonical_source_url text not null default '',
  current_material_hash_version text,
  current_material_hash text,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  last_material_change_at timestamptz,
  seen_count bigint not null default 0,
  new_count bigint not null default 0,
  changed_count bigint not null default 0,
  unchanged_count bigint not null default 0,
  suppressed_count bigint not null default 0,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobcc_job_identities_id_user_key unique (id, user_id),
  constraint jobcc_job_identities_fingerprint_version_check check (
    octet_length(btrim(fingerprint_version)) between 1 and 64
  ),
  constraint jobcc_job_identities_fingerprint_check check (
    octet_length(btrim(identity_fingerprint)) between 1 and 512
  ),
  constraint jobcc_job_identities_projection_check check (
    projection_job_id is null or octet_length(btrim(projection_job_id)) between 1 and 512
  ),
  constraint jobcc_job_identities_material_hash_pair_check check (
    (current_material_hash is null and current_material_hash_version is null)
    or (
      current_material_hash is not null
      and current_material_hash_version is not null
      and octet_length(btrim(current_material_hash)) between 1 and 512
      and octet_length(btrim(current_material_hash_version)) between 1 and 64
    )
  ),
  constraint jobcc_job_identities_seen_range_check check (
    seen_count >= 0
    and new_count >= 0
    and new_count <= 1
    and changed_count >= 0
    and unchanged_count >= 0
    and suppressed_count >= 0
  ),
  constraint jobcc_job_identities_accounting_check check (
    seen_count = new_count + changed_count + unchanged_count + suppressed_count
  ),
  constraint jobcc_job_identities_seen_order_check check (
    (first_seen_at is null and last_seen_at is null and last_material_change_at is null)
    or (
      first_seen_at is not null
      and last_seen_at is not null
      and first_seen_at <= last_seen_at
      and (last_material_change_at is null or last_material_change_at <= last_seen_at)
    )
  )
);

create table if not exists public.jobcc_job_identity_aliases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  identity_id uuid not null,
  fingerprint_version text not null default 'v1',
  alias_kind text not null,
  alias_fingerprint text not null,
  alias_value text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobcc_job_identity_aliases_identity_owner_fk
    foreign key (identity_id, user_id)
    references public.jobcc_job_identities(id, user_id)
    on delete cascade,
  constraint jobcc_job_identity_aliases_version_check check (
    octet_length(btrim(fingerprint_version)) between 1 and 64
  ),
  constraint jobcc_job_identity_aliases_kind_check check (
    octet_length(btrim(alias_kind)) between 1 and 64
  ),
  constraint jobcc_job_identity_aliases_fingerprint_check check (
    octet_length(btrim(alias_fingerprint)) between 1 and 512
  ),
  constraint jobcc_job_identity_aliases_value_check check (
    octet_length(btrim(alias_value)) >= 1
  ),
  constraint jobcc_job_identity_aliases_seen_order_check check (
    first_seen_at <= last_seen_at
  )
);

create table if not exists public.jobcc_job_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  identity_id uuid not null,
  idempotency_key text not null,
  search_run_id text,
  source_key text not null default '',
  source_url text not null default '',
  material_hash_version text not null,
  material_hash text not null,
  prior_material_hash_version text,
  prior_material_hash text,
  classification text not null,
  observed_at timestamptz not null default now(),
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobcc_job_observations_identity_owner_fk
    foreign key (identity_id, user_id)
    references public.jobcc_job_identities(id, user_id)
    on delete cascade,
  constraint jobcc_job_observations_idempotency_check check (
    octet_length(btrim(idempotency_key)) between 1 and 512
  ),
  constraint jobcc_job_observations_search_run_check check (
    search_run_id is null or octet_length(btrim(search_run_id)) between 1 and 512
  ),
  constraint jobcc_job_observations_material_version_check check (
    octet_length(btrim(material_hash_version)) between 1 and 64
  ),
  constraint jobcc_job_observations_material_hash_check check (
    octet_length(btrim(material_hash)) between 1 and 512
    and (
      (prior_material_hash is null and prior_material_hash_version is null)
      or (
        prior_material_hash is not null
        and prior_material_hash_version is not null
        and octet_length(btrim(prior_material_hash)) between 1 and 512
        and octet_length(btrim(prior_material_hash_version)) between 1 and 64
      )
    )
  ),
  constraint jobcc_job_observations_classification_check check (
    classification in ('new', 'changed', 'unchanged', 'suppressed')
  ),
  constraint jobcc_job_observations_classification_material_check check (
    classification = 'suppressed'
    or (
      classification = 'new'
      and prior_material_hash is null
      and prior_material_hash_version is null
    )
    or (
      classification = 'changed'
      and prior_material_hash is not null
      and prior_material_hash_version = material_hash_version
      and prior_material_hash <> material_hash
    )
    or (
      classification = 'unchanged'
      and prior_material_hash is not null
      and prior_material_hash_version = material_hash_version
      and prior_material_hash = material_hash
    )
  )
);

create table if not exists public.jobcc_job_suppressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  identity_id uuid not null,
  reason_code text not null default 'user_suppressed',
  reason_detail text not null default '',
  suppressed_at timestamptz not null default now(),
  restored_at timestamptz,
  restore_note text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobcc_job_suppressions_identity_owner_fk
    foreign key (identity_id, user_id)
    references public.jobcc_job_identities(id, user_id)
    on delete cascade,
  constraint jobcc_job_suppressions_reason_check check (
    octet_length(btrim(reason_code)) between 1 and 128
  ),
  constraint jobcc_job_suppressions_restore_order_check check (
    restored_at is null or restored_at >= suppressed_at
  )
);

create table if not exists public.jobcc_source_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cache_key_version text not null default 'v1',
  cache_key text not null,
  source_kind text not null default '',
  source_url text not null default '',
  request_fingerprint text not null default '',
  response_status integer,
  response_headers jsonb not null default '{}'::jsonb,
  payload jsonb,
  payload_hash text,
  etag text not null default '',
  last_modified text not null default '',
  fetched_at timestamptz not null default now(),
  expires_at timestamptz,
  last_accessed_at timestamptz not null default now(),
  failure_count integer not null default 0,
  last_error text not null default '',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobcc_source_cache_key_version_check check (
    octet_length(btrim(cache_key_version)) between 1 and 64
  ),
  constraint jobcc_source_cache_key_check check (
    octet_length(btrim(cache_key)) between 1 and 512
  ),
  constraint jobcc_source_cache_source_kind_check check (
    octet_length(source_kind) <= 128
  ),
  constraint jobcc_source_cache_status_check check (
    response_status is null or response_status between 100 and 599
  ),
  constraint jobcc_source_cache_payload_hash_check check (
    payload_hash is null or octet_length(btrim(payload_hash)) between 1 and 512
  ),
  constraint jobcc_source_cache_failure_count_check check (failure_count >= 0)
);

-- Fingerprints and bounded idempotency/cache keys are indexed; raw URLs, payloads,
-- and potentially long alias values deliberately are not.
create unique index if not exists jobcc_job_identities_user_fingerprint_uidx
  on public.jobcc_job_identities(user_id, fingerprint_version, identity_fingerprint);

create unique index if not exists jobcc_job_identities_user_projection_uidx
  on public.jobcc_job_identities(user_id, projection_job_id)
  where projection_job_id is not null;

create index if not exists jobcc_job_identities_user_seen_idx
  on public.jobcc_job_identities(user_id, last_seen_at desc nulls last);

create unique index if not exists jobcc_job_identity_aliases_user_fingerprint_uidx
  on public.jobcc_job_identity_aliases(user_id, fingerprint_version, alias_fingerprint);

create index if not exists jobcc_job_identity_aliases_user_identity_idx
  on public.jobcc_job_identity_aliases(user_id, identity_id, last_seen_at desc);

create unique index if not exists jobcc_job_observations_user_idempotency_uidx
  on public.jobcc_job_observations(user_id, idempotency_key);

create index if not exists jobcc_job_observations_user_identity_seen_idx
  on public.jobcc_job_observations(user_id, identity_id, observed_at desc);

create index if not exists jobcc_job_observations_user_run_class_idx
  on public.jobcc_job_observations(user_id, search_run_id, classification)
  where search_run_id is not null;

create unique index if not exists jobcc_job_suppressions_user_active_uidx
  on public.jobcc_job_suppressions(user_id, identity_id)
  where restored_at is null;

create index if not exists jobcc_job_suppressions_user_history_idx
  on public.jobcc_job_suppressions(user_id, identity_id, suppressed_at desc);

create unique index if not exists jobcc_source_cache_user_key_uidx
  on public.jobcc_source_cache(user_id, cache_key_version, cache_key);

create index if not exists jobcc_source_cache_user_expiry_idx
  on public.jobcc_source_cache(user_id, expires_at);

create index if not exists jobcc_source_cache_user_source_idx
  on public.jobcc_source_cache(user_id, source_kind, fetched_at desc);

comment on table public.jobcc_job_identities is
  'Stable per-user openings. public.jobcc_jobs remains the mutable current projection.';
comment on column public.jobcc_job_identities.identity_fingerprint is
  'Versioned stable opening identity; it must not change merely because posting content changed.';
comment on column public.jobcc_job_identities.current_material_hash is
  'Latest non-suppressed material-content hash; compare only within current_material_hash_version.';
comment on column public.jobcc_job_identities.projection_job_id is
  'Soft per-user link to public.jobcc_jobs; application code owns projection synchronization and ownership validation.';
comment on table public.jobcc_job_identity_aliases is
  'Alternate requisition, ATS, URL, or normalized keys mapped to one stable identity.';
comment on table public.jobcc_job_observations is
  'Append-oriented search history. Each row is exactly one of new, changed, unchanged, or suppressed.';
comment on column public.jobcc_job_observations.idempotency_key is
  'Bounded application-generated retry key, normally derived from search run, source, and source result identity.';
comment on column public.jobcc_job_observations.material_hash is
  'Versioned hash of materially relevant posting content, not a stable opening identity.';
comment on table public.jobcc_job_suppressions is
  'Historical suppression intervals; at most one interval per identity may be active.';
comment on table public.jobcc_source_cache is
  'Per-user current source cache for conditional retrieval and bounded reuse; observations remain the durable history.';
comment on column public.jobcc_source_cache.payload_hash is
  'Optional transport/payload hash. It is not automatically an identity fingerprint or material hash.';

do $$
declare
  v_table_name text;
begin
  foreach v_table_name in array array[
    'jobcc_job_identities',
    'jobcc_job_identity_aliases',
    'jobcc_job_observations',
    'jobcc_job_suppressions',
    'jobcc_source_cache'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table_name);
    execute format('drop policy if exists %I on public.%I', v_table_name || '_owner_all', v_table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (user_id = auth.uid() and public.jobcc_is_allowed_user()) with check (user_id = auth.uid() and public.jobcc_is_allowed_user())',
      v_table_name || '_owner_all',
      v_table_name
    );
    execute format('grant select, insert, update, delete on public.%I to authenticated', v_table_name);
    execute format('revoke all on public.%I from anon', v_table_name);
    execute format('drop trigger if exists %I on public.%I', v_table_name || '_touch_updated_at', v_table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.jobcc_touch_updated_at()',
      v_table_name || '_touch_updated_at',
      v_table_name
    );
  end loop;
end $$;

create or replace function public.jobcc_suppress_job_identity(
  p_identity_id uuid,
  p_reason_code text default 'user_suppressed',
  p_reason_detail text default '',
  p_record jsonb default '{}'::jsonb
)
returns public.jobcc_job_suppressions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_identity public.jobcc_job_identities%rowtype;
  v_suppression public.jobcc_job_suppressions%rowtype;
  v_reason_code text := coalesce(nullif(btrim(p_reason_code), ''), 'user_suppressed');
begin
  if v_user_id is null or not public.jobcc_is_allowed_user() then
    raise exception 'Job Command Center access is not allowed.' using errcode = '42501';
  end if;

  if octet_length(v_reason_code) > 128 then
    raise exception 'Suppression reason_code must be at most 128 bytes.' using errcode = '22023';
  end if;

  select *
    into v_identity
    from public.jobcc_job_identities
   where id = p_identity_id
     and user_id = v_user_id
   for update;

  if not found then
    raise exception 'Job identity % was not found for the current user.', p_identity_id
      using errcode = '23503';
  end if;

  select *
    into v_suppression
    from public.jobcc_job_suppressions
   where identity_id = p_identity_id
     and user_id = v_user_id
     and restored_at is null
   order by suppressed_at desc, id desc
   limit 1;

  if found then
    return v_suppression;
  end if;

  insert into public.jobcc_job_suppressions (
    user_id,
    identity_id,
    reason_code,
    reason_detail,
    record
  )
  values (
    v_user_id,
    p_identity_id,
    v_reason_code,
    coalesce(p_reason_detail, ''),
    coalesce(p_record, '{}'::jsonb)
  )
  returning * into v_suppression;

  return v_suppression;
end;
$$;

create or replace function public.jobcc_restore_job_identity(
  p_identity_id uuid,
  p_suppression_id uuid default null,
  p_restore_note text default ''
)
returns public.jobcc_job_suppressions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_identity public.jobcc_job_identities%rowtype;
  v_suppression public.jobcc_job_suppressions%rowtype;
begin
  if v_user_id is null or not public.jobcc_is_allowed_user() then
    raise exception 'Job Command Center access is not allowed.' using errcode = '42501';
  end if;

  select *
    into v_identity
    from public.jobcc_job_identities
   where id = p_identity_id
     and user_id = v_user_id
   for update;

  if not found then
    raise exception 'Job identity % was not found for the current user.', p_identity_id
      using errcode = '23503';
  end if;

  select *
    into v_suppression
    from public.jobcc_job_suppressions
   where identity_id = p_identity_id
     and user_id = v_user_id
     and (p_suppression_id is null or id = p_suppression_id)
     and restored_at is null
   order by suppressed_at desc, id desc
   limit 1
   for update;

  if found then
    update public.jobcc_job_suppressions
       set restored_at = now(),
           restore_note = coalesce(p_restore_note, '')
     where id = v_suppression.id
       and user_id = v_user_id
     returning * into v_suppression;

    return v_suppression;
  end if;

  -- An explicit suppression id makes retries safe even if the identity was later
  -- suppressed again. Without one, return the latest prior interval idempotently.
  select *
    into v_suppression
    from public.jobcc_job_suppressions
   where identity_id = p_identity_id
     and user_id = v_user_id
     and (p_suppression_id is null or id = p_suppression_id)
   order by suppressed_at desc, id desc
   limit 1;

  return v_suppression;
end;
$$;

create or replace function public.jobcc_record_job_observation(
  p_identity_id uuid,
  p_idempotency_key text,
  p_material_hash text,
  p_material_hash_version text default 'v1',
  p_search_run_id text default null,
  p_source_key text default '',
  p_source_url text default '',
  p_observed_at timestamptz default now(),
  p_record jsonb default '{}'::jsonb
)
returns public.jobcc_job_observations
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_identity public.jobcc_job_identities%rowtype;
  v_observation public.jobcc_job_observations%rowtype;
  v_observed_at timestamptz := coalesce(p_observed_at, now());
  v_idempotency_key text := btrim(coalesce(p_idempotency_key, ''));
  v_material_hash text := btrim(coalesce(p_material_hash, ''));
  v_material_hash_version text := btrim(coalesce(p_material_hash_version, ''));
  v_search_run_id text := nullif(btrim(coalesce(p_search_run_id, '')), '');
  v_classification text;
  v_prior_material_hash text;
  v_prior_material_hash_version text;
  v_is_suppressed boolean;
begin
  if v_user_id is null or not public.jobcc_is_allowed_user() then
    raise exception 'Job Command Center access is not allowed.' using errcode = '42501';
  end if;

  if octet_length(v_idempotency_key) not between 1 and 512 then
    raise exception 'Observation idempotency_key must be between 1 and 512 bytes.'
      using errcode = '22023';
  end if;

  if octet_length(v_material_hash) not between 1 and 512 then
    raise exception 'Observation material_hash must be between 1 and 512 bytes.'
      using errcode = '22023';
  end if;

  if octet_length(v_material_hash_version) not between 1 and 64 then
    raise exception 'Observation material_hash_version must be between 1 and 64 bytes.'
      using errcode = '22023';
  end if;

  select *
    into v_observation
    from public.jobcc_job_observations
   where user_id = v_user_id
     and idempotency_key = v_idempotency_key;

  if found then
    if v_observation.identity_id <> p_identity_id
       or v_observation.material_hash <> v_material_hash
       or v_observation.material_hash_version <> v_material_hash_version then
      raise exception 'Observation idempotency_key was reused with different identity or material content.'
        using errcode = '22023';
    end if;
    return v_observation;
  end if;

  -- Serialize classification per identity so two search workers cannot both call
  -- the same opening new or race the current material baseline.
  select *
    into v_identity
    from public.jobcc_job_identities
   where id = p_identity_id
     and user_id = v_user_id
   for update;

  if not found then
    raise exception 'Job identity % was not found for the current user.', p_identity_id
      using errcode = '23503';
  end if;

  -- Recheck after taking the identity lock to make concurrent retries idempotent.
  select *
    into v_observation
    from public.jobcc_job_observations
   where user_id = v_user_id
     and idempotency_key = v_idempotency_key;

  if found then
    if v_observation.identity_id <> p_identity_id
       or v_observation.material_hash <> v_material_hash
       or v_observation.material_hash_version <> v_material_hash_version then
      raise exception 'Observation idempotency_key was reused with different identity or material content.'
        using errcode = '22023';
    end if;
    return v_observation;
  end if;

  if v_identity.last_seen_at is not null and v_observed_at < v_identity.last_seen_at then
    raise exception 'Out-of-order observation would move identity history backward.'
      using errcode = '22023';
  end if;

  select exists (
    select 1
      from public.jobcc_job_suppressions suppression
     where suppression.user_id = v_user_id
       and suppression.identity_id = p_identity_id
       and suppression.suppressed_at <= v_observed_at
       and (suppression.restored_at is null or v_observed_at < suppression.restored_at)
  ) into v_is_suppressed;

  v_prior_material_hash := v_identity.current_material_hash;
  v_prior_material_hash_version := v_identity.current_material_hash_version;

  if v_is_suppressed then
    v_classification := 'suppressed';
  else
    if v_identity.current_material_hash is not null
       and v_identity.current_material_hash_version <> v_material_hash_version then
      raise exception 'Material hash version mismatch; explicitly rebaseline before comparing versions.'
        using errcode = '22023';
    end if;

    if v_identity.current_material_hash is null then
      v_classification := 'new';
    elsif v_identity.current_material_hash <> v_material_hash then
      v_classification := 'changed';
    else
      v_classification := 'unchanged';
    end if;
  end if;

  insert into public.jobcc_job_observations (
    user_id,
    identity_id,
    idempotency_key,
    search_run_id,
    source_key,
    source_url,
    material_hash_version,
    material_hash,
    prior_material_hash_version,
    prior_material_hash,
    classification,
    observed_at,
    record
  )
  values (
    v_user_id,
    p_identity_id,
    v_idempotency_key,
    v_search_run_id,
    coalesce(p_source_key, ''),
    coalesce(p_source_url, ''),
    v_material_hash_version,
    v_material_hash,
    v_prior_material_hash_version,
    v_prior_material_hash,
    v_classification,
    v_observed_at,
    coalesce(p_record, '{}'::jsonb)
  )
  returning * into v_observation;

  update public.jobcc_job_identities
     set first_seen_at = coalesce(first_seen_at, v_observed_at),
         last_seen_at = v_observed_at,
         last_material_change_at = case
           when v_classification in ('new', 'changed') then v_observed_at
           else last_material_change_at
         end,
         current_material_hash_version = case
           when v_classification in ('new', 'changed') then v_material_hash_version
           else current_material_hash_version
         end,
         current_material_hash = case
           when v_classification in ('new', 'changed') then v_material_hash
           else current_material_hash
         end,
         seen_count = seen_count + 1,
         new_count = new_count + case when v_classification = 'new' then 1 else 0 end,
         changed_count = changed_count + case when v_classification = 'changed' then 1 else 0 end,
         unchanged_count = unchanged_count + case when v_classification = 'unchanged' then 1 else 0 end,
         suppressed_count = suppressed_count + case when v_classification = 'suppressed' then 1 else 0 end
   where id = p_identity_id
     and user_id = v_user_id;

  return v_observation;
end;
$$;

revoke all on function public.jobcc_suppress_job_identity(uuid, text, text, jsonb) from public, anon;
revoke all on function public.jobcc_restore_job_identity(uuid, uuid, text) from public, anon;
revoke all on function public.jobcc_record_job_observation(uuid, text, text, text, text, text, text, timestamptz, jsonb) from public, anon;

grant execute on function public.jobcc_suppress_job_identity(uuid, text, text, jsonb) to authenticated;
grant execute on function public.jobcc_restore_job_identity(uuid, uuid, text) to authenticated;
grant execute on function public.jobcc_record_job_observation(uuid, text, text, text, text, text, text, timestamptz, jsonb) to authenticated;

comment on function public.jobcc_suppress_job_identity(uuid, text, text, jsonb) is
  'Idempotently opens one active suppression interval for an owned job identity.';
comment on function public.jobcc_restore_job_identity(uuid, uuid, text) is
  'Closes an owned suppression interval; pass its id to make delayed retries unambiguous.';
comment on function public.jobcc_record_job_observation(uuid, text, text, text, text, text, text, timestamptz, jsonb) is
  'Atomically and idempotently records one seen observation and classifies it as new, changed, unchanged, or suppressed.';
