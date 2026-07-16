import React from "react";
import { Badge, EmptyState, PageHeader } from "../components/Ui.jsx";

export default function VerificationPage() {
  return (
    <>
      <PageHeader eyebrow="Cierre documental" title="Verificación diaria" description="Revisa todos los registros detectados y deja constancia al finalizar el día." action={<Badge tone="neutral">Sin registros</Badge>} />
      <section className="verification-summary">
        <article><span>Ingresos</span><strong>$0</strong></article>
        <article><span>Gastos</span><strong>$0</strong></article>
        <article><span>Facturas</span><strong>0</strong></article>
        <article><span>Pendientes</span><strong>0</strong></article>
      </section>
      <section className="panel-card">
        <EmptyState icon="check" title="La jornada todavía no tiene registros" description="La verificación diaria será exclusivamente informativa. No modificará Caja, Cartera, Gastos ni Pedidos." />
      </section>
    </>
  );
}
