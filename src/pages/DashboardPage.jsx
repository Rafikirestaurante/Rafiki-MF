import React, { useEffect, useState } from "react";
import { Badge, EmptyState, MetricCard, PageHeader } from "../components/Ui.jsx";
import Icon from "../components/Icons.jsx";
import { getTodayMovementSummary } from "../services/movementService.js";
import { getInvoiceSummary } from "../services/invoiceService.js";

function cop(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function DashboardPage({ onNavigate }) {
  const today = new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeZone: "America/Bogota" }).format(new Date());
  const [summary, setSummary] = useState({ count: 0, income: 0, expense: 0, balance: 0 });
  const [invoices, setInvoices] = useState({ total: 0, monthCount: 0, monthValue: 0, incomplete: 0 });

  useEffect(() => {
    getTodayMovementSummary().then(setSummary).catch(() => undefined);
    getInvoiceSummary().then(setInvoices).catch(() => undefined);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Resumen documental" title="Inicio" description={`Estado del sistema para ${today}.`} action={<button className="secondary-button" onClick={() => onNavigate("movimientos")}><Icon name="refresh" size={18} /> Abrir movimientos</button>} />

      <section className="metrics-grid">
        <MetricCard label="Movimientos detectados" value={String(summary.count)} hint="Hoy" icon="movements" />
        <MetricCard label="Ingresos informativos" value={cop(summary.income)} hint="Sin afectar Caja" icon="check" tone="positive" />
        <MetricCard label="Facturas del mes" value={String(invoices.monthCount)} hint={`${invoices.total} registradas`} icon="invoice" tone="blue" />
        <MetricCard label="Valor facturado del mes" value={cop(invoices.monthValue)} hint="Suma informativa" icon="mail" tone="warning" />
      </section>

      <section className="dashboard-columns">
        <article className="panel-card">
          <div className="panel-heading"><div><span className="eyebrow">Operación diaria</span><h2>Movimientos de hoy</h2></div><Badge tone={summary.count ? "success" : "neutral"}>{summary.count ? `${summary.count} registrado${summary.count === 1 ? "" : "s"}` : "Sin movimientos"}</Badge></div>
          <EmptyState icon="movements" title={summary.count ? "Los movimientos están disponibles" : "Todavía no hay movimientos registrados"} description={summary.count ? "Consulta el detalle, la fecha, la hora, el origen y el valor desde Movimientos." : "Usa la búsqueda rápida para consultar las alertas recientes de Bancolombia."} action={<button className="secondary-button" onClick={() => onNavigate("movimientos")}>Abrir movimientos</button>} />
        </article>

        <article className="panel-card">
          <div className="panel-heading"><div><span className="eyebrow">Facturación electrónica</span><h2>Documentos recibidos</h2></div><Badge tone={invoices.incomplete ? "warning" : invoices.total ? "success" : "neutral"}>{invoices.incomplete ? `${invoices.incomplete} por completar` : invoices.total ? "Actualizado" : "Sin facturas"}</Badge></div>
          <EmptyState icon="invoice" title={invoices.total ? `${invoices.total} factura${invoices.total === 1 ? "" : "s"} registrada${invoices.total === 1 ? "" : "s"}` : "Todavía no hay facturas registradas"} description={invoices.total ? "Consulta proveedor, NIT, número, CUFE, archivo y valor desde Facturas." : "Busca los correos recientes con archivos ZIP, XML o PDF."} action={<button className="secondary-button" onClick={() => onNavigate("facturas")}>Abrir facturas</button>} />
        </article>
      </section>
    </>
  );
}
