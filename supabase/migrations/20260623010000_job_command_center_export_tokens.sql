-- Additive private document export token table.
-- The browser mints a short-lived token only after auth and allowed-user checks.
-- The document-export Edge Function redeems the token and returns a file with
-- Content-Disposition headers, avoiding private static assets and URL secrets.

create table if not exists public.jobcc_export_tokens (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id text not null references public.jobcc_document_versions(id) on delete cascade,
  export_format text not null check (export_format in ('txt', 'docx', 'html', 'pdf')),
  token_hash text not null unique,
  file_name text not null default '',
  expires_at timestamptz not null,
  used_at timestamptz,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobcc_export_tokens_user_document_idx
  on public.jobcc_export_tokens(user_id, document_id, export_format, created_at desc);

create index if not exists jobcc_export_tokens_hash_idx
  on public.jobcc_export_tokens(token_hash);

create index if not exists jobcc_export_tokens_expiry_idx
  on public.jobcc_export_tokens(expires_at);

alter table public.jobcc_export_tokens enable row level security;

drop policy if exists jobcc_export_tokens_owner_all on public.jobcc_export_tokens;
create policy jobcc_export_tokens_owner_all
  on public.jobcc_export_tokens
  for all
  to authenticated
  using (user_id = auth.uid() and public.jobcc_is_allowed_user())
  with check (user_id = auth.uid() and public.jobcc_is_allowed_user());

grant select, insert, update, delete on public.jobcc_export_tokens to authenticated;
revoke all on public.jobcc_export_tokens from anon;

drop trigger if exists jobcc_export_tokens_touch_updated_at on public.jobcc_export_tokens;
create trigger jobcc_export_tokens_touch_updated_at
  before update on public.jobcc_export_tokens
  for each row execute function public.jobcc_touch_updated_at();
