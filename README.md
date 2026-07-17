# Rafiki Movimientos y Facturas

Aplicación independiente para documentar movimientos bancarios detectados en Gmail, registrar facturas electrónicas y realizar una verificación manual al finalizar el día.

## Versión

**1.2.1 — Fase 2B.1: fecha, hora, último movimiento y sincronización directa**

## Alcance de esta entrega

- React 18 + Vite con diseño adaptable a celular y computador.
- PWA interna instalable.
- Autenticación Supabase por correo y contraseña.
- Roles `admin` y `reviewer`.
- La primera cuenta registrada queda como Administrador.
- Módulos: Inicio, Movimientos, Facturas y Configuración.
- Supabase independiente y separado de Rafiki Pedidos.
- OAuth 2.0 de Gmail con permiso de solo lectura.
- Refresh token cifrado con AES-256-GCM.
- Sincronización manual por rango de fechas.
- Registro técnico de candidatos de Gmail.
- Extractor Bancolombia para ingresos, transferencias y compras con tarjeta.
- Normalización de fecha, hora, valores COP, detalle y referencia.
- Último movimiento siempre visible y listado ordenado del más reciente al más antiguo.
- Botón de sincronización disponible dentro del módulo Movimientos.
- Control primario de duplicados por `gmail_message_id + movement_type`.
- Visualización de movimientos y resumen informativo del día.

## Pendiente para próximas etapas

- Extractor Nequi.
- Lectura de ZIP, XML y PDF de facturación electrónica.
- Control definitivo de duplicados.
- Edición de estados, observaciones y verificación diaria.

La aplicación no afecta Caja, Cartera, Gastos ni Pedidos y no utiliza el proyecto Supabase de Rafiki Pedidos.

## Instalación rápida

1. Ejecuta los SQL en orden:
   - `supabase/2026-07-14-fase1a-base-independiente.sql`
   - `supabase/2026-07-16-fase2a-motor-sincronizacion.sql`
   - `supabase/2026-07-16-fase2b-bancolombia.sql`
   - `supabase/2026-07-16-fase2b1-fecha-hora-sincronizacion-movimientos.sql`
2. Copia `.env.example` como `.env` y configura Supabase.
3. Instala dependencias con `npm install --package-lock=false`.
4. Ejecuta `npm run dev`.
5. Sigue `docs/INSTALACION-GMAIL-SUPABASE.md` para conectar Gmail API.
6. Consulta `docs/FASE-2B-BANCOLOMBIA.md` y `docs/FASE-2B1-FECHA-HORA-MOVIMIENTOS.md` para desplegar y probar esta fase.

## Comandos

```bash
npm install --package-lock=false
npm test
npm run lint
npm run validate
npm run build
```

## Seguridad

Nunca subas al repositorio:

- `.env`
- Client Secret de Google
- Service Role Key de Supabase
- Refresh token de Gmail
- `GMAIL_TOKEN_ENCRYPTION_KEY`
- `package-lock.json`

Los secretos de Gmail deben configurarse exclusivamente en Supabase Edge Functions.


## Fase 2B.2 — Vista pública para empleados

La ruta `/empleados` permite consultar solamente los cinco movimientos más recientes, sincronizar alertas recientes de Bancolombia y confirmar pagos recibidos. El Administrador configura el nombre y la contraseña desde Configuración. Ejecutar previamente `supabase/2026-07-17-fase2b2-acceso-publico-empleados.sql`.

## Fase 2B.3 — Diagnóstico Gmail y sincronización rápida

- Verificador activo de conexión Gmail con resultados por etapa.
- Visualización del último error y errores técnicos recientes.
- Identificación de alertas Bancolombia detectadas pero no convertidas por formato no reconocido.
- Sincronización rápida de las últimas 2, 6 o 12 horas; 2 horas es el valor predeterminado.
- La búsqueda rápida consulta exclusivamente el remitente autorizado de Bancolombia y procesa máximo 100 mensajes.
- La sincronización histórica por rango de fechas continúa disponible.
- Nueva Edge Function: `gmail-diagnostics`.
- No requiere una migración SQL adicional.

## Fase 2B.3.1 — Corrección del diagnóstico de Edge Functions

La versión 1.2.4 diferencia “Sin conectar” de “Estado no disponible”, mantiene el diagnóstico visible aunque Supabase no responda y corrige bloqueos CORS entre URLs de Vercel y las Edge Functions. No requiere SQL nuevo. Es obligatorio redesplegar todas las funciones para incorporar el archivo compartido `_shared/cors.ts`.

## Fase 2B.3.2 — Simplificación operativa

La versión 1.2.5 reduce la navegación principal a Inicio, Movimientos, Facturas y Configuración. Se elimina el flujo de revisión de movimientos, sus columnas y estados derivados. Las confirmaciones realizadas desde el enlace de empleados se conservan en su tabla independiente sin modificar el movimiento. Requiere ejecutar `supabase/2026-07-17-fase2b32-simplificacion-operativa.sql` y redesplegar `gmail-sync-now` y `employee-public-access`.

## Fase 2B.3.3 — PWA y sincronización rápida para empleados

La versión 1.2.6 incorpora en `/empleados` el selector de sincronización rápida de 2, 6 y 12 horas, con 2 horas como opción predeterminada y límite de una ejecución por minuto. La ruta pública puede instalarse como una PWA independiente llamada **Rafiki Empleados**, con manifiesto, iconos e inicio directo propios. No requiere SQL nuevo; se deben redesplegar `gmail-sync-now` y `employee-public-access`.


## Fase 2B.3.4 — Búsqueda rápida de 20 alertas

La versión 1.2.7 reemplaza los selectores de horas por un botón único que consulta como máximo las 20 alertas Bancolombia más recientes recibidas durante la última hora. Se aplica en Movimientos, Configuración y Rafiki Empleados. No requiere SQL nuevo; se debe redesplegar `gmail-sync-now`.

## Fase 2D — Facturación electrónica

La versión 1.3.0 incorpora `gmail-sync-invoices`, búsqueda de correos con ZIP/XML/PDF, extracción UBL de proveedor, NIT, número, CUFE, fechas y valores, control de duplicados y un módulo Facturas operativo. Los PDF sin XML se registran como documentos incompletos. Ejecutar `supabase/2026-07-17-fase2d-facturacion-electronica.sql` antes de usar la nueva función.
