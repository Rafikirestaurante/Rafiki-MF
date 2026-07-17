# Resumen — Fase 2B.3.1

Versión 1.2.4. Corrige el caso en que Configuración mostraba “Sin conectar” y el mensaje genérico `Failed to send a request to the Edge Function` sin permitir diagnóstico. Se separa la carga de servicios, se incorpora diagnóstico local y se flexibiliza CORS para URLs válidas de Vercel y dominios personalizados. No requiere migración SQL; requiere redesplegar todas las Edge Functions.
