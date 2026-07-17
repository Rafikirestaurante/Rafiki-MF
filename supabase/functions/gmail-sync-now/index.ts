import { optionsResponse } from "../_shared/cors.ts";
import { jsonResponse, errorMessage } from "../_shared/http.ts";
import { decryptSecret } from "../_shared/crypto.ts";
import { refreshGoogleAccessToken } from "../_shared/google.ts";
import { adminClient, requireAppAdmin } from "../_shared/supabase.ts";
import { clientKeyFromRequest, requireEmployeeSession } from "../_shared/employeeAccess.ts";
import {
  BANCOLOMBIA_EXTRACTOR_VERSION,
  extractBancolombiaMovement,
  flattenText,
  htmlToText,
  isBancolombiaSender,
  senderEmail
} from "../_shared/bancolombia.ts";

type GmailListResponse = { messages?: Array<{ id: string; threadId?: string }>; nextPageToken?: string; resultSizeEstimate?: number };
type GmailBody = { size?: number; data?: string; attachmentId?: string };
type GmailPart = { mimeType?: string; filename?: string; body?: GmailBody; parts?: GmailPart[] };
type GmailMessage = {
  id: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailPart & { headers?: Array<{ name: string; value: string }> };
};
type GmailAttachment = { data?: string; size?: number };

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

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

async function partData(messageId: string, part: GmailPart, token: string): Promise<string> {
  if (part.body?.data) return decodeBase64Url(part.body.data);
  if (!part.body?.attachmentId) return "";
  const attachment = await gmailJson<GmailAttachment>(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(part.body.attachmentId)}`,
    token
  );
  return attachment.data ? decodeBase64Url(attachment.data) : "";
}

async function extractMessageText(message: GmailMessage, token: string): Promise<{ text: string; html: string }> {
  const plainParts: string[] = [];
  const htmlParts: string[] = [];

  async function walk(part?: GmailPart): Promise<void> {
    if (!part) return;
    const mime = String(part.mimeType || "").toLowerCase();
    if (mime === "text/plain") {
      const value = await partData(message.id, part, token);
      if (value) plainParts.push(value);
    } else if (mime === "text/html") {
      const value = await partData(message.id, part, token);
      if (value) htmlParts.push(value);
    }
    for (const child of part.parts || []) await walk(child);
  }

  await walk(message.payload);
  const html = htmlParts.join(" ");
  const text = flattenText(plainParts.join(" ") || htmlToText(html) || message.snippet || "");
  return { text, html };
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request: Request) => {
  const preflight = optionsResponse(request);
  if (preflight) return preflight;
  if (request.method !== "POST") return jsonResponse(request, { error: "Método no permitido." }, 405);

  let syncRunId: number | null = null;
  let operationClient: ReturnType<typeof adminClient> | null = null;
  let actorUserId: string | null = null;
  let actorEmail = "";
  let publicEmployeeAccess = false;
  let publicClientKey = "";
  try {
    const employeeToken = String(request.headers.get("x-employee-access-token") || "").trim();
    if (employeeToken) {
      operationClient = adminClient();
      const { session } = await requireEmployeeSession(request, operationClient);
      publicEmployeeAccess = true;
      publicClientKey = await clientKeyFromRequest(request);
      actorEmail = `empleado-publico:${session.username}`;

      const cutoff = new Date(Date.now() - 60 * 1000).toISOString();
      const { count: recentPublicSyncs } = await operationClient.from("employee_public_access_log")
        .select("id", { count: "exact", head: true })
        .eq("action", "sync_requested")
        .gte("created_at", cutoff);
      if ((recentPublicSyncs || 0) > 0) {
        await operationClient.from("employee_public_access_log").insert({
          action: "sync_rate_limited", success: false, client_key: publicClientKey,
          access_username: session.username, detail: { phase: "2B.2", wait_seconds: 60 }
        });
        return jsonResponse(request, { error: "La sincronización pública puede ejecutarse una vez por minuto." }, 429);
      }
      await operationClient.from("employee_public_access_log").insert({
        action: "sync_requested", success: true, client_key: publicClientKey,
        access_username: session.username, detail: { phase: "2B.2", fixed_range_days: 3 }
      });
    } else {
      const admin = await requireAppAdmin(request);
      operationClient = admin.client as ReturnType<typeof adminClient>;
      actorUserId = admin.user.id;
      actorEmail = admin.email;
    }
    if (!operationClient) throw new Error("No se pudo establecer el contexto de sincronización.");
    const client = operationClient;
    const body = await request.json().catch(() => ({}));
    const now = new Date();
    const publicFrom = new Date(now.getTime() - 2 * 86400000);
    const defaultFrom = new Date(now.getTime() - 6 * 86400000);
    const dateFrom = publicEmployeeAccess ? isoDay(publicFrom.toISOString().slice(0, 10), publicFrom) : isoDay(body.date_from, defaultFrom);
    const dateTo = publicEmployeeAccess ? isoDay(now.toISOString().slice(0, 10), now) : isoDay(body.date_to, now);
    if (dateFrom > dateTo) throw new Error("La fecha inicial no puede ser posterior a la fecha final.");

    const staleLimit = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: activeRun, error: activeError } = await client.from("gmail_sync_runs").select("id,started_at").eq("status", "running").gte("started_at", staleLimit).limit(1).maybeSingle();
    if (activeError) throw new Error(`No se pudo validar sincronizaciones activas: ${activeError.message}`);
    if (activeRun) return jsonResponse(request, { error: "Ya existe una sincronización en curso. Intenta nuevamente cuando finalice.", active_run_id: activeRun.id }, 409);

    const { data: run, error: runError } = await client.from("gmail_sync_runs").insert({
      trigger_type: "manual", status: "running", requested_by: actorUserId,
      detail: { phase: publicEmployeeAccess ? "2B.2-public" : "2B", date_from: dateFrom, date_to: dateTo, requested_by_email: actorEmail, public_employee_access: publicEmployeeAccess }
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
    const endExclusive = new Date(`${dateTo}T00:00:00-05:00`);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const before = endExclusive.toISOString().slice(0, 10).replaceAll("-", "/");
    const queryText = publicEmployeeAccess
      ? `from:alertasynotificaciones@an.notificacionesbancolombia.com after:${after} before:${before}`
      : `after:${after} before:${before}`;
    const query = encodeURIComponent(queryText);

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

    let candidatesCreated = 0;
    let candidateDuplicates = 0;
    let errors = 0;
    let bancolombiaEmails = 0;
    let movementsCreated = 0;
    let movementDuplicates = 0;
    let possibleDuplicates = 0;
    let bancolombiaUnidentified = 0;

    for (const ref of refs) {
      try {
        const message = await gmailJson<GmailMessage>(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(ref.id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
          token.access_token
        );
        const receivedAt = message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null;
        const fromHeader = header(message, "From");
        const baseMetadata = { date_header: header(message, "Date"), sender_email: senderEmail(fromHeader), phase_last_seen: "2B" };
        const candidateRow = {
          gmail_message_id: message.id,
          gmail_thread_id: message.threadId || ref.threadId || null,
          sync_run_id: syncRunId,
          internal_date: receivedAt,
          sender: fromHeader,
          recipient: header(message, "To"),
          subject: header(message, "Subject"),
          snippet: message.snippet || "",
          labels: message.labelIds || [],
          raw_metadata: baseMetadata,
          last_detected_at: new Date().toISOString()
        };
        const { data: existingCandidate, error: existingCandidateError } = await client.from("gmail_sync_candidates").select("id,processing_status,raw_metadata").eq("gmail_message_id", message.id).maybeSingle();
        if (existingCandidateError) throw existingCandidateError;
        const { error: saveCandidateError } = await client.from("gmail_sync_candidates").upsert({
          ...candidateRow,
          processing_status: existingCandidate?.processing_status || "candidate",
          raw_metadata: { ...(existingCandidate?.raw_metadata || {}), ...baseMetadata }
        }, { onConflict: "gmail_message_id" });
        if (saveCandidateError) throw saveCandidateError;
        if (existingCandidate) candidateDuplicates += 1; else candidatesCreated += 1;

        if (!isBancolombiaSender(fromHeader)) continue;
        bancolombiaEmails += 1;

        try {
          const fullMessage = await gmailJson<GmailMessage>(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(ref.id)}?format=full`,
            token.access_token
          );
          const content = await extractMessageText(fullMessage, token.access_token);
          const extraction = extractBancolombiaMovement({
            subject: header(fullMessage, "Subject") || header(message, "Subject"),
            text: content.text,
            snippet: fullMessage.snippet || message.snippet || "",
            receivedAt: receivedAt || new Date()
          });

          if (!extraction) {
            bancolombiaUnidentified += 1;
            await client.from("gmail_sync_candidates").update({
              processing_status: "ignored",
              raw_metadata: { ...baseMetadata, source_detected: "bancolombia", extraction_result: "unsupported_notification", extractor_version: BANCOLOMBIA_EXTRACTOR_VERSION }
            }).eq("gmail_message_id", message.id);
            continue;
          }

          const fingerprintSource = [
            "bancolombia",
            extraction.movement_type,
            extraction.transaction_date,
            extraction.amount_cop,
            extraction.detail.toLowerCase(),
            extraction.reference_text.toLowerCase()
          ].join("|");
          const fingerprint = await sha256Hex(fingerprintSource);
          const { data: existingMovement, error: existingMovementError } = await client.from("financial_movements")
            .select("id,extraction_status,source_metadata")
            .eq("gmail_message_id", message.id)
            .eq("movement_type", extraction.movement_type)
            .maybeSingle();
          if (existingMovementError) throw existingMovementError;

          if (existingMovement) {
            movementDuplicates += 1;
            const { error: refreshMovementError } = await client.from("financial_movements").update({
              transaction_date: extraction.transaction_date,
              transaction_at: extraction.transaction_at,
              email_received_at: receivedAt,
              detail: extraction.detail,
              amount_cop: extraction.amount_cop,
              extraction_confidence: extraction.extraction_confidence,
              extractor_version: BANCOLOMBIA_EXTRACTOR_VERSION,
              reference_text: extraction.reference_text,
              source_metadata: {
                ...(existingMovement.source_metadata || {}),
                ...extraction.source_metadata,
                last_sync_run_id: syncRunId,
                refreshed_at: new Date().toISOString()
              }
            }).eq("id", existingMovement.id);
            if (refreshMovementError) throw refreshMovementError;
          } else {
            const { data: fingerprintMatch, error: fingerprintError } = await client.from("financial_movements")
              .select("id,gmail_message_id")
              .eq("raw_fingerprint", fingerprint)
              .neq("gmail_message_id", message.id)
              .limit(1)
              .maybeSingle();
            if (fingerprintError) throw fingerprintError;
            const extractionStatus = fingerprintMatch ? "possible_duplicate" : "pending";
            if (fingerprintMatch) possibleDuplicates += 1;

            const { error: movementError } = await client.from("financial_movements").insert({
              gmail_message_id: message.id,
              gmail_thread_id: fullMessage.threadId || message.threadId || ref.threadId || null,
              source: "bancolombia",
              movement_type: extraction.movement_type,
              transaction_date: extraction.transaction_date,
              transaction_at: extraction.transaction_at,
              email_received_at: receivedAt,
              detail: extraction.detail,
              amount_cop: extraction.amount_cop,
              sender_email: senderEmail(fromHeader),
              email_subject: header(fullMessage, "Subject") || header(message, "Subject"),
              extraction_status: extractionStatus,
              extraction_confidence: extraction.extraction_confidence,
              extractor_version: BANCOLOMBIA_EXTRACTOR_VERSION,
              raw_fingerprint: fingerprint,
              reference_text: extraction.reference_text,
              source_metadata: {
                ...extraction.source_metadata,
                sync_run_id: syncRunId,
                possible_duplicate_of: fingerprintMatch?.id || null
              }
            });
            if (movementError) throw movementError;
            movementsCreated += 1;
          }

          await client.from("gmail_sync_candidates").update({
            processing_status: "processed",
            raw_metadata: {
              ...baseMetadata,
              source_detected: "bancolombia",
              extraction_result: existingMovement ? "movement_refreshed" : "movement_created",
              movement_type: extraction.movement_type,
              extractor_version: BANCOLOMBIA_EXTRACTOR_VERSION
            }
          }).eq("gmail_message_id", message.id);
        } catch (extractionError) {
          errors += 1;
          await client.from("gmail_sync_candidates").update({
            processing_status: "error",
            raw_metadata: { ...baseMetadata, source_detected: "bancolombia", extraction_result: "error", extractor_version: BANCOLOMBIA_EXTRACTOR_VERSION, error: errorMessage(extractionError) }
          }).eq("gmail_message_id", message.id);
          await client.from("processing_errors").insert({
            sync_run_id: syncRunId,
            gmail_message_id: ref.id,
            source: "bancolombia",
            stage: "movement_extraction",
            error_message: errorMessage(extractionError),
            technical_detail: { phase: "2B", extractor_version: BANCOLOMBIA_EXTRACTOR_VERSION }
          });
        }
      } catch (itemError) {
        errors += 1;
        await client.from("processing_errors").insert({
          sync_run_id: syncRunId,
          gmail_message_id: ref.id,
          source: "gmail",
          stage: "metadata",
          error_message: errorMessage(itemError),
          technical_detail: { phase: "2B" }
        });
      }
    }

    const status = errors ? (candidatesCreated || candidateDuplicates ? "partial" : "error") : "success";
    const finishedAt = new Date().toISOString();
    const detail = {
      phase: publicEmployeeAccess ? "2B.2-public" : "2B",
      date_from: dateFrom,
      date_to: dateTo,
      messages_found: refs.length,
      candidates_created: candidatesCreated,
      candidate_duplicates: candidateDuplicates,
      bancolombia_emails: bancolombiaEmails,
      movements_created: movementsCreated,
      movement_duplicates: movementDuplicates,
      possible_duplicates: possibleDuplicates,
      bancolombia_unidentified: bancolombiaUnidentified,
      extractor_version: BANCOLOMBIA_EXTRACTOR_VERSION,
      limited_to: 500
    };
    await client.from("gmail_sync_runs").update({
      status,
      finished_at: finishedAt,
      messages_scanned: refs.length,
      movements_created: movementsCreated,
      duplicates_ignored: candidateDuplicates + movementDuplicates,
      errors_count: errors,
      detail
    }).eq("id", syncRunId);
    await client.from("gmail_connections").update({ last_sync_at: finishedAt, last_error: errors ? `${errors} correo(s) presentaron errores.` : null }).eq("connection_key", "principal");
    await client.from("gmail_integration_audit").insert({
      event_type: publicEmployeeAccess ? "employee_public_sync" : "manual_sync",
      user_id: actorUserId,
      user_email: actorEmail,
      google_email: connection.google_email,
      detail: { sync_run_id: syncRunId, ...detail, errors, public_employee_access: publicEmployeeAccess }
    });

    return jsonResponse(request, {
      sync_run_id: syncRunId,
      status,
      date_from: dateFrom,
      date_to: dateTo,
      messages_found: refs.length,
      messages_scanned: refs.length,
      candidates_created: candidatesCreated,
      candidate_duplicates: candidateDuplicates,
      bancolombia_emails: bancolombiaEmails,
      movements_created: movementsCreated,
      movement_duplicates: movementDuplicates,
      possible_duplicates: possibleDuplicates,
      bancolombia_unidentified: bancolombiaUnidentified,
      duplicates_ignored: candidateDuplicates + movementDuplicates,
      errors_count: errors
    });
  } catch (error) {
    if (syncRunId && operationClient) {
      try {
        const client = operationClient;
        await client.from("gmail_sync_runs").update({
          status: "error",
          finished_at: new Date().toISOString(),
          errors_count: 1,
          detail: { phase: "2B", fatal_error: errorMessage(error), extractor_version: BANCOLOMBIA_EXTRACTOR_VERSION }
        }).eq("id", syncRunId);
        await client.from("processing_errors").insert({
          sync_run_id: syncRunId,
          source: "gmail",
          stage: "sync",
          error_message: errorMessage(error),
          technical_detail: { phase: "2B", fatal: true }
        });
      } catch { /* conservar el error original */ }
    }
    return jsonResponse(request, { error: errorMessage(error), sync_run_id: syncRunId }, 400);
  }
});
