-- Rafiki MF — Fase 2B.1
-- Fecha y hora del movimiento, orden cronológico y sincronización desde Movimientos.

alter table public.financial_movements
  add column if not exists transaction_at timestamptz;

-- Los registros existentes usan la hora de recepción como respaldo.
update public.financial_movements
set transaction_at = coalesce(
  email_received_at,
  transaction_date::timestamp at time zone 'America/Bogota'
)
where transaction_at is null;

alter table public.financial_movements
  alter column transaction_at set not null;

create index if not exists financial_movements_transaction_at_idx
  on public.financial_movements (transaction_at desc);

comment on column public.financial_movements.transaction_at is
  'Fecha y hora del movimiento. Se extrae del correo cuando existe; de lo contrario usa la recepción del mensaje como respaldo.';
