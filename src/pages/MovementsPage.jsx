import React, { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icons.jsx";
import { Alert, Badge, EmptyState, PageHeader } from "../components/Ui.jsx";
import { syncGmailNow } from "../services/gmailIntegrationService.js";
import { getFinancialMovements } from "../services/movementService.js";

const typeLabels = {
  income: "Ingreso",
  transfer: "Transferencia",
  card_purchase: "Compra con tarjeta",
  service_payment: "Pago de servicio",
  unknown: "Sin identificar"
};

const statusLabels = {
  pending: "Por revisar",
  verified: "Confirmado",
  unidentified: "Información incompleta",
  possible_duplicate: "Revisar duplicado",
  discarded: "Descartado",
  error: "Error de lectura"
};

const statusDescriptions = {
  pending: "El movimiento fue detectado correctamente, pero todavía no ha sido revisado por una persona.",
  verified: "El registro ya fue revisado y confirmado.",
  unidentified: "El correo no contenía todos los datos necesarios para identificar el movimiento.",
  possible_duplicate: "El movimiento se parece a otro registro existente y requiere revisión.",
  discarded: "El registro fue revisado y se decidió no tenerlo en cuenta.",
  error: "Ocurrió un problema al interpretar el correo."
};

const statusTones = {
  pending: "warning",
  verified: "success",
  unidentified: "neutral",
  possible_duplicate: "danger",
  discarded: "neutral",
  error: "danger"
};

function cop(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function bogotaDay(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function movementMoment(row) {
  return row.transaction_at || row.email_received_at || row.created_at || (row.transaction_date ? `${row.transaction_date}T12:00:00-05:00` : null);
}

function formatMoment(row) {
  const value = movementMoment(row);
  if (!value) return { date: "—", time: "—" };
  try {
    const parsed = new Date(value);
    return {
      date: new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Bogota"
      }).format(parsed),
      time: new Intl.DateTimeFormat("es-CO", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Bogota"
      }).format(parsed)
    };
  } catch {
    return { date: row.transaction_date || String(value), time: "—" };
  }
}

function MovementAmount({ row }) {
  const income = row.movement_type === "income";
  return <span className={`movement-amount ${income ? "income" : "expense"}`}>{income ? "+" : "−"}{cop(row.amount_cop)}</span>;
}

export default function MovementsPage({ profile }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState(bogotaDay(-6));
  const [dateTo, setDateTo] = useState(bogotaDay());
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncTone, setSyncTone] = useState("info");

  const isAdmin = profile?.role === "admin";

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await getFinancialMovements());
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los movimientos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function synchronize() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const data = await syncGmailNow(dateFrom, dateTo);
      setSyncTone(data.errors_count ? "warning" : "success");
      setSyncMessage(`Sincronización terminada: ${data.messages_found || 0} correos revisados, ${data.bancolombia_emails || 0} de Bancolombia y ${data.movements_created || 0} movimientos nuevos.`);
      await load();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (syncError) {
      setSyncTone("danger");
      setSyncMessage(syncError.message || "No se pudo sincronizar Gmail.");
    } finally {
      setSyncing(false);
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (date && row.transaction_date !== date) return false;
      if (source !== "all" && row.source !== source) return false;
      if (status !== "all" && row.extraction_status !== status) return false;
      if (!term) return true;
      const moment = formatMoment(row);
      return [row.detail, row.reference_text, row.email_subject, row.amount_cop, typeLabels[row.movement_type], row.source, moment.date, moment.time]
        .some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [rows, search, date, source, status]);

  const latestMovement = rows[0] || null;
  const latestMoment = latestMovement ? formatMoment(latestMovement) : null;

  return (
    <>
      <PageHeader
        eyebrow="Bancolombia y Nequi"
        title="Movimientos"
        description="Consulta los movimientos detectados en Gmail. El registro más reciente siempre aparece primero."
        action={<button className="secondary-button" onClick={load} disabled={loading || syncing}><Icon name="refresh" size={18} /> Actualizar</button>}
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {syncMessage ? <Alert tone={syncTone}>{syncMessage}</Alert> : null}

      <section className="movement-sync-card">
        <div className="movement-sync-copy">
          <span className="eyebrow">Acceso directo</span>
          <strong>Sincronizar Gmail</strong>
          <small>Busca movimientos de Bancolombia dentro del rango seleccionado.</small>
        </div>
        <label><span>Desde</span><input type="date" value={dateFrom} max={dateTo} onChange={(event) => setDateFrom(event.target.value)} /></label>
        <label><span>Hasta</span><input type="date" value={dateTo} min={dateFrom} max={bogotaDay()} onChange={(event) => setDateTo(event.target.value)} /></label>
        <button className="primary-button" onClick={synchronize} disabled={!isAdmin || syncing || loading || !dateFrom || !dateTo}>
          <Icon name="refresh" size={18} /> {syncing ? "Sincronizando..." : "Sincronizar ahora"}
        </button>
      </section>
      {!isAdmin ? <Alert tone="warning">Solo el Administrador puede iniciar la sincronización. Los Revisores sí pueden consultar los movimientos.</Alert> : null}

      {latestMovement ? (
        <section className="latest-movement-card" aria-label="Último movimiento registrado">
          <div className="latest-movement-title">
            <div className="latest-icon"><Icon name="movements" size={22} /></div>
            <div><span className="eyebrow">Último movimiento</span><strong>{latestMovement.detail || "Sin detalle"}</strong><small>{typeLabels[latestMovement.movement_type] || latestMovement.movement_type} · {latestMovement.source === "bancolombia" ? "Bancolombia" : "Nequi"}</small></div>
          </div>
          <div className="latest-movement-date"><span>Fecha y hora</span><strong>{latestMoment.date}</strong><small>{latestMoment.time}</small></div>
          <MovementAmount row={latestMovement} />
        </section>
      ) : null}

      <section className="panel-card">
        <div className="filter-bar movement-filters">
          <div className="search-box"><Icon name="search" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar detalle, referencia, fecha, hora o valor" /></div>
          <label className="compact-filter"><span>Fecha</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label className="compact-filter"><span>Origen</span><select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Todos</option><option value="bancolombia">Bancolombia</option><option value="nequi">Nequi</option></select></label>
          <label className="compact-filter"><span>Revisión</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="pending">Por revisar</option><option value="verified">Confirmado</option><option value="possible_duplicate">Revisar duplicado</option><option value="unidentified">Información incompleta</option><option value="discarded">Descartado</option><option value="error">Error de lectura</option></select></label>
          {(search || date || source !== "all" || status !== "all") ? <button className="filter-button" onClick={() => { setSearch(""); setDate(""); setSource("all"); setStatus("all"); }}>Limpiar</button> : null}
        </div>

        <details className="status-help">
          <summary>¿Qué significa la columna “Revisión”?</summary>
          <p><strong>No indica si el pago está pendiente.</strong> Informa si el registro extraído del correo ya fue revisado dentro de Rafiki MF.</p>
          <div className="status-help-grid">
            {Object.entries(statusLabels).map(([key, label]) => <div key={key}><Badge tone={statusTones[key] || "neutral"}>{label}</Badge><span>{statusDescriptions[key]}</span></div>)}
          </div>
          <small>La modificación manual de estos estados se habilitará en la etapa 2F — Verificación diaria.</small>
        </details>

        {loading ? <div className="table-loading">Consultando movimientos...</div> : filtered.length === 0 ? (
          <EmptyState icon="movements" title={rows.length ? "No hay coincidencias" : "No hay movimientos documentados"} description={rows.length ? "Cambia o limpia los filtros para volver a ver los registros." : "Usa el botón Sincronizar ahora para consultar las alertas de Bancolombia."} />
        ) : (
          <>
            <div className="results-caption">{filtered.length} movimiento{filtered.length === 1 ? "" : "s"} · ordenados del más reciente al más antiguo</div>
            <div className="data-table-wrap">
              <table className="data-table movement-table">
                <thead><tr><th>Fecha y hora</th><th>Tipo y origen</th><th>Detalle</th><th>Referencia</th><th className="amount-column">Valor</th><th>Revisión</th></tr></thead>
                <tbody>{filtered.map((row) => {
                  const moment = formatMoment(row);
                  return <tr key={row.id} className={row.id === latestMovement?.id ? "latest-row" : ""}>
                    <td data-label="Fecha y hora"><div className="movement-datetime"><strong>{moment.date}</strong><small>{moment.time}</small></div></td>
                    <td data-label="Tipo y origen"><div className="movement-kind"><strong>{typeLabels[row.movement_type] || row.movement_type}</strong><small>{row.source === "bancolombia" ? "Bancolombia" : "Nequi"}</small></div></td>
                    <td data-label="Detalle"><div className="movement-detail"><strong>{row.detail || "Sin detalle"}</strong><small>{row.email_subject || "Sin asunto"}</small></div></td>
                    <td data-label="Referencia">{row.reference_text || "—"}</td>
                    <td data-label="Valor"><MovementAmount row={row} /></td>
                    <td data-label="Revisión"><Badge tone={statusTones[row.extraction_status] || "neutral"}>{statusLabels[row.extraction_status] || row.extraction_status}</Badge></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
