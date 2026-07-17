-- Rafiki MF — Fase 2B.2
-- Acceso público controlado para empleados: últimos cinco movimientos,
-- sincronización restringida y confirmación operativa de pagos.

begin;

create table if not exists public.employee_public_access_settings (
  access_key text primary key default 'employees' check (access_key = 'employees'),
  username text not null,
  password_salt text not null,
  password_hash text not null,
  password_iterations integer not null default 120000 check (password_iterations >= 100000),
  token_secret text not null,
  enabled boolean not null default false,
  session_duration_minutes integer not null default 480 check (session_duration_minutes between 30 and 1440),
  session_version integer not null default 1,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_employee_public_access_settings_updated_at on public.employee_public_access_settings;
create trigger trg_employee_public_access_settings_updated_at
before update on public.employee_public_access_settings
for each row execute function public.set_updated_at();

create table if not exists public.employee_payment_confirmations (
  id bigint generated always as identity primary key,
  movement_id uuid not null unique references public.financial_movements(id) on delete cascade,
  employee_name text not null,
  note text not null default '',
  access_username text not null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists employee_payment_confirmations_confirmed_idx
  on public.employee_payment_confirmations (confirmed_at desc);

create table if not exists public.employee_public_access_log (
  id bigint generated always as identity primary key,
  action text not null check (action in ('login_success', 'login_failed', 'list_movements', 'confirm_payment', 'sync_requested', 'sync_rate_limited')),
  success boolean not null default true,
  client_key text,
  access_username text,
  movement_id uuid references public.financial_movements(id) on delete set null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists employee_public_access_log_action_created_idx
  on public.employee_public_access_log (action, created_at desc);
create index if not exists employee_public_access_log_client_created_idx
  on public.employee_public_access_log (client_key, created_at desc);

alter table public.employee_public_access_settings enable row level security;
alter table public.employee_payment_confirmations enable row level security;
alter table public.employee_public_access_log enable row level security;

-- Estas tablas solo se administran desde Edge Functions con service role.
revoke all on table public.employee_public_access_settings from anon, authenticated;
revoke all on table public.employee_payment_confirmations from anon, authenticated;
revoke all on table public.employee_public_access_log from anon, authenticated;

comment on table public.employee_public_access_settings is
  'Credenciales compartidas y parámetros del enlace público para empleados. Nunca se exponen por Data API.';
comment on table public.employee_payment_confirmations is
  'Confirmaciones operativas realizadas desde el enlace público de empleados.';
comment on table public.employee_public_access_log is
  'Auditoría y límites de frecuencia del acceso público de empleados.';

commit;
