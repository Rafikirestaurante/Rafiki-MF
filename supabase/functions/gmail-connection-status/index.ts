import { optionsResponse } from "../_shared/cors.ts";
import { jsonResponse, errorMessage } from "../_shared/http.ts";
import { requireAppAdmin } from "../_shared/supabase.ts";

Deno.serve(async (request: Request) => {
  const preflight = optionsResponse(request);
  if (preflight) return preflight;
  if (!["GET", "POST"].includes(request.method)) return jsonResponse(request, { error: "Método no permitido." }, 405);
  try {
    const { client } = await requireAppAdmin(request);
    const { data, error } = await client
      .from("gmail_connections")
      .select("google_email,status,connected_at,last_verified_at,last_sync_at,last_error,disconnected_at,granted_scope")
      .eq("connection_key", "principal")
      .maybeSingle();
    if (error) throw new Error(`No se pudo consultar la conexión: ${error.message}`);
    return jsonResponse(request, { configured: Boolean(data), connection: data || null });
  } catch (error) {
    return jsonResponse(request, { error: errorMessage(error) }, 403);
  }
});
