# Rafiki Movimientos y Facturas

Aplicación independiente para documentar movimientos bancarios detectados en Gmail, registrar facturas electrónicas y realizar una verificación manual al finalizar el día.

## Versión

**1.0.0 — Fase 1A: Base independiente y preparación Gmail API**

## Alcance de esta entrega

- React + Vite con diseño adaptable a celular y computador.
- PWA interna instalable.
- Autenticación Supabase por correo y contraseña.
- Roles `admin` y `reviewer`.
- La primera cuenta registrada queda como Administrador.
- Módulos iniciales: Inicio, Movimientos, Facturas, Verificación, Historial y Configuración.
- Tablas documentales independientes en Supabase.
- Infraestructura OAuth 2.0 de Gmail API.
- Refresh token cifrado con AES-256-GCM.
- Funciones para conectar, probar y desconectar Gmail.

## Lo que todavía no hace

- No escanea mensajes de Gmail.
- No ejecuta reglas de Bancolombia o Nequi.
- No procesa ZIP/XML de facturación.
- No afecta Caja, Cartera, Gastos o Pedidos.
- No se conecta con el proyecto Supabase de Rafiki Pedidos.

## Instalación rápida

1. Crea un proyecto Supabase nuevo.
2. Ejecuta `supabase/2026-07-14-fase1a-base-independiente.sql`.
3. Copia `.env.example` como `.env` y configura Supabase.
4. Instala dependencias con `npm install`.
5. Ejecuta `npm run dev`.
6. Crea la primera cuenta desde la aplicación.
7. Sigue `docs/INSTALACION-GMAIL-SUPABASE.md` para conectar Gmail API.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run lint
npm run validate
```

## Seguridad

Nunca subas al repositorio:

- `.env`
- Client Secret de Google
- Service Role Key de Supabase
- Refresh token de Gmail
- `GMAIL_TOKEN_ENCRYPTION_KEY`

Los secretos de Gmail deben configurarse exclusivamente en Supabase Edge Functions.

## Fase 1A.2 — Despliegue 100 % cloud

Se agregó GitHub Actions para desplegar las cinco Edge Functions de Supabase sin ejecutar comandos ni instalar herramientas en el computador del usuario. Consulta `docs/DESPLIEGUE-100-CLOUD.md`.
