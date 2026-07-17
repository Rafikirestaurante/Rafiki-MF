# Fase 2B.3.1 — Corrección del diagnóstico y comunicación con Edge Functions

## Problema corregido

La pantalla Configuración cargaba el estado de Gmail, el historial y el acceso de empleados mediante `Promise.all`. Si una sola llamada fallaba, toda la carga se detenía, el estado visual permanecía en su valor inicial “Sin conectar” y se mostraba únicamente `Failed to send a request to the Edge Function`.

Además, el diagnóstico dependía de `gmail-diagnostics`. Cuando el fallo era de transporte o CORS, el propio diagnosticador tampoco podía responder.

## Cambios

- Carga independiente con `Promise.allSettled`.
- El estado “No disponible” se diferencia de “Sin conectar”.
- Diagnóstico local del navegador cuando la función remota no responde.
- Se muestran función afectada, categoría, origen del navegador, endpoint y estado de conectividad.
- Mensajes diferenciados para transporte/CORS, relay, HTTP y errores de aplicación.
- CORS compartido refleja cualquier origen HTTP/HTTPS de la solicitud. La seguridad continúa dependiendo del JWT administrativo o del token público propio, no de CORS.
- El botón de diagnóstico permanece disponible incluso cuando no puede cargarse el estado de Gmail.

## Despliegue

No requiere SQL. Deben redesplegarse todas las Edge Functions porque el archivo `_shared/cors.ts` se empaqueta dentro de cada función al desplegarla.
