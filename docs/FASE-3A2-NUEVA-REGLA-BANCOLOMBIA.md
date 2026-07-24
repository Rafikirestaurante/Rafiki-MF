# Rafiki MF — Fase 3A.2

Versión **1.3.3**. Revisión menor sobre 1.3.2 antes de iniciar la Fase 3B.

## Objetivo

Agregar compatibilidad con una nueva alerta real enviada por `alertasynotificaciones@an.notificacionesbancolombia.com`:

```text
¡Listo! Todo salió bien con tus movimientos Bancolombia: Recibiste un pago PROVEEDOR de REDEBAN SA por $114109.00 en tu cuenta de Ahorros el 17/07/2026 a las 17:13.
```

## Registro

- Fuente: Bancolombia.
- Tipo: ingreso.
- Detalle visible: `REDEBAN SA`.
- Valor: 114109 COP.
- Fecha: 2026-07-17.
- Hora local: 17:13.
- Confianza: alta.
- `source_metadata.payment_kind`: `PROVEEDOR`.
- `source_metadata.payment_origin`: `REDEBAN SA`.
- `source_metadata.account_type`: `Ahorros`.

El extractor sigue aceptando la forma anterior `Recibiste un pago de [ORIGEN] por ...`, por lo que la regla es retrocompatible.

## Hora del movimiento

Cuando el texto incluye una hora visual del correo antes del contenido y después una hora explícita asociada al movimiento mediante `a las ...` o `hora: ...`, Rafiki MF prioriza la hora explícita del movimiento. Esto evita registrar 17:14 cuando Bancolombia informa que la transacción ocurrió realmente a las 17:13.

## Base de datos y despliegue

No requiere migración SQL ni nuevas dependencias. Sí modifica `supabase/functions/_shared/bancolombia.ts`, por lo que debe desplegarse nuevamente `gmail-sync-now` para que la nueva regla opere en producción.
