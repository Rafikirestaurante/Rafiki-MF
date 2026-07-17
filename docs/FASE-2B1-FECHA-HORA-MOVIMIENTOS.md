# Rafiki MF — Fase 2B.1

Versión: **1.2.1**

## Objetivo

Mejorar la operación diaria del módulo Movimientos mostrando la fecha y hora completas, manteniendo siempre visible el movimiento más reciente y permitiendo iniciar la sincronización sin entrar a Configuración.

## Cambios

- Nueva columna `transaction_at` en `financial_movements`.
- Extracción de horas en formato de 12 o 24 horas desde el cuerpo de la alerta.
- Cuando el correo no contiene hora, se usa la hora de recepción en Bogotá como respaldo.
- Orden por `transaction_at` descendente.
- Tarjeta permanente de “Último movimiento”.
- Botón “Sincronizar ahora” con rango de fechas dentro de Movimientos.
- La columna `Estado` pasa a llamarse `Revisión`.
- Ayuda visible para explicar cada estado y aclarar que no representa el estado bancario del pago.

## Instalación

1. Ejecuta en Supabase SQL Editor:

   `supabase/2026-07-16-fase2b1-fecha-hora-sincronizacion-movimientos.sql`

2. Sube el proyecto a GitHub.
3. Confirma que GitHub Actions actualice `gmail-sync-now`.
4. Espera el despliegue de Vercel.
5. En Movimientos, selecciona un rango y pulsa “Sincronizar ahora”.

## Nota sobre registros anteriores

Los movimientos creados antes de esta versión reciben como hora inicial la hora de recepción del correo. Al volver a sincronizar su rango, la Edge Function actualiza esos registros y reemplaza la hora de respaldo por la hora escrita en la alerta cuando esté disponible.
