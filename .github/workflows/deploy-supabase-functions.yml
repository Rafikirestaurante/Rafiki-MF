-- Rafiki MF 1.3.0 — Fase 2D: facturación electrónica

alter table public.electronic_invoices
  add column if not exists document_key text,
  add column if not exists sender_email text not null default '',
  add column if not exists email_subject text not null default '',
  add column if not exists attachment_mime_type text not null default '',
  add column if not exists source_file_type text not null default 'unknown',
  add column if not exists source_metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'electronic_invoices_source_file_type_check'
      and conrelid = 'public.electronic_invoices'::regclass
  ) then
    alter table public.electronic_invoices
      add constraint electronic_invoices_source_file_type_check
      check (source_file_type in ('zip','xml','pdf','unknown'));
  end if;
end $$;

create unique index if not exists electronic_invoices_document_key_unique
  on public.electronic_invoices (document_key)
  where document_key is not null and length(trim(document_key)) > 0;

create index if not exists electronic_invoices_received_at_idx
  on public.electronic_invoices (email_received_at desc);

create index if not exists electronic_invoices_supplier_idx
  on public.electronic_invoices (supplier_name);

comment on column public.electronic_invoices.document_key is 'Huella única del correo, adjunto y documento detectado.';
comment on column public.electronic_invoices.source_file_type is 'Formato fuente utilizado para la extracción: ZIP, XML o PDF.';
comment on column public.electronic_invoices.source_metadata is 'Metadatos técnicos de extracción sin almacenar el contenido completo del documento.';
