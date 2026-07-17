# Cronograma — Rafiki Movimientos y Facturas

## Fase 1 — Infraestructura independiente — Completada

- React 18 + Vite y PWA interna.
- Proyecto Supabase independiente.
- Autenticación y roles.
- Tablas documentales.
- Google Cloud, Gmail API y OAuth 2.0.
- Cinco Edge Functions de conexión y despliegue cloud.

## Fase 2 — Lectura y procesamiento real de Gmail

### 2A — Motor de sincronización manual — Completada

- Consulta de Gmail por rango de fechas.
- Renovación del token.
- Registro de ejecuciones, candidatos y errores.
- Control de ejecución simultánea.

### 2B — Bancolombia — Completada en versión 1.2.0

### 2B.1 — Fecha, hora y acceso directo — Completada en versión 1.2.1

- Detección del remitente autorizado.
- Ingresos, transferencias y compras con tarjeta.
- Fecha, valor, detalle y referencia.
- Normalización COP.
- Control primario por ID del mensaje.
- Visualización en Movimientos.

### 2C — Nequi

- Procesar `notificaciones@nequi.com.co` y `somos@nequi.com.co`.
- Diferenciar ingreso, transferencia y pago.
- Interpretar fechas en español y abreviadas.

### 2D — Facturas electrónicas

- Detectar ZIP, XML y PDF.
- Descargar adjuntos.
- Extraer proveedor, número, CUFE y valores.
- Vincular con el correo original.

### 2E — Control de duplicados

- Llaves únicas definitivas.
- Huellas secundarias.
- Reintentos seguros.
- Resolución de posibles duplicados.

### 2F — Verificación diaria

- Estados Pendiente, Verificado y Descartado.
- Observaciones y responsables.
- Totales informativos y cierre diario.

### 2G — Historial y auditoría

- Ejecuciones, errores, usuarios y acciones.
- Filtros y consulta detallada.

### 2H — Pruebas y cierre

- Correos reales y formatos inesperados.
- Adjuntos dañados.
- Duplicados y reintentos.
- Versión estable para operación diaria.
