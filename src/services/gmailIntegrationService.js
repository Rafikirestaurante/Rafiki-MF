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
