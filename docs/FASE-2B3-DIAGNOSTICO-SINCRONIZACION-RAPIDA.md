# Rafiki MF — Fase 2B.3

## Objetivo

Mejorar la confiabilidad operativa de Gmail mediante un verificador visible y una sincronización rápida de alertas Bancolombia.

## Verificador de conexión

La Edge Function `gmail-diagnostics` comprueba por separado:

1. Existencia del registro de conexión.
2. Disponibilidad de la credencial cifrada.
3. Descifrado con la llave configurada.
4. Renovación del token de acceso en Google.
5. Lectura del perfil de Gmail.
6. Búsqueda real de correos del remitente autorizado de Bancolombia.

La interfaz muestra el resultado de cada paso, el último error guardado y hasta ocho errores técnicos recientes de sincronización.

## Sincronización rápida

El Administrador puede revisar las últimas 2, 6 o 12 horas. La opción predeterminada es 2 horas.

La consulta rápida:

- Busca exclusivamente `alertasynotificaciones@an.notificacionesbancolombia.com`.
- Usa una hora inicial exacta.
- Aplica una verificación adicional sobre `internalDate` de Gmail.
- Procesa máximo 100 mensajes.
- Mantiene los controles de duplicados existentes.
- Está disponible en Configuración y Movimientos.

La sincronización por rango de fechas continúa disponible dentro de una sección secundaria para revisiones históricas.

## Despliegue

No requiere migración SQL. Deben desplegarse:

- `gmail-diagnostics`
- `gmail-sync-now`

El workflow de GitHub Actions ya incluye ambas funciones.
