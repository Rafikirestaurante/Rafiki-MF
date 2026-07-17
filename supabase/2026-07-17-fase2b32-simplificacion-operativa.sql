-- Rafiki MF — Fase 2B.3.2
-- Simplificación de movimientos y retiro del flujo de revisión.

begin;

drop index if exists public.financial_movements_status_idx;

alter table public.financial_movements
  drop column if exists extraction_status,
  drop column if exists reviewer_notes,
  drop column if exists reviewed_by,
  drop column if exists reviewed_at;

commit;
