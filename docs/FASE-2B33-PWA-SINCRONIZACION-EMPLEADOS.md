# Fase 2B.3.3 — PWA y sincronización rápida para empleados

Versión: **1.2.6**

## Objetivo

Hacer que la vista `/empleados` use el mismo esquema de sincronización rápida del módulo Movimientos y pueda instalarse como una aplicación independiente para trabajadores.

## Sincronización pública

- Selector de **2, 6 y 12 horas**.
- **2 horas** como valor predeterminado.
- Búsqueda exclusiva del remitente autorizado de Bancolombia.
- Máximo 100 mensajes por ejecución.
- Validación de la hora exacta de recepción del correo.
- Límite público de una sincronización por minuto.
- El backend rechaza cualquier rango distinto de 2, 6 o 12 horas y usa 2 horas como respaldo.
- Después de sincronizar se actualizan inmediatamente los últimos cinco movimientos.

## PWA Rafiki Empleados

La ruta `/empleados` dispone de un manifiesto independiente:

- Nombre: **Rafiki Empleados**.
- Inicio directo: `/empleados`.
- Identidad e iconos propios.
- Presentación `standalone`.
- Orientación principal vertical.
- Botón de instalación cuando el navegador admite instalación directa.
- Instrucción alternativa para usar “Agregar a pantalla de inicio”.
- Reutiliza el Service Worker seguro de Rafiki MF sin abrir el panel administrativo.

La PWA conserva las mismas restricciones del enlace público: solo cinco movimientos, sesión temporal, sincronización limitada y confirmación de ingresos.

## Despliegue

No requiere SQL nuevo. Es necesario:

1. Subir la versión 1.2.6 a GitHub.
2. Redesplegar `gmail-sync-now` y `employee-public-access` mediante GitHub Actions.
3. Esperar el despliegue de Vercel.
4. Abrir `/empleados`, actualizar completamente y usar la opción Instalar.
