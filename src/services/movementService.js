import { supabase, supabaseConfigured } from "../supabaseClient.js";

function ensureSupabase() {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase todavía no está configurado.");
}

export async function getFinancialMovements(limit = 300) {
  ensureSupabase();
  const { data, error } = await supabase
    .from("financial_movements")
    .select("id,gmail_message_id,source,movement_type,transaction_date,transaction_at,email_received_at,detail,amount_cop,sender_email,email_subject,extraction_confidence,reference_text,extractor_version,created_at")
    .order("transaction_at", { ascending: false })
    .order("email_received_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(error.message || "No se pudieron consultar los movimientos.");
  return data || [];
}

export async function getTodayMovementSummary() {
  ensureSupabase();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());
  const { data, error } = await supabase
    .from("financial_movements")
    .select("movement_type,amount_cop")
    .eq("transaction_date", today);
  if (error) throw new Error(error.message || "No se pudo consultar el resumen de movimientos.");
  const rows = data || [];
  return rows.reduce((summary, row) => {
    summary.count += 1;
    if (row.movement_type === "income") summary.income += Number(row.amount_cop || 0);
    else summary.expense += Number(row.amount_cop || 0);
    summary.balance = summary.income - summary.expense;
    return summary;
  }, { count: 0, income: 0, expense: 0, balance: 0 });
}
