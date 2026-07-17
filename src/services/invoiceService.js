import { supabase, supabaseConfigured } from "../supabaseClient.js";

function ensureSupabase() {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase todavía no está configurado.");
}

export async function getElectronicInvoices(limit = 300) {
  ensureSupabase();
  const { data, error } = await supabase
    .from("electronic_invoices")
    .select("id,gmail_message_id,gmail_thread_id,document_type,invoice_date,due_date,supplier_name,supplier_tax_id,invoice_number,cufe,currency,subtotal_cop,tax_cop,total_cop,attachment_name,attachment_mime_type,source_file_type,document_status,extractor_version,email_received_at,email_subject,sender_email,source_metadata,created_at")
    .order("invoice_date", { ascending: false, nullsFirst: false })
    .order("email_received_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(error.message || "No se pudieron consultar las facturas electrónicas.");
  return data || [];
}

export function gmailMessageUrl(messageId) {
  return messageId ? `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(messageId)}` : "";
}

export async function getInvoiceSummary() {
  const rows = await getElectronicInvoices(500);
  const month = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit" }).format(new Date());
  const monthRows = rows.filter((row) => String(row.invoice_date || "").startsWith(month));
  return {
    total: rows.length,
    monthCount: monthRows.length,
    monthValue: monthRows.reduce((sum, row) => sum + Number(row.total_cop || 0), 0),
    incomplete: rows.filter((row) => row.document_status === "incomplete").length
  };
}
