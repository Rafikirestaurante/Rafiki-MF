# Rafiki MF — Fase 3A.1

Versión: **1.3.2**  
Objetivo: aplicar ajustes operativos solicitados después de estabilizar la base 1.3.1, sin iniciar todavía la integración de Nequi de la Fase 3B.

## 1. Rafiki Empleados sin espera artificial de un minuto

Se eliminó del backend de `gmail-sync-now` el rate limit que rechazaba una segunda solicitud pública durante los 60 segundos posteriores a otra búsqueda. También se retiró el texto correspondiente de `/empleados`.

Se mantiene una protección distinta y necesaria: si ya existe una sincronización de Gmail con estado `running`, otra solicitud recibe una respuesta de sincronización en curso. Esto evita que dos procesos escriban simultáneamente sobre los mismos mensajes.

## 2. Alertas Bancolombia no reconocidas

Todo mensaje consultado desde `alertasynotificaciones@an.notificacionesbancolombia.com` continúa registrándose primero en `gmail_sync_candidates` antes de intentar extraer un movimiento.

Cuando el parser no reconoce el formato:

- no se inventa ni crea un movimiento financiero;
- el candidato queda con `processing_status = ignored`;
- `raw_metadata` conserva `source_detected = bancolombia`, `extraction_result = unsupported_notification`, `requires_review = true`, motivo, fecha de registro y versión del extractor;
- asunto, remitente, snippet, fecha y `gmail_message_id` permanecen disponibles en las columnas del candidato.

Si la extracción falla por un error técnico, el candidato queda con `processing_status = error`, `requires_review = true` y además se conserva el detalle en `processing_errors`.

## 3. Calendario histórico en Inicio

El panel Inicio incorpora un calendario mensual sin dependencias nuevas. Permite navegar por meses anteriores y seleccionar cualquier día hasta la fecha actual.

Por cada día muestra actividad de:

- movimientos bancarios;
- facturas electrónicas;
- alertas Bancolombia no reconocidas.

Al seleccionar una fecha se actualizan las métricas del día y aparece un detalle con movimientos, facturas y alertas pendientes de revisión. Los datos se consultan directamente desde Supabase usando las tablas ya existentes.

## Base de datos

**No requiere una nueva migración SQL.** La funcionalidad utiliza `financial_movements`, `electronic_invoices` y `gmail_sync_candidates` existentes.

## Archivos principales modificados

- `supabase/functions/gmail-sync-now/index.ts`
- `src/pages/EmployeePublicPage.jsx`
- `src/pages/DashboardPage.jsx`
- `src/services/dashboardService.js`
- `src/utils/calendar.js`
- `src/styles/app.css`
- `src/config/appMetadata.js`
- documentación y validador del proyecto.
