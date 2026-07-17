import React, { useEffect, useState } from "react";
import { Badge, EmptyState, MetricCard, PageHeader } from "../components/Ui.jsx";
import Icon from "../components/Icons.jsx";
import { getTodayMovementSummary } from "../services/movementService.js";

function cop(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function DashboardPage({ onNavigate }) {
  const today = new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeZone: "America/Bogota" }).format(new Date());
  const [summary, setSummary] = useState({ count: 0, income: 0, expense: 0, pending: 0 });

  useEffect(() => {
    getTodayMovementSummary().then(setSummary).catch(() => undefined);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Resumen documental" title="Inicio" description={`Estado del sistema para ${today}.`} action={<button className="secondary-button" onClick={() => onNavigate("configuracion")}><Icon name="refresh" size={18} /> Sincronizar Gmail</button>} />

      <section className="metrics-grid">
        <MetricCard label="Movimientos detectados" value={String(summary.count)} hint="Hoy" icon="movements" />
        <MetricCard label="Ingresos informativos" value={cop(summary.income)} hint="Sin afectar Caja" icon="check" tone="positive" />
        <MetricCard label="Salidas informativas" value={cop(summary.expense)} hint="Sin crear gastos" icon="invoice" tone="warning" />
        <MetricCard label="Pendientes de revisión" value={String(summary.pending)} hint="Movimientos de hoy" icon="mail" tone="blue" />
      </section>

      <section className="dashboard-columns">
        <article className="panel-card">
          <div className="panel-heading">
            <div><span className="eyebrow">Operación diaria</span><h2>Verificación de hoy</h2></div>
            <Badge tone={summary.pending ? "warning" : summary.count ? "success" : "neutral"}>{summary.pending ? `${summary.pending} pendiente${summary.pending === 1 ? "" : "s"}` : summary.count ? "Sin pendientes" : "Sin iniciar"}</Badge>
          </div>
          <EmptyState icon="check" title={summary.count ? "Los movimientos ya están disponibles" : "Todavía no hay registros para verificar"} description={summary.count ? "Puedes consultarlos en Movimientos. La edición de estados y observaciones se habilitará en la Fase 2F." : "Sincroniza Gmail para detectar alertas de Bancolombia dentro del rango seleccionado."} action={<button className="secondary-button" onClick={() => onNavigate(summary.count ? "movimientos" : "configuracion")}>{summary.count ? "Abrir movimientos" : "Abrir sincronización"}</button>} />
        </article>

        <article className="panel-card readiness-card">
          <div className="panel-heading"><div><span className="eyebrow">Preparación</span><h2>Estado del proyecto</h2></div></div>
          <div className="readiness-list">
            <div className="done"><span><Icon name="check" size={17} /></span><div><strong>Aplicación independiente</strong><small>Separada de Rafiki Pedidos</small></div></div>
            <div className="done"><span><Icon name="check" size={17} /></span><div><strong>Gmail y sincronización manual</strong><small>OAuth y lectura por rango activados</small></div></div>
            <div className="done"><span><Icon name="check" size={17} /></span><div><strong>Extractor Bancolombia</strong><small>Ingresos, transferencias y compras</small></div></div>
            <div className="pending"><span>4</span><div><strong>Siguiente: Nequi</strong><small>Clasificación de ingresos y gastos</small></div></div>
          </div>
        </article>
      </section>
    </>
  );
}
