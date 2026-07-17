import { optionsResponse } from "../_shared/cors.ts";
import { jsonResponse, errorMessage } from "../_shared/http.ts";
import { decryptSecret } from "../_shared/crypto.ts";
import { refreshGoogleAccessToken } from "../_shared/google.ts";
import { requireAppAdmin } from "../_shared/supabase.ts";

type GmailListResponse = { messages?: Array<{ id: string; threadId?: string }>; nextPageToken?: string; resultSizeEstimate?: number };
type GmailMessage = { id: string; threadId?: string; labelIds?: string[]; snippet?: string; internalDate?: string; payload?: { headers?: Array<{ name: string; value: string }> } };

function isoDay(value: unknown, fallback: Date): string {
  const text = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return fallback.toISOString().slice(0, 10);
  return text;
}

function header(message: GmailMessage, name: string): string {
  return message.payload?.headers?.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value || "";
}

async function gmailJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Gmail respondió: ${String(data.error?.message || response.statusText)}`);
  return data as T;
}

Deno.serve(async (request: Request) => {
  const preflight = optionsResponse(request);
  if (preflight) return preflight;
  if (request.method !== "POST") return jsonResponse(request, { error: "Método no permitido." }, 405);

  let syncRunId: number | null = null;
  try {
    const { client, user, email } = await requireAppAdmin(request);
    const body = await request.json().catch(() => ({}));
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 6 * 86400000);
    const dateFrom = isoDay(body.date_from, defaultFrom);
    const dateTo = isoDay(body.date_to, now);
    if (dateFrom > dateTo) throw new Error("La fecha inicial no puede ser posterior a la fecha final.");

    const staleLimit = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: activeRun, error: activeError } = await client.from("gmail_sync_runs").select("id,started_at").eq("status", "running").gte("started_at", staleLimit).limit(1).maybeSingle();
    if (activeError) throw new Error(`No se pudo validar sincronizaciones activas: ${activeError.message}`);
    if (activeRun) return jsonResponse(request, { error: "Ya existe una sincronización en curso. Intenta nuevamente cuando finalice.", active_run_id: activeRun.id }, 409);

    const { data: run, error: runError } = await client.from("gmail_sync_runs").insert({
      trigger_type: "manual", status: "running", requested_by: user.id,
      detail: { phase: "2A", date_from: dateFrom, date_to: dateTo, requested_by_email: email }
    }).select("id").single();
    if (runError) throw new Error(`No se pudo registrar el inicio: ${runError.message}`);
    syncRunId = Number(run.id);

    const { data: connection, error: connectionError } = await client.from("gmail_connections")
      .select("google_email,refresh_token_ciphertext,refresh_token_iv,status")
      .eq("connection_key", "principal").maybeSingle();
    if (connectionError) throw new Error(`No se pudo consultar Gmail: ${connectionError.message}`);
    if (!connection || connection.status !== "connected" || !connection.refresh_token_ciphertext || !connection.refresh_token_iv) throw new Error("Gmail no está conectado correctamente.");

    const refreshToken = await decryptSecret(connection.refresh_token_ciphertext, connection.refresh_token_iv);
    const token = await refreshGoogleAccessToken(refreshToken);
    const after = dateFrom.replaceAll("-", "/");
    const endExclusive = new Date(`${dateTo}T00:00:00-05:00`); endExclusive.setDate(endExclusive.getDate() + 1);
    const before = endExclusive.toISOString().slice(0, 10).replaceAll("-", "/");
    const query = encodeURIComponent(`after:${after} before:${before}`);

    let pageToken = "";
    const refs: Array<{ id: string; threadId?: string }> = [];
    do {
      const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=100`);
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const page = await gmailJson<GmailListResponse>(url.toString(), token.access_token);
      refs.push(...(page.messages || []));
      pageToken = page.nextPageToken || "";
      if (refs.length >= 500) break;
    } while (pageToken);

    let candidates = 0, ignored = 0, errors = 0;
    for (const ref of refs) {
      try {
        const message = await gmailJson<GmailMessage>(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(ref.id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, token.access_token);
        const row = {
          gmail_message_id: message.id,
          gmail_thread_id: message.threadId || ref.threadId || null,
          sync_run_id: syncRunId,
          internal_date: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null,
          sender: header(message, "From"), recipient: header(message, "To"), subject: header(message, "Subject"),
          snippet: message.snippet || "", labels: message.labelIds || [], processing_status: "candidate",
          raw_metadata: { date_header: header(message, "Date") }, last_detected_at: new Date().toISOString()
        };
        const { data: existing } = await client.from("gmail_sync_candidates").select("id").eq("gmail_message_id", message.id).maybeSingle();
        const { error: saveError } = await client.from("gmail_sync_candidates").upsert(row, { onConflict: "gmail_message_id" });
        if (saveError) throw saveError;
        if (existing) ignored += 1; else candidates += 1;
      } catch (itemError) {
        errors += 1;
        await client.from("processing_errors").insert({ sync_run_id: syncRunId, gmail_message_id: ref.id, source: "gmail", stage: "metadata", error_message: errorMessage(itemError), technical_detail: { phase: "2A" } });
      }
    }

    const status = errors ? (candidates || ignored ? "partial" : "error") : "success";
    const finishedAt = new Date().toISOString();
    await client.from("gmail_sync_runs").update({ status, finished_at: finishedAt, messages_scanned: refs.length, duplicates_ignored: ignored, errors_count: errors, detail: { phase: "2A", date_from: dateFrom, date_to: dateTo, candidates_created: candidates, messages_found: refs.length, limited_to: 500 } }).eq("id", syncRunId);
    await client.from("gmail_connections").update({ last_sync_at: finishedAt, last_error: errors ? `${errors} correo(s) presentaron errores.` : null }).eq("connection_key", "principal");
    await client.from("gmail_integration_audit").insert({ event_type: "manual_sync", user_id: user.id, user_email: email, google_email: connection.google_email, detail: { sync_run_id: syncRunId, date_from: dateFrom, date_to: dateTo, messages_found: refs.length, candidates_created: candidates, duplicates_ignored: ignored, errors } });

    return jsonResponse(request, { sync_run_id: syncRunId, status, date_from: dateFrom, date_to: dateTo, messages_found: refs.length, messages_scanned: refs.length, candidates_created: candidates, duplicates_ignored: ignored, errors_count: errors });
  } catch (error) {
    if (syncRunId) {
      try {
        const { client } = await requireAppAdmin(request);
        await client.from("gmail_sync_runs").update({ status: "error", finished_at: new Date().toISOString(), errors_count: 1, detail: { phase: "2A", fatal_error: errorMessage(error) } }).eq("id", syncRunId);
        await client.from("processing_errors").insert({ sync_run_id: syncRunId, source: "gmail", stage: "sync", error_message: errorMessage(error), technical_detail: { phase: "2A", fatal: true } });
      } catch { /* conservar el error original */ }
    }
    return jsonResponse(request, { error: errorMessage(error), sync_run_id: syncRunId }, 400);
  }
});
