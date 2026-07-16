import React from "react";
import { Badge, EmptyState, MetricCard, PageHeader } from "../components/Ui.jsx";
import Icon from "../components/Icons.jsx";

export default function DashboardPage({ onNavigate }) {
  const today = new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeZone: "America/Bogota" }).format(new Date());
  return (
    <>
      <PageHeader eyebrow="Resumen documental" title="Inicio" description={`Estado del sistema para ${today}.`} action={<button className="secondary-button" onClick={() => onNavigate("configuracion")}><Icon name="refresh" size={18} /> Revisar conexión</button>} />

      <section className="metrics-grid">
        <MetricCard label="Movimientos detectados" value="0" hint="Hoy" icon="movements" />
        <MetricCard label="Ingresos informativos" value="$0" hint="Sin afectar Caja" icon="check" tone="positive" />
        <MetricCard label="Gastos informativos" value="$0" hint="Pendientes de revisión" icon="invoice" tone="warning" />
        <MetricCard label="Facturas recibidas" value="0" hint="Hoy" icon="mail" tone="blue" />
      </section>

      <section className="dashboard-columns">
        <article className="panel-card">
          <div className="panel-heading">
            <div><span className="eyebrow">Operación diaria</span><h2>Verificación de hoy</h2></div>
            <Badge tone="neutral">Sin iniciar</Badge>
          </div>
          <EmptyState icon="check" title="Todavía no hay registros para verificar" description="Cuando el motor de Gmail sea activado, aquí aparecerán los movimientos y facturas detectados durante el día." action={<button className="secondary-button" onClick={() => onNavigate("verificacion")}>Abrir verificación</button>} />
        </article>

        <article className="panel-card readiness-card">
          <div className="panel-heading"><div><span className="eyebrow">Preparación</span><h2>Estado del proyecto</h2></div></div>
          <div className="readiness-list">
            <div className="done"><span><Icon name="check" size={17} /></span><div><strong>Aplicación independiente</strong><small>Separada de Rafiki Pedidos</small></div></div>
            <div className="done"><span><Icon name="check" size={17} /></span><div><strong>Autenticación y roles</strong><small>Administrador y revisor</small></div></div>
            <div className="pending"><span>3</span><div><strong>Conectar Gmail API</strong><small>Requiere credenciales de Google Cloud</small></div></div>
            <div className="pending"><span>4</span><div><strong>Activar extractores</strong><small>Bancolombia, Nequi y XML</small></div></div>
          </div>
        </article>
      </section>
    </>
  );
}
