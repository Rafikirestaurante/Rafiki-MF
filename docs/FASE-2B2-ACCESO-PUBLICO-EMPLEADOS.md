# Rafiki MF — Fase 2B.2

## Acceso público controlado para empleados

La ruta pública es:

```text
https://TU-DOMINIO-VERCEL/empleados
```

El Administrador configura desde **Configuración** un nombre de acceso y una contraseña compartida. La contraseña nunca se guarda en texto plano: se deriva con PBKDF2-SHA-256, sal aleatoria y 120.000 iteraciones.

## Restricciones

- Solo devuelve los cinco movimientos más recientes.
- No expone IDs de Gmail, asuntos, remitentes, referencias técnicas ni historial completo.
- No permite abrir el panel administrativo, facturas o configuración.
- La sesión pública dura ocho horas.
- Cambiar la configuración invalida las sesiones abiertas.
- La sincronización pública consulta solamente alertas de Bancolombia de los últimos tres días.
- La sincronización pública se limita a una ejecución por minuto.
- Solo los movimientos de ingreso pueden confirmarse como pagos recibidos.

## Confirmación

El trabajador escribe su nombre y, opcionalmente, una observación. La confirmación:

- queda registrada en `employee_payment_confirmations`;
- cambia el movimiento a `verified`;
- guarda fecha y hora;
- queda registrada en `document_audit_log`;
- no puede repetirse para el mismo movimiento.

## Instalación

1. Ejecutar `supabase/2026-07-17-fase2b2-acceso-publico-empleados.sql`.
2. Subir el proyecto completo a GitHub.
3. Confirmar en GitHub Actions el despliegue de:
   - `employee-access-admin`
   - `employee-public-access`
   - `gmail-sync-now`
4. Esperar el despliegue de Vercel.
5. Entrar como Administrador a Configuración.
6. Definir el nombre, la contraseña y activar el acceso.
7. Copiar y compartir el enlace `/empleados`.

## Tablas nuevas

- `employee_public_access_settings`
- `employee_payment_confirmations`
- `employee_public_access_log`
