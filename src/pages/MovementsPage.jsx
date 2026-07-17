import React, { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icons.jsx";
import { Alert, Badge, EmptyState, PageHeader } from "../components/Ui.jsx";
import { getFinancialMovements } from "../services/movementService.js";

const typeLabels = {
  income: "Ingreso",
  transfer: "Transferencia",
  card_purchase: "Compra con tarjeta",
  service_payment: "Pago de servicio",
  unknown: "Sin identificar"
};

const statusLabels = {
  pending: "Pendiente",
  verified: "Verificado",
  unidentified: "Sin identificar",
  possible_duplicate: "Posible duplicado",
  discarded: "Descartado",
  error: "Error"
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
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDay(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(`${value}T12:00:00-05:00`));
  } catch {
    return String(value);
  }
}

export default function MovementsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (date && row.transaction_date !== date) return false;
      if (source !== "all" && row.source !== source) return false;
      if (status !== "all" && row.extraction_status !== status) return false;
      if (!term) return true;
      return [row.detail, row.reference_text, row.email_subject, row.amount_cop, typeLabels[row.movement_type], row.source]
        .some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [rows, search, date, source, status]);

  return (
    <>
      <PageHeader
        eyebrow="Bancolombia y Nequi"
        title="Movimientos"
        description="Consulta documental de ingresos, transferencias y compras detectadas en Gmail."
        action={<button className="secondary-button" onClick={load} disabled={loading}><Icon name="refresh" size={18} /> Actualizar</button>}
      />
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <section className="panel-card">
        <div className="filter-bar movement-filters">
          <div className="search-box"><Icon name="search" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar detalle, referencia o valor" /></div>
          <label className="compact-filter"><span>Fecha</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label className="compact-filter"><span>Origen</span><select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Todos</option><option value="bancolombia">Bancolombia</option><option value="nequi">Nequi</option></select></label>
          <label className="compact-filter"><span>Estado</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="pending">Pendiente</option><option value="verified">Verificado</option><option value="possible_duplicate">Posible duplicado</option><option value="unidentified">Sin identificar</option><option value="discarded">Descartado</option><option value="error">Error</option></select></label>
          {(search || date || source !== "all" || status !== "all") ? <button className="filter-button" onClick={() => { setSearch(""); setDate(""); setSource("all"); setStatus("all"); }}>Limpiar</button> : null}
        </div>

        {loading ? <div className="table-loading">Consultando movimientos...</div> : filtered.length === 0 ? (
          <EmptyState icon="movements" title={rows.length ? "No hay coincidencias" : "No hay movimientos documentados"} description={rows.length ? "Cambia o limpia los filtros para volver a ver los registros." : "Ejecuta una sincronización que incluya correos de alertas de Bancolombia."} />
        ) : (
          <>
            <div className="results-caption">{filtered.length} movimiento{filtered.length === 1 ? "" : "s"}</div>
            <div className="data-table-wrap">
              <table className="data-table movement-table">
                <thead><tr><th>Fecha</th><th>Tipo y origen</th><th>Detalle</th><th>Referencia</th><th className="amount-column">Valor</th><th>Estado</th></tr></thead>
                <tbody>{filtered.map((row) => {
                  const income = row.movement_type === "income";
                  return <tr key={row.id}>
                    <td data-label="Fecha"><strong>{formatDay(row.transaction_date)}</strong></td>
                    <td data-label="Tipo y origen"><div className="movement-kind"><strong>{typeLabels[row.movement_type] || row.movement_type}</strong><small>{row.source === "bancolombia" ? "Bancolombia" : "Nequi"}</small></div></td>
                    <td data-label="Detalle"><div className="movement-detail"><strong>{row.detail || "Sin detalle"}</strong><small>{row.email_subject || "Sin asunto"}</small></div></td>
                    <td data-label="Referencia">{row.reference_text || "—"}</td>
                    <td data-label="Valor" className={`movement-amount ${income ? "income" : "expense"}`}>{income ? "+" : "−"}{cop(row.amount_cop)}</td>
                    <td data-label="Estado"><Badge tone={statusTones[row.extraction_status] || "neutral"}>{statusLabels[row.extraction_status] || row.extraction_status}</Badge></td>
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
