import { supabase, supabaseConfigured } from "../supabaseClient.js";

async function describeFunctionError(error, fallback) {
  if (!error) return fallback;
  try {
    const response = error.context;
    if (response && typeof response.clone === "function") {
      const payload = await response.clone().json();
      if (payload?.error) return String(payload.error);
    }
  } catch {
    // La respuesta puede no contener JSON.
  }
  return String(error.message || fallback);
}

async function invoke(name, body = {}) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase todavía no está configurado.");
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(await describeFunctionError(error, `No se pudo ejecutar ${name}.`));
  if (data?.error) throw new Error(String(data.error));
  return data || {};
}

export const getGmailConnectionStatus = () => invoke("gmail-connection-status");
export const startGmailConnection = () => invoke("gmail-oauth-start");
export const testGmailConnection = () => invoke("gmail-test-connection");
export const disconnectGmail = () => invoke("gmail-disconnect");
export const syncGmailNow = (dateFrom, dateTo) => invoke("gmail-sync-now", { date_from: dateFrom, date_to: dateTo });

export async function getRecentSyncRuns(limit = 10) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase todavía no está configurado.");
  const { data, error } = await supabase.from("gmail_sync_runs").select("id,status,started_at,finished_at,messages_scanned,movements_created,duplicates_ignored,errors_count,detail").order("started_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message || "No se pudo consultar el historial de sincronizaciones.");
  return data || [];
}

