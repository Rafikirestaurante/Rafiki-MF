import React from "react";
import { EmptyState, PageHeader } from "../components/Ui.jsx";

export default function HistoryPage() {
  return (
    <>
      <PageHeader eyebrow="Trazabilidad" title="Historial" description="Consulta verificaciones cerradas, correcciones y eventos de sincronización." />
      <section className="panel-card"><EmptyState icon="history" title="No existe historial todavía" description="Los cierres documentales aparecerán aquí cuando se complete la primera jornada de verificación." /></section>
    </>
  );
}
