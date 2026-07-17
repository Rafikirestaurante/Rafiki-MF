# Rafiki MF — Fase 2A

## Instalación requerida

1. Ejecutar en el SQL Editor del proyecto Supabase el archivo:
   `supabase/2026-07-16-fase2a-motor-sincronizacion.sql`
2. Subir los cambios a GitHub. El workflow despliega automáticamente la nueva Edge Function `gmail-sync-now`.
3. Confirmar que Gmail aparezca conectado en Configuración.
4. Elegir el rango de fechas y pulsar **Sincronizar ahora**.

## Alcance

La función consulta hasta 500 mensajes por ejecución, obtiene metadatos básicos y guarda candidatos en `gmail_sync_candidates`. Registra inicio, finalización, contadores, duplicados y errores en las tablas existentes. No crea movimientos bancarios ni facturas.

## Seguridad

Solo el Administrador activo puede ejecutar la sincronización. El acceso de Gmail sigue siendo de solo lectura y el token de renovación permanece cifrado con AES-256-GCM.
