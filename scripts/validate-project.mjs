import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "src/App.jsx",
  "src/pages/SettingsPage.jsx",
  "src/services/gmailIntegrationService.js",
  "supabase/2026-07-14-fase1a-base-independiente.sql",
  "supabase/functions/gmail-oauth-start/index.ts",
  "supabase/functions/gmail-oauth-callback/index.ts",
  "supabase/functions/gmail-connection-status/index.ts",
  "supabase/functions/gmail-test-connection/index.ts",
  "supabase/functions/gmail-disconnect/index.ts",
  "supabase/functions/gmail-sync-now/index.ts",
  "supabase/2026-07-16-fase2a-motor-sincronizacion.sql",
  "supabase/2026-07-16-fase2b-bancolombia.sql",
  "supabase/functions/_shared/bancolombia.ts",
  "src/services/movementService.js",
  "docs/FASE-2B-BANCOLOMBIA.md",
  "docs/INSTALACION-GMAIL-SUPABASE.md"
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("Archivos faltantes:\n" + missing.join("\n"));
  process.exit(1);
}

const sql = fs.readFileSync(path.join(root, "supabase/2026-07-14-fase1a-base-independiente.sql"), "utf8");
const expectations = ["create table if not exists public.app_users", "public.financial_movements", "public.electronic_invoices", "public.daily_verifications", "public.gmail_connections"];
for (const token of expectations) {
  if (!sql.includes(token)) throw new Error(`El SQL no contiene: ${token}`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (packageJson.name !== "rafiki-movimientos-facturas") throw new Error("Nombre de proyecto inesperado.");

if (packageJson.version !== "1.2.0") throw new Error("Versión esperada: 1.2.0.");

console.log("Validación correcta: Rafiki MF Fase 2B, extractor Bancolombia y 6 Edge Functions presentes.");
