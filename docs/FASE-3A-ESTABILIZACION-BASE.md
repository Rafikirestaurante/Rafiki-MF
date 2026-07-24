# Fase 3A — Estabilización de la base

Versión: **1.3.1**

Fecha de cierre técnico: **17 de julio de 2026**

## Objetivo

Consolidar la versión 1.3.0 / Fase 2D como una base técnica confiable antes de desarrollar Nequi, verificación diaria, historial u otras funciones. Esta subfase no cambia las reglas de extracción ni introduce una nueva migración SQL.

## Cambios aplicados

- Actualización de `package.json` a la versión 1.3.1.
- Creación de `src/config/appMetadata.js` como fuente central de versión y nombre de fase visibles.
- Actualización de la tarjeta de versión en Configuración.
- Reescritura de `README.md` con el estado real de Bancolombia, empleados, diagnóstico y facturación electrónica.
- Actualización del cronograma general del proyecto.
- Corrección de la documentación vigente del acceso para empleados.
- Inclusión de `APP_ALLOWED_ORIGINS` en el ejemplo de secretos de Edge Functions.
- Incorporación del comando integral `npm run check`.
- Ampliación del validador del proyecto para revisar estructura, versión, migraciones, Edge Functions, despliegue, secretos de ejemplo y ausencia de archivos prohibidos.

## Validaciones realizadas

La base debe superar:

```bash
npm install --package-lock=false
npm run check
```

`npm run check` ejecuta:

1. Pruebas automatizadas con Vitest.
2. Revisión estática con ESLint.
3. Validación estructural propia del proyecto.
4. Compilación de producción con Vite.

## Resultado esperado

- 12 pruebas automatizadas aprobadas.
- ESLint sin errores.
- Validador estructural aprobado.
- Compilación de producción aprobada.
- PWA generada correctamente.
- Ningún `package-lock.json`, `npm-shrinkwrap.json`, `.env` real, `node_modules` o `dist` dentro del ZIP final.

## SQL y despliegue

La Fase 3A no agrega SQL ni modifica la lógica de las Edge Functions. No se requiere un redespliegue manual; sin embargo, GitHub Actions puede redesplegar automáticamente las funciones porque se actualizó el archivo de ejemplo `supabase/functions/.env.example`.

Las diez Edge Functions existentes permanecen sin cambios funcionales:

- `gmail-oauth-start`
- `gmail-oauth-callback`
- `gmail-connection-status`
- `gmail-test-connection`
- `gmail-diagnostics`
- `gmail-disconnect`
- `gmail-sync-now`
- `gmail-sync-invoices`
- `employee-access-admin`
- `employee-public-access`

## Variables que deben comprobarse

### Vercel

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase Edge Functions

- `GOOGLE_GMAIL_CLIENT_ID`
- `GOOGLE_GMAIL_CLIENT_SECRET`
- `GOOGLE_GMAIL_REDIRECT_URI`
- `APP_PUBLIC_URL`
- `GMAIL_TOKEN_ENCRYPTION_KEY`
- `APP_ALLOWED_ORIGINS` opcional

`APP_PUBLIC_URL` debe contener solamente la URL pública, por ejemplo:

```text
https://rafiki-mf.vercel.app
```

## Prueba manual recomendada después del despliegue

1. Abrir la aplicación en una ventana privada.
2. Iniciar sesión con un usuario activo.
3. Confirmar que Inicio, Movimientos, Facturas y Configuración carguen.
4. Ejecutar el diagnóstico de Gmail.
5. Ejecutar una búsqueda rápida de Bancolombia.
6. Abrir Facturas y comprobar la consulta de registros.
7. Abrir `/empleados`, iniciar sesión y consultar los cinco movimientos.
8. Confirmar que las dos PWA mantengan su identidad independiente.

## Criterio de cierre

La Fase 3A queda cerrada cuando el proyecto supera `npm run check`, el ZIP no contiene archivos prohibidos y la aplicación desplegada conserva las funciones de la Fase 2D sin regresiones.
