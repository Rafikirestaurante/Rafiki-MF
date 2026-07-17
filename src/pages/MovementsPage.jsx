import React from "react";
import Icon from "../components/Icons.jsx";
import { EmptyState, PageHeader } from "../components/Ui.jsx";

export default function MovementsPage() {
  return (
    <>
      <PageHeader eyebrow="Bancolombia y Nequi" title="Movimientos" description="Consulta documental de ingresos, transferencias y compras detectadas en Gmail." />
      <section className="panel-card">
        <div className="filter-bar">
          <div className="search-box"><Icon name="search" size={18} /><input placeholder="Buscar detalle o valor" disabled /></div>
          <button className="filter-button" disabled><Icon name="calendar" size={17} /> Hoy</button>
          <button className="filter-button" disabled>Todos los orígenes</button>
          <button className="filter-button" disabled>Todos los estados</button>
        </div>
        <EmptyState icon="movements" title="No hay movimientos documentados" description="La tabla se habilitará cuando conectemos Gmail y activemos las reglas de extracción de Bancolombia y Nequi." />
      </section>
    </>
  );
}
