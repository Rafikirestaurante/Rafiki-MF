# Despliegue 100 % en la nube — Rafiki MF

Esta configuración evita ejecutar Supabase CLI, GitHub Desktop o comandos de despliegue en el computador del usuario.

## Arquitectura

- GitHub almacena el código.
- GitHub Actions despliega las Edge Functions a Supabase.
- Vercel despliega la aplicación React.
- Supabase Dashboard almacena los secretos de Gmail y ejecuta las funciones.

## Secretos de GitHub necesarios

En GitHub: Settings > Secrets and variables > Actions > New repository secret.

- `SUPABASE_ACCESS_TOKEN`: token personal de Supabase para que GitHub Actions despliegue las funciones.
- `SUPABASE_PROJECT_REF`: referencia del proyecto Supabase de Rafiki MF.

No guardar aquí las credenciales de Google ni la clave de cifrado. Esos valores pertenecen a Supabase Edge Function Secrets.

## Secretos de Supabase necesarios

- `GOOGLE_GMAIL_CLIENT_ID`
- `GOOGLE_GMAIL_CLIENT_SECRET`
- `GOOGLE_GMAIL_REDIRECT_URI`
- `APP_PUBLIC_URL`
- `GMAIL_TOKEN_ENCRYPTION_KEY`

## Despliegue

El workflow `.github/workflows/deploy-supabase-functions.yml` se ejecuta cuando cambia una función, `supabase/config.toml` o el propio workflow en la rama `main`.

También puede ejecutarse manualmente desde GitHub: Actions > Deploy Supabase Edge Functions > Run workflow.

`supabase/config.toml` mantiene `verify_jwt = false` solamente para `gmail-oauth-callback`, ya que Google debe poder devolver la autorización sin una sesión de navegador enviada en el encabezado.
