-- Rafiki MF — Fase 2B: extractor de movimientos Bancolombia
-- Ejecutar después de 2026-07-16-fase2a-motor-sincronizacion.sql.

begin;

alter table public.financial_movements
  add column if not exists reference_text text not null default '',
  add column if not exists source_metadata jsonb not null default '{}'::jsonb;

create index if not exists financial_movements_fingerprint_idx
  on public.financial_movements (raw_fingerprint)
  where raw_fingerprint is not null;

create index if not exists financial_movements_received_idx
  on public.financial_movements (email_received_at desc);

comment on column public.financial_movements.reference_text is
  'Referencia, comprobante o código identificado en la alerta bancaria.';
comment on column public.financial_movements.source_metadata is
  'Metadatos técnicos del extractor sin almacenar el cuerpo completo del correo.';

commit;
