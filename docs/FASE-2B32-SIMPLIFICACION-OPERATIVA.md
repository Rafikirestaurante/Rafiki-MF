# Fase 2B.3.2 — Simplificación operativa

## Navegación

La aplicación autenticada queda limitada a cuatro módulos: Inicio, Movimientos, Facturas y Configuración. La ruta pública `/empleados` se conserva.

## Movimientos

Se elimina el flujo de estados de revisión de la interfaz y de la tabla `financial_movements`. Los movimientos muestran fecha, hora, tipo, origen, detalle, referencia y valor.

## Confirmaciones de empleados

Las confirmaciones siguen almacenándose en `employee_payment_confirmations`. No cambian ni clasifican el movimiento original.

## Duplicados

Los duplicados exactos y las coincidencias de huella secundaria se omiten durante la sincronización.

## Instalación

1. Ejecutar `supabase/2026-07-17-fase2b32-simplificacion-operativa.sql`.
2. Subir la versión a GitHub.
3. Redesplegar `gmail-sync-now` y `employee-public-access` mediante el workflow.
4. Esperar el despliegue de Vercel.
