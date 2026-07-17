import { optionsResponse } from "../_shared/cors.ts";
import { jsonResponse, errorMessage } from "../_shared/http.ts";
import { requireAppAdmin } from "../_shared/supabase.ts";
import {
  EMPLOYEE_ACCESS_KEY,
  createPasswordRecord,
  loadEmployeeAccessSettings,
  normalizeAccessUsername,
  randomSecret
} from "../_shared/employeeAccess.ts";

function publicUrl(): string {
  const base = String(Deno.env.get("APP_PUBLIC_URL") || "").trim().replace(/\/$/, "");
  return base ? `${base}/empleados` : "/empleados";
}

Deno.serve(async (request: Request) => {
  const preflight = optionsResponse(request);
  if (preflight) return preflight;
  if (request.method !== "POST") return jsonResponse(request, { error: "Método no permitido." }, 405);

  try {
    const { client, user, email } = await requireAppAdmin(request);
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "get");
    const current = await loadEmployeeAccessSettings(client);

    if (action === "get") {
      return jsonResponse(request, {
        configured: Boolean(current),
        enabled: Boolean(current?.enabled),
        username: current?.username || "empleados",
        password_configured: Boolean(current?.password_hash),
        session_duration_minutes: current?.session_duration_minutes || 480,
        public_url: publicUrl(),
        updated_at: current ? (await client.from("employee_public_access_settings").select("updated_at").eq("access_key", EMPLOYEE_ACCESS_KEY).single()).data?.updated_at || null : null
      });
    }

    if (action !== "save") return jsonResponse(request, { error: "Acción no permitida." }, 400);

    const username = normalizeAccessUsername(body.username);
    const password = String(body.password || "");
    const enabled = Boolean(body.enabled);
    if (username.length < 3 || username.length > 40 || !/^[a-z0-9._-]+$/.test(username)) {
      throw new Error("El nombre de acceso debe tener entre 3 y 40 caracteres y usar solo letras, números, punto, guion o guion bajo.");
    }
    if (!current && password.length < 4) throw new Error("Define una contraseña de al menos 4 caracteres.");
    if (password && (password.length < 4 || password.length > 72)) throw new Error("La contraseña debe tener entre 4 y 72 caracteres.");

    const passwordRecord = password ? await createPasswordRecord(password) : null;
    const payload = {
      access_key: EMPLOYEE_ACCESS_KEY,
      username,
      password_salt: passwordRecord?.salt || current?.password_salt,
      password_hash: passwordRecord?.hash || current?.password_hash,
      password_iterations: passwordRecord?.iterations || current?.password_iterations || 120000,
      token_secret: current?.token_secret || randomSecret(36),
      enabled,
      session_duration_minutes: 480,
      session_version: (current?.session_version || 0) + 1,
      updated_by: user.id
    };
    if (!payload.password_salt || !payload.password_hash) throw new Error("La configuración necesita una contraseña.");

    const { error: saveError } = await client.from("employee_public_access_settings").upsert(payload, { onConflict: "access_key" });
    if (saveError) throw new Error(`No se pudo guardar el acceso público: ${saveError.message}`);

    await client.from("document_audit_log").insert({
      entity_type: "employee_public_access",
      entity_id: EMPLOYEE_ACCESS_KEY,
      action: current ? "update" : "create",
      actor_user_id: user.id,
      actor_email: email,
      previous_data: current ? { username: current.username, enabled: current.enabled, session_version: current.session_version } : null,
      new_data: { username, enabled, password_changed: Boolean(password), session_version: payload.session_version },
      detail: { phase: "2B.2", public_url: publicUrl() }
    });

    return jsonResponse(request, {
      configured: true,
      enabled,
      username,
      password_configured: true,
      public_url: publicUrl(),
      sessions_invalidated: true
    });
  } catch (error) {
    return jsonResponse(request, { error: errorMessage(error) }, 400);
  }
});
