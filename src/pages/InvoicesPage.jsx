import React from "react";
import Icon from "../components/Icons.jsx";
import { EmptyState, PageHeader } from "../components/Ui.jsx";

export default function InvoicesPage() {
  return (
    <>
      <PageHeader eyebrow="Documentos electrónicos" title="Facturas" description="Registro de ZIP, XML y PDF recibidos en la cuenta de correo autorizada." />
      <section className="panel-card">
        <div className="filter-bar">
          <div className="search-box"><Icon name="search" size={18} /><input placeholder="Buscar proveedor, NIT o factura" disabled /></div>
          <button className="filter-button" disabled><Icon name="calendar" size={17} /> Este mes</button>
          <button className="filter-button" disabled>Todos los estados</button>
        </div>
        <EmptyState icon="invoice" title="No hay facturas documentadas" description="En una próxima fase se leerán los archivos electrónicos y se extraerán proveedor, NIT, número, CUFE, fecha y valor." />
      </section>
    </>
  );
}
