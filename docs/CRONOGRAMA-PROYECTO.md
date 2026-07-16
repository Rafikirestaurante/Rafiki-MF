# Cronograma — Rafiki Movimientos y Facturas

## Fase 1 — Base independiente

### 1A — Estructura inicial

- React + Vite.
- Supabase independiente.
- Autenticación y roles.
- Diseño adaptable.
- Tablas documentales.
- Infraestructura OAuth Gmail.

### 1B — Administración de usuarios

- Crear y desactivar revisores.
- Cambiar roles.
- Auditoría administrativa.
- Recuperación de contraseña.

## Fase 2 — Gmail API

- Conexión real.
- Pruebas de renovación del token.
- Ejecución manual.
- Historial de sincronizaciones.
- Diagnóstico y reintentos.

## Fase 3 — Movimientos bancarios

- Bancolombia: ingresos, transferencias y compras.
- Nequi: ingresos, envíos y pagos.
- Control por ID de mensaje.
- Posibles duplicados.
- Corrección manual.

## Fase 4 — Facturación electrónica

- Lectura de ZIP.
- XML de factura, nota crédito y nota débito.
- Proveedor, NIT, número, CUFE y valores.
- Documentos incompletos y duplicados.

## Fase 5 — Verificación diaria

- Estados de revisión.
- Totales informativos.
- Cierre documental.
- Reapertura con motivo.
- Auditoría.

## Fase 6 — Historial y automatización

- Cron de Supabase.
- Filtros por rango.
- Exportación Excel.
- Alertas de error.
- Informes documentales.
