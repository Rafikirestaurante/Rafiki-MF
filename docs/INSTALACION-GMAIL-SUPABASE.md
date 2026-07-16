# Instalación — Supabase y Gmail API

## 1. Crear Supabase independiente

Crea un proyecto nuevo. No ejecutes este SQL en el Supabase de Rafiki Pedidos.

Ejecuta en SQL Editor:

```text
supabase/2026-07-14-fase1a-base-independiente.sql
```

En Authentication configura inicialmente correo y contraseña. La primera cuenta creada desde la app recibe rol `admin`; las siguientes reciben `reviewer`.

Después de crear el Administrador, se recomienda desactivar temporalmente los registros públicos desde Authentication si todavía no agregarás otros usuarios.

## 2. Variables de Vercel

```text
VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

## 3. Google Cloud

1. Crea o selecciona un proyecto.
2. Activa Gmail API.
3. Configura Google Auth Platform.
4. Mientras esté en pruebas, agrega como Test user la cuenta Gmail a conectar.
5. Agrega el alcance:

```text
https://www.googleapis.com/auth/gmail.readonly
```

6. Crea un OAuth Client de tipo Web application.
7. Registra como Authorized redirect URI:

```text
https://TU_PROJECT_REF.supabase.co/functions/v1/gmail-oauth-callback
```

## 4. Secretos de Edge Functions

Configura en Supabase:

```text
GOOGLE_GMAIL_CLIENT_ID
GOOGLE_GMAIL_CLIENT_SECRET
GOOGLE_GMAIL_REDIRECT_URI
APP_PUBLIC_URL
GMAIL_TOKEN_ENCRYPTION_KEY
```

`APP_PUBLIC_URL` debe contener la URL de esta aplicación independiente, no la URL de Rafiki Pedidos.

Genera la clave de cifrado:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 5. Desplegar funciones

Desde la raíz del proyecto:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase functions deploy gmail-oauth-start
npx supabase functions deploy gmail-oauth-callback --no-verify-jwt
npx supabase functions deploy gmail-connection-status
npx supabase functions deploy gmail-test-connection
npx supabase functions deploy gmail-disconnect
```

La carpeta `_shared` no se despliega individualmente.

## 6. Probar

1. Despliega la aplicación en Vercel.
2. Inicia sesión como Administrador.
3. Abre Configuración.
4. Presiona **Conectar Gmail**.
5. Autoriza la cuenta agregada como Test user.
6. Regresa a Configuración y usa **Probar conexión**.

## Nota sobre Google OAuth Testing

Cuando Google OAuth está en modo externo `Testing`, un refresh token con permisos de Gmail puede requerir reconexión periódica. Esta situación corresponde a la configuración de Google y no a una pérdida de datos en la aplicación.
