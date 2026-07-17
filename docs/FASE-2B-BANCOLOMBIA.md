# Rafiki MF — Fase 2B: extractor Bancolombia

Versión: **1.2.0**

## Alcance implementado

La sincronización manual de Gmail conserva el registro técnico de candidatos creado en la Fase 2A y añade el procesamiento real de las alertas enviadas por:

```text
alertasynotificaciones@an.notificacionesbancolombia.com
```

Se reconocen inicialmente:

- `recibiste un pago de`: ingreso.
- `transferiste`: transferencia enviada.
- `Compraste`: compra con tarjeta.

Para cada alerta compatible se extraen y normalizan:

- Tipo de movimiento.
- Fecha de la transacción; se utiliza la fecha de recepción como respaldo.
- Valor en pesos colombianos enteros.
- Persona, comercio o destinatario como detalle.
- Referencia o comprobante cuando aparece en el correo.
- Últimos dígitos de cuenta o tarjeta como metadato técnico cuando están disponibles.

## Seguridad y privacidad

- Se mantiene el permiso OAuth `gmail.readonly`.
- El cuerpo completo del correo se procesa temporalmente dentro de la Edge Function.
- No se almacena el cuerpo completo en Supabase.
- Solo se guardan los campos extraídos, asunto, remitente y metadatos mínimos de trazabilidad.
- No se modifica Caja, Cartera, Gastos ni Rafiki Pedidos.

## Duplicados

La repetición de una sincronización no vuelve a crear un movimiento para la misma combinación de:

```text
gmail_message_id + movement_type
```

Además, se calcula una huella secundaria. Cuando otro correo diferente produce exactamente la misma fuente, tipo, fecha, valor, detalle y referencia, el registro se conserva con estado `possible_duplicate` para revisión manual. La política definitiva se completará en la Fase 2E.

## Instalación

1. Ejecutar en el SQL Editor de Supabase:

```text
supabase/2026-07-16-fase2b-bancolombia.sql
```

2. Subir el proyecto a GitHub.
3. Confirmar en GitHub Actions que se despliegue nuevamente `gmail-sync-now`.
4. Esperar el despliegue de Vercel.
5. Sincronizar primero un rango corto con alertas conocidas de Bancolombia.
6. Abrir el módulo **Movimientos** y revisar los resultados.

## Estados iniciales

- `pending`: movimiento nuevo pendiente de revisión.
- `possible_duplicate`: huella secundaria igual a otro movimiento de un correo distinto.
- `error`: error técnico registrado en `processing_errors`.

La modificación manual de estados y observaciones se habilitará en la Fase 2F.
