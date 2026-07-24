# Rafiki Movimientos y Facturas

**Rafiki MF** es una aplicación independiente para consultar movimientos bancarios detectados en Gmail, registrar facturas electrónicas y conservar trazabilidad documental. No comparte proyecto, base de datos, autenticación ni funciones con Rafiki Pedidos.

## Versión actual

**1.3.3 — Fase 3A.2: nueva regla Bancolombia para pagos con tipo**

Esta revisión parte de la versión 1.3.2 y añade una regla Bancolombia para alertas con la estructura `Recibiste un pago [TIPO] de [ORIGEN] por $[VALOR]`, incluyendo el caso real `PROVEEDOR de REDEBAN SA`. El origen se conserva como detalle visible, el tipo de pago se guarda en metadatos y la hora explícita del movimiento tiene prioridad sobre una hora visual previa del correo.

## Funciones disponibles

- React 18 + Vite con diseño adaptable a celular y computador.
- PWA principal instalable como **Rafiki MF**.
- PWA pública independiente **Rafiki Empleados** en `/empleados`.
- Autenticación Supabase por correo y contraseña.
- Roles internos `admin` y `reviewer`.
- La primera cuenta registrada queda como Administrador.
- Navegación principal: Inicio, Movimientos, Facturas y Configuración.
- OAuth 2.0 de Gmail con permiso de solo lectura.
- Refresh token cifrado mediante AES-256-GCM.
- Diagnóstico técnico de conexión con Gmail y Edge Functions.
- Sincronización rápida de hasta 20 alertas Bancolombia recibidas durante la última hora.
- Sincronización histórica de movimientos por rango de fechas.
- Extracción de ingresos, transferencias y compras con tarjeta de Bancolombia.
- Reconocimiento de pagos Bancolombia con tipo intermedio, por ejemplo `Recibiste un pago PROVEEDOR de REDEBAN SA por $114109.00`.
- En estos pagos, `REDEBAN SA` se registra como detalle visible y `PROVEEDOR` se conserva como `payment_kind` dentro de los metadatos.
- La hora explícita del movimiento (`a las 17:13`) tiene prioridad sobre una marca horaria visual anterior del correo (`5:14 p. m.`).
- Normalización de fecha, hora, valor COP, detalle y referencia.
- Facturación electrónica mediante ZIP, XML UBL y PDF.
- Extracción de proveedor, NIT, número, CUFE, fechas, subtotal, impuestos y total.
- Control de duplicados de movimientos y documentos.
- Registro incompleto cuando existe PDF sin XML interpretable.
- Acceso restringido para empleados a los cinco movimientos más recientes.
- Confirmaciones de pagos almacenadas de forma separada, sin modificar el movimiento bancario.
- Registro de sincronizaciones, errores y auditoría documental.
- `/empleados` puede solicitar una nueva búsqueda rápida sin esperar un minuto; se conserva el bloqueo de una sincronización global que ya esté en ejecución.
- Las alertas recibidas desde `alertasynotificaciones@an.notificacionesbancolombia.com` que no coinciden con una regla conocida permanecen registradas en `gmail_sync_candidates` para revisión, sin crear un movimiento financiero falso.
- Inicio incluye un calendario mensual navegable con movimientos, facturas y alertas Bancolombia no reconocidas por día.

## Requisitos

- Node.js 20 o superior.
- npm.
- Proyecto Supabase exclusivo para Rafiki MF.
- Proyecto Google Cloud con Gmail API y OAuth 2.0.
- Proyecto Vercel conectado al repositorio de Rafiki MF.

## Instalación local

```bash
npm install --package-lock=false
npm run dev
```

Copia `.env.example` como `.env` y configura:

```text
VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

## Migraciones SQL

Ejecuta en Supabase SQL Editor, respetando este orden:

1. `supabase/2026-07-14-fase1a-base-independiente.sql`
2. `supabase/2026-07-16-fase2a-motor-sincronizacion.sql`
3. `supabase/2026-07-16-fase2b-bancolombia.sql`
4. `supabase/2026-07-16-fase2b1-fecha-hora-sincronizacion-movimientos.sql`
5. `supabase/2026-07-17-fase2b2-acceso-publico-empleados.sql`
6. `supabase/2026-07-17-fase2b32-simplificacion-operativa.sql`
7. `supabase/2026-07-17-fase2d-facturacion-electronica.sql`

Las Fases 3A.1 y 3A.2 no requieren migraciones SQL nuevas. La 3A.2 solo amplía el extractor Bancolombia y sus pruebas, reutilizando la estructura existente.

## Secretos de Supabase Edge Functions

Configura los siguientes secretos en el proyecto Supabase:

```text
GOOGLE_GMAIL_CLIENT_ID
GOOGLE_GMAIL_CLIENT_SECRET
GOOGLE_GMAIL_REDIRECT_URI
APP_PUBLIC_URL
GMAIL_TOKEN_ENCRYPTION_KEY
```

Opcionalmente puede configurarse:

```text
APP_ALLOWED_ORIGINS
```

`APP_PUBLIC_URL` debe contener exclusivamente la URL pública de producción, sin el prefijo `Valor:`, sin comillas y sin saltos de línea. Ejemplo:

```text
https://rafiki-mf.vercel.app
```

## Edge Functions

El proyecto contiene diez funciones:

1. `gmail-oauth-start`
2. `gmail-oauth-callback`
3. `gmail-connection-status`
4. `gmail-test-connection`
5. `gmail-diagnostics`
6. `gmail-disconnect`
7. `gmail-sync-now`
8. `gmail-sync-invoices`
9. `employee-access-admin`
10. `employee-public-access`

El flujo `.github/workflows/deploy-supabase-functions.yml` despliega las diez funciones cuando cambia `supabase/functions/**` o puede ejecutarse manualmente desde GitHub Actions.

## Verificación técnica

Ejecuta la comprobación completa antes de desplegar:

```bash
npm run check
```

Este comando ejecuta, en orden:

```bash
npm test
npm run lint
npm run validate
npm run build
```

También pueden ejecutarse individualmente.

## Despliegue

### GitHub

Configura estos secretos del repositorio:

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_REF
```

### Vercel

Configura:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Vercel instala el proyecto mediante:

```bash
npm install --registry=https://registry.npmjs.org --no-audit --no-fund --package-lock=false
```

## Regla permanente de instalación

Este proyecto no utiliza `package-lock.json` ni `npm ci`.

- No subir `package-lock.json`.
- No ejecutar `npm ci`.
- Usar `npm install --package-lock=false`.
- Mantener la generación del lock desactivada en Vercel.

## Seguridad

Nunca subir al repositorio:

- `.env` o `.env.local`.
- Client Secret de Google.
- Service Role Key de Supabase.
- Refresh token de Gmail.
- `GMAIL_TOKEN_ENCRYPTION_KEY`.
- Credenciales reales de empleados.
- `package-lock.json` o `npm-shrinkwrap.json`.

Los secretos de Gmail deben permanecer exclusivamente en Supabase Edge Functions. La aplicación no almacena el cuerpo completo de los correos ni el contenido íntegro de las facturas en las tablas documentales.

## Documentación principal

- `docs/INSTALACION-GMAIL-SUPABASE.md`
- `docs/DESPLIEGUE-100-CLOUD.md`
- `docs/FASE-2B-BANCOLOMBIA.md`
- `docs/FASE-2B2-ACCESO-PUBLICO-EMPLEADOS.md`
- `docs/FASE-2D-FACTURACION-ELECTRONICA.md`
- `docs/FASE-3A-ESTABILIZACION-BASE.md`
- `docs/CRONOGRAMA-PROYECTO.md`

## Próxima etapa recomendada

La siguiente subfase prevista es la **Fase 3B — integración real de Nequi**, manteniendo Bancolombia, facturación electrónica y acceso de empleados sin cambios funcionales.
