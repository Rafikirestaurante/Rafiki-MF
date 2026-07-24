const BOGOTA_TIME_ZONE = "America/Bogota";

export function bogotaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOGOTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function bogotaDateKeyFromTimestamp(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return bogotaDateKey(date);
}

export function monthKeyFromDateKey(dateKey) {
  return String(dateKey || "").slice(0, 7);
}

export function shiftMonth(monthKey, offset) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey || ""));
  if (!match) throw new Error("Mes inválido.");
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1 + Number(offset || 0), 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(monthKey) {
  const start = `${monthKey}-01`;
  return { start, nextStart: `${shiftMonth(monthKey, 1)}-01` };
}

export function buildMonthCalendar(monthKey) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey || ""));
  if (!match) return [];
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const start = new Date(Date.UTC(year, monthIndex, 1 - mondayOffset));
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    return {
      dateKey,
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthIndex
    };
  });
}

export function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey || "").split("-").map(Number);
  if (!year || !month) return "";
  const label = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDateKeyLabel(dateKey) {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  if (!year || !month || !day) return "Fecha seleccionada";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)));
}
