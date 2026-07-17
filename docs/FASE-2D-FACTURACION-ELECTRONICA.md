# Fase 2D — Facturación electrónica

Versión: **1.3.0**

## Alcance

- Nueva Edge Function `gmail-sync-invoices`.
- Búsqueda reciente de siete días y búsqueda histórica por rango.
- Detección de correos con adjuntos ZIP, XML o PDF.
- Descompresión de ZIP y lectura de XML UBL 2.1.
- Extracción de tipo documental, fecha, vencimiento, proveedor, NIT, número, CUFE, moneda, subtotal, impuestos y total.
- Control de duplicados por CUFE, proveedor+número y huella documental.
- PDF sin XML: registro incompleto usando asunto, nombre de archivo, remitente y texto del correo.
- Acceso al correo original desde la tabla de facturas.
- No se almacenan los archivos completos ni el contenido íntegro del XML/PDF en la base de datos.

## Límites preventivos

- Máximo 150 correos por ejecución.
- Máximo 15 MB por adjunto comprimido.
- Máximo 30 MB descomprimidos por ZIP.
- Se procesan únicamente XML reconocidos como Invoice, CreditNote, DebitNote o AttachedDocument.

## Instalación

1. Ejecutar `supabase/2026-07-17-fase2d-facturacion-electronica.sql`.
2. Subir el proyecto a GitHub.
3. Confirmar el despliegue de `gmail-sync-invoices` en GitHub Actions y Supabase.
4. Esperar Vercel y abrir Facturas.
