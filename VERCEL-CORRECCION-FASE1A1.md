# Rafiki MF — Corrección Vercel Fase 1A.1

Esta corrección elimina `package-lock.json` porque el archivo original contenía rutas internas incompatibles con Vercel.

Configuración aplicada en `vercel.json`:

- Instalación con `npm install` desde el registro público de npm.
- No genera `package-lock.json` durante el despliegue.
- Compilación con `npm run build`.
- Salida en `dist`.
- Reescritura SPA hacia `index.html`.

Variables requeridas en Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

No subir archivos `.env` ni claves reales a GitHub.
