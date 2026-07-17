-- Rafiki Movimientos y Facturas
-- Fase 1A - Base independiente, autenticación, roles, documentación y Gmail OAuth.
-- Ejecutar en un proyecto Supabase NUEVO. No usar el proyecto de Rafiki Pedidos.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Usuarios y roles
-- ---------------------------------------------------------------------------
create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null default '',
  role text not null default 'reviewer' check (role in ('admin', 'reviewer')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_app_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  -- Evita dos primeros administradores por registros simultáneos.
  perform pg_advisory_xact_lock(72634101);

  if exists (select 1 from public.app_users where role = 'admin' and status = 'active') then
    assigned_role := 'reviewer';
  else
    assigned_role := 'admin';
  end if;

  insert into public.app_users (id, email, display_name, role, status)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')),
    assigned_role,
    'active'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Crear perfiles para usuarios existentes antes de instalar el trigger.
insert into public.app_users (id, email, display_name, role, status)
select
  u.id,
  lower(coalesce(u.email, '')),
  trim(coalesce(u.raw_user_meta_data ->> 'display_name', '')),
  case
    when not exists (select 1 from public.app_users where role = 'admin' and status = 'active')
     and row_number() over (order by u.created_at, u.id) = 1
    then 'admin'
    else 'reviewer'
  end,
  'active'
from auth.users u
where not exists (select 1 from public.app_users au where au.id = u.id)
on conflict (id) do nothing;

drop trigger if exists on_auth_user_created_documental on auth.users;
create trigger on_auth_user_created_documental
after insert on auth.users
for each row execute function public.handle_new_app_user();

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

create or replace function public.is_active_app_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_users
    where id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_users
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

revoke all on function public.is_active_app_user() from public, anon;
revoke all on function public.is_app_admin() from public, anon;
grant execute on function public.is_active_app_user() to authenticated;
grant execute on function public.is_app_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Datos documentales (sin integración con Caja, Cartera, Gastos o Pedidos)
-- ---------------------------------------------------------------------------
create table if not exists public.financial_movements (
  id uuid primary key default gen_random_uuid(),
  gmail_message_id text not null,
  gmail_thread_id text,
  source text not null check (source in ('bancolombia', 'nequi', 'other')),
  movement_type text not null check (movement_type in ('income', 'transfer', 'card_purchase', 'service_payment', 'unknown')),
  transaction_date date not null,
  email_received_at timestamptz,
  detail text not null default '',
  amount_cop bigint not null check (amount_cop >= 0),
  sender_email text,
  email_subject text,
  extraction_confidence text not null default 'high' check (extraction_confidence in ('high', 'medium', 'low')),
  extractor_version text not null default 'pending',
  raw_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gmail_message_id, movement_type)
);

create index if not exists financial_movements_date_idx on public.financial_movements (transaction_date desc);
create index if not exists financial_movements_source_idx on public.financial_movements (source);

drop trigger if exists trg_financial_movements_updated_at on public.financial_movements;
create trigger trg_financial_movements_updated_at
before update on public.financial_movements
for each row execute function public.set_updated_at();

create table if not exists public.electronic_invoices (
  id uuid primary key default gen_random_uuid(),
  gmail_message_id text not null,
  gmail_thread_id text,
  attachment_id text,
  document_type text not null default 'invoice' check (document_type in ('invoice', 'credit_note', 'debit_note', 'attached_document', 'unknown')),
  invoice_date date,
  due_date date,
  supplier_name text not null default '',
  supplier_tax_id text not null default '',
  invoice_number text not null default '',
  cufe text,
  currency text not null default 'COP',
  subtotal_cop bigint,
  tax_cop bigint,
  total_cop bigint check (total_cop is null or total_cop >= 0),
  attachment_name text,
  document_status text not null default 'pending' check (document_status in ('pending', 'reviewed', 'incomplete', 'duplicate', 'discarded', 'error')),
  reviewer_notes text not null default '',
  reviewed_by uuid references public.app_users(id) on delete set null,
  reviewed_at timestamptz,
  extractor_version text not null default 'pending',
  xml_fingerprint text,
  email_received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists electronic_invoices_cufe_unique
  on public.electronic_invoices (cufe)
  where cufe is not null and length(trim(cufe)) > 0;
create unique index if not exists electronic_invoices_supplier_number_unique
  on public.electronic_invoices (supplier_tax_id, invoice_number)
  where length(trim(supplier_tax_id)) > 0 and length(trim(invoice_number)) > 0;
create index if not exists electronic_invoices_date_idx on public.electronic_invoices (invoice_date desc);
create index if not exists electronic_invoices_status_idx on public.electronic_invoices (document_status);

drop trigger if exists trg_electronic_invoices_updated_at on public.electronic_invoices;
create trigger trg_electronic_invoices_updated_at
before update on public.electronic_invoices
for each row execute function public.set_updated_at();

create table if not exists public.daily_verifications (
  verification_date date primary key,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed_with_pending', 'completed')),
  movement_count integer not null default 0,
  income_total_cop bigint not null default 0,
  expense_total_cop bigint not null default 0,
  invoice_count integer not null default 0,
  pending_count integer not null default 0,
  general_notes text not null default '',
  closed_by uuid references public.app_users(id) on delete set null,
  closed_at timestamptz,
  reopened_by uuid references public.app_users(id) on delete set null,
  reopened_at timestamptz,
  reopen_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_daily_verifications_updated_at on public.daily_verifications;
create trigger trg_daily_verifications_updated_at
before update on public.daily_verifications
for each row execute function public.set_updated_at();

create table if not exists public.gmail_sync_runs (
  id bigint generated always as identity primary key,
  trigger_type text not null default 'manual' check (trigger_type in ('manual', 'scheduled', 'continuation')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'error')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  messages_scanned integer not null default 0,
  movements_created integer not null default 0,
  invoices_created integer not null default 0,
  duplicates_ignored integer not null default 0,
  errors_count integer not null default 0,
  continuation_token text,
  detail jsonb not null default '{}'::jsonb,
  requested_by uuid references public.app_users(id) on delete set null
);

create index if not exists gmail_sync_runs_started_idx on public.gmail_sync_runs (started_at desc);

create table if not exists public.processing_errors (
  id bigint generated always as identity primary key,
  sync_run_id bigint references public.gmail_sync_runs(id) on delete set null,
  gmail_message_id text,
  source text,
  stage text not null,
  error_message text not null,
  technical_detail jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  resolved_by uuid references public.app_users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists processing_errors_created_idx on public.processing_errors (created_at desc);

create table if not exists public.document_audit_log (
  id bigint generated always as identity primary key,
  entity_type text not null,
  entity_id text,
  action text not null,
  actor_user_id uuid references public.app_users(id) on delete set null,
  actor_email text,
  previous_data jsonb,
  new_data jsonb,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists document_audit_log_created_idx on public.document_audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- Infraestructura OAuth Gmail
-- ---------------------------------------------------------------------------
create table if not exists public.gmail_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists gmail_oauth_states_expires_idx on public.gmail_oauth_states (expires_at);

create table if not exists public.gmail_connections (
  connection_key text primary key default 'principal' check (connection_key = 'principal'),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  google_email text not null,
  google_history_id text,
  refresh_token_ciphertext text,
  refresh_token_iv text,
  granted_scope text not null default '',
  token_type text,
  status text not null default 'connected' check (status in ('connected', 'error', 'disconnected')),
  connected_at timestamptz not null default now(),
  last_verified_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_gmail_connections_updated_at on public.gmail_connections;
create trigger trg_gmail_connections_updated_at
before update on public.gmail_connections
for each row execute function public.set_updated_at();

create table if not exists public.gmail_integration_audit (
  id bigint generated always as identity primary key,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  google_email text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists gmail_integration_audit_created_idx on public.gmail_integration_audit (created_at desc);

create or replace function public.cleanup_gmail_oauth_states()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.gmail_oauth_states
  where expires_at < now() - interval '1 day'
     or used_at < now() - interval '1 day';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.app_users enable row level security;
alter table public.financial_movements enable row level security;
alter table public.electronic_invoices enable row level security;
alter table public.daily_verifications enable row level security;
alter table public.gmail_sync_runs enable row level security;
alter table public.processing_errors enable row level security;
alter table public.document_audit_log enable row level security;
alter table public.gmail_oauth_states enable row level security;
alter table public.gmail_connections enable row level security;
alter table public.gmail_integration_audit enable row level security;

drop policy if exists app_users_select_self_or_admin on public.app_users;
create policy app_users_select_self_or_admin on public.app_users
for select to authenticated
using (id = auth.uid() or public.is_app_admin());

drop policy if exists app_users_admin_update on public.app_users;
create policy app_users_admin_update on public.app_users
for update to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

-- Los usuarios activos pueden consultar y verificar datos documentales.
-- Las políticas se declaran explícitamente para mantener compatibilidad SQL.

drop policy if exists financial_movements_select on public.financial_movements;
create policy financial_movements_select on public.financial_movements for select to authenticated using (public.is_active_app_user());
drop policy if exists financial_movements_update on public.financial_movements;
create policy financial_movements_update on public.financial_movements for update to authenticated using (public.is_active_app_user()) with check (public.is_active_app_user());

drop policy if exists electronic_invoices_select on public.electronic_invoices;
create policy electronic_invoices_select on public.electronic_invoices for select to authenticated using (public.is_active_app_user());
drop policy if exists electronic_invoices_update on public.electronic_invoices;
create policy electronic_invoices_update on public.electronic_invoices for update to authenticated using (public.is_active_app_user()) with check (public.is_active_app_user());

drop policy if exists daily_verifications_select on public.daily_verifications;
create policy daily_verifications_select on public.daily_verifications for select to authenticated using (public.is_active_app_user());
drop policy if exists daily_verifications_write on public.daily_verifications;
create policy daily_verifications_write on public.daily_verifications for all to authenticated using (public.is_active_app_user()) with check (public.is_active_app_user());

drop policy if exists gmail_sync_runs_select on public.gmail_sync_runs;
create policy gmail_sync_runs_select on public.gmail_sync_runs for select to authenticated using (public.is_active_app_user());

drop policy if exists processing_errors_select on public.processing_errors;
create policy processing_errors_select on public.processing_errors for select to authenticated using (public.is_active_app_user());

drop policy if exists document_audit_admin_select on public.document_audit_log;
create policy document_audit_admin_select on public.document_audit_log for select to authenticated using (public.is_app_admin());

-- OAuth y tokens: solamente Edge Functions con service role.
revoke all on table public.gmail_oauth_states from anon, authenticated;
revoke all on table public.gmail_connections from anon, authenticated;
revoke all on table public.gmail_integration_audit from anon, authenticated;
revoke all on function public.cleanup_gmail_oauth_states() from public, anon, authenticated;

-- La Data API sí debe poder consultar las tablas documentales según RLS.
grant select, update on public.app_users to authenticated;
grant select, update on public.financial_movements to authenticated;
grant select, update on public.electronic_invoices to authenticated;
grant select, insert, update on public.daily_verifications to authenticated;
grant select on public.gmail_sync_runs to authenticated;
grant select on public.processing_errors to authenticated;
grant select on public.document_audit_log to authenticated;

commit;
