import React, { useEffect, useState } from "react";
import { Badge, EmptyState, MetricCard, PageHeader } from "../components/Ui.jsx";
import Icon from "../components/Icons.jsx";
import { getTodayMovementSummary } from "../services/movementService.js";

function cop(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function DashboardPage({ onNavigate }) {
  const today = new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeZone: "America/Bogota" }).format(new Date());
  const [summary, setSummary] = useState({ count: 0, income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    getTodayMovementSummary().then(setSummary).catch(() => undefined);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Resumen documental" title="Inicio" description={`Estado del sistema para ${today}.`} action={<button className="secondary-button" onClick={() => onNavigate("movimientos")}><Icon name="refresh" size={18} /> Abrir movimientos</button>} />

      <section className="metrics-grid">
        <MetricCard label="Movimientos detectados" value={String(summary.count)} hint="Hoy" icon="movements" />
        <MetricCard label="Ingresos informativos" value={cop(summary.income)} hint="Sin afectar Caja" icon="check" tone="positive" />
        <MetricCard label="Salidas informativas" value={cop(summary.expense)} hint="Sin crear gastos" icon="invoice" tone="warning" />
        <MetricCard label="Balance informativo" value={cop(summary.balance)} hint="Ingresos menos salidas" icon="mail" tone="blue" />
      </section>

      <section className="dashboard-columns">
        <article className="panel-card">
          <div className="panel-heading">
            <div><span className="eyebrow">Operación diaria</span><h2>Movimientos de hoy</h2></div>
            <Badge tone={summary.count ? "success" : "neutral"}>{summary.count ? `${summary.count} registrado${summary.count === 1 ? "" : "s"}` : "Sin movimientos"}</Badge>
          </div>
          <EmptyState icon="movements" title={summary.count ? "Los movimientos están disponibles" : "Todavía no hay movimientos registrados"} description={summary.count ? "Consulta el detalle, la fecha, la hora, el origen y el valor desde el módulo Movimientos." : "Usa la sincronización rápida para consultar las alertas recientes de Bancolombia."} action={<button className="secondary-button" onClick={() => onNavigate("movimientos")}>Abrir movimientos</button>} />
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
