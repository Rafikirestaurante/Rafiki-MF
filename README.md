# Rafiki Movimientos y Facturas

Aplicación independiente para documentar movimientos bancarios detectados en Gmail, registrar facturas electrónicas y realizar una verificación manual al finalizar el día.

## Versión

**1.2.0 — Fase 2B: extractor de movimientos Bancolombia**

## Alcance de esta entrega

- React 18 + Vite con diseño adaptable a celular y computador.
- PWA interna instalable.
- Autenticación Supabase por correo y contraseña.
- Roles `admin` y `reviewer`.
- La primera cuenta registrada queda como Administrador.
- Módulos: Inicio, Movimientos, Facturas, Verificación, Historial y Configuración.
- Supabase independiente y separado de Rafiki Pedidos.
- OAuth 2.0 de Gmail con permiso de solo lectura.
- Refresh token cifrado con AES-256-GCM.
- Sincronización manual por rango de fechas.
- Registro técnico de candidatos de Gmail.
- Extractor Bancolombia para ingresos, transferencias y compras con tarjeta.
- Normalización de fechas, valores COP, detalle y referencia.
- Control primario de duplicados por `gmail_message_id + movement_type`.
- Visualización de movimientos y resumen informativo del día.

## Pendiente para próximas etapas

- Extractor Nequi.
- Lectura de ZIP, XML y PDF de facturación electrónica.
- Control definitivo de duplicados.
- Edición de estados, observaciones y verificación diaria.
- Historial operativo completo.

La aplicación no afecta Caja, Cartera, Gastos ni Pedidos y no utiliza el proyecto Supabase de Rafiki Pedidos.

## Instalación rápida

1. Ejecuta los SQL en orden:
   - `supabase/2026-07-14-fase1a-base-independiente.sql`
   - `supabase/2026-07-16-fase2a-motor-sincronizacion.sql`
   - `supabase/2026-07-16-fase2b-bancolombia.sql`
2. Copia `.env.example` como `.env` y configura Supabase.
3. Instala dependencias con `npm install --package-lock=false`.
4. Ejecuta `npm run dev`.
5. Sigue `docs/INSTALACION-GMAIL-SUPABASE.md` para conectar Gmail API.
6. Consulta `docs/FASE-2B-BANCOLOMBIA.md` para desplegar y probar esta fase.

## Comandos

```bash
npm install --package-lock=false
npm test
npm run lint
npm run validate
npm run build
```

## Seguridad

Nunca subas al repositorio:

- `.env`
- Client Secret de Google
- Service Role Key de Supabase
- Refresh token de Gmail
- `GMAIL_TOKEN_ENCRYPTION_KEY`
- `package-lock.json`

Los secretos de Gmail deben configurarse exclusivamente en Supabase Edge Functions.
