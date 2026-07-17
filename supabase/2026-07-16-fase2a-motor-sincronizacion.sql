-- Rafiki MF — Fase 2A: motor de sincronización manual

create table if not exists public.gmail_sync_candidates (
  id bigint generated always as identity primary key,
  gmail_message_id text not null unique,
  gmail_thread_id text,
  sync_run_id bigint references public.gmail_sync_runs(id) on delete set null,
  internal_date timestamptz,
  sender text,
  recipient text,
  subject text,
  snippet text,
  labels text[] not null default '{}',
  processing_status text not null default 'candidate' check (processing_status in ('candidate','ignored','processed','error')),
  raw_metadata jsonb not null default '{}'::jsonb,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gmail_sync_candidates_internal_date_idx on public.gmail_sync_candidates (internal_date desc);
create index if not exists gmail_sync_candidates_sync_run_idx on public.gmail_sync_candidates (sync_run_id);

drop trigger if exists trg_gmail_sync_candidates_updated_at on public.gmail_sync_candidates;
create trigger trg_gmail_sync_candidates_updated_at
before update on public.gmail_sync_candidates
for each row execute function public.set_updated_at();

alter table public.gmail_sync_candidates enable row level security;
drop policy if exists gmail_sync_candidates_select on public.gmail_sync_candidates;
create policy gmail_sync_candidates_select on public.gmail_sync_candidates
for select to authenticated using (public.is_active_app_user());

grant select on public.gmail_sync_candidates to authenticated;
