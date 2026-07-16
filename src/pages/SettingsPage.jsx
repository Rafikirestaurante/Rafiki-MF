import React, { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "../components/Icons.jsx";
import { Alert, Badge, PageHeader } from "../components/Ui.jsx";
import {
  disconnectGmail,
  getGmailConnectionStatus,
  startGmailConnection,
  testGmailConnection
} from "../services/gmailIntegrationService.js";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Bogota"
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export default function SettingsPage({ profile }) {
  const [status, setStatus] = useState({ configured: false, connection: null });
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("info");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const isAdmin = profile?.role === "admin";
  const connection = status.connection;
  const connected = Boolean(status.configured && connection?.status === "connected");
  const visual = useMemo(() => {
    if (connected) return { label: "Conectado", tone: "success" };
    if (connection?.status === "error") return { label: "Requiere atención", tone: "danger" };
    return { label: "Sin conectar", tone: "neutral" };
  }, [connected, connection?.status]);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setStatus(await getGmailConnectionStatus());
    } catch (error) {
      setTone("danger");
      setMessage(error.message || "No se pudo consultar la conexión con Gmail.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("gmail");
    const detail = params.get("gmail_detail") || "";
    if (result === "connected") {
      setTone("success");
      setMessage("La cuenta de Gmail quedó conectada correctamente.");
    } else if (result === "error") {
      setTone("danger");
      setMessage(detail || "Google no pudo completar la conexión.");
    }
    if (result) {
      params.delete("gmail");
      params.delete("gmail_detail");
      window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash || "#configuracion"}`);
    }
    load();
  }, [load]);

  async function connect() {
    setAction("connect");
    setMessage("");
    try {
      const data = await startGmailConnection();
      if (!data.authorization_url) throw new Error("No se recibió la dirección de autorización de Google.");
      window.location.assign(data.authorization_url);
    } catch (error) {
      setTone("danger");
      setMessage(error.message || "No se pudo iniciar la conexión.");
      setAction("");
    }
  }

  async function test() {
    setAction("test");
    setMessage("");
    try {
      const data = await testGmailConnection();
      setTone("success");
      setMessage(`Conexión confirmada con ${data.google_email || "Gmail"}.`);
      await load();
    } catch (error) {
      setTone("danger");
      setMessage(error.message || "No se pudo confirmar la conexión.");
    } finally {
      setAction("");
    }
  }

  async function disconnect() {
    setConfirmDisconnect(false);
    setAction("disconnect");
    setMessage("");
    try {
      const data = await disconnectGmail();
      setTone(data.warning ? "warning" : "success");
      setMessage(data.warning ? `La conexión se retiró. ${data.warning}` : "Gmail fue desconectado correctamente.");
      await load();
    } catch (error) {
      setTone("danger");
      setMessage(error.message || "No se pudo desconectar Gmail.");
    } finally {
      setAction("");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Administración" title="Configuración" description="Conexiones, seguridad y estado técnico de la aplicación." />

      {!isAdmin ? <Alert tone="warning">Solo un Administrador puede configurar la conexión con Gmail.</Alert> : null}
      {message ? <Alert tone={tone}>{message}</Alert> : null}

      <section className="settings-grid">
        <article className="panel-card gmail-card">
          <div className="panel-heading">
            <div className="gmail-heading"><div className="gmail-logo"><Icon name="mail" size={25} /></div><div><span className="eyebrow">Integración principal</span><h2>Gmail API</h2></div></div>
            <Badge tone={visual.tone}>{visual.label}</Badge>
          </div>
          <p className="panel-description">La aplicación solicitará acceso de solo lectura para analizar únicamente los correos definidos por las reglas documentales.</p>

          <div className="connection-details">
            <div><span>Cuenta autorizada</span><strong>{loading ? "Consultando..." : connection?.google_email || "Sin conectar"}</strong></div>
            <div><span>Fecha de conexión</span><strong>{formatDate(connection?.connected_at)}</strong></div>
            <div><span>Última prueba</span><strong>{formatDate(connection?.last_verified_at)}</strong></div>
            <div><span>Permiso</span><strong>Solo lectura</strong></div>
          </div>

          {connection?.last_error ? <Alert tone="warning"><strong>Última novedad:</strong> {connection.last_error}</Alert> : null}

          <div className="button-row">
            {!connected ? (
              <button className="primary-button" onClick={connect} disabled={!isAdmin || loading || Boolean(action)}><Icon name="mail" size={18} /> {action === "connect" ? "Abriendo Google..." : "Conectar Gmail"}</button>
            ) : (
              <>
                <button className="primary-button" onClick={test} disabled={!isAdmin || Boolean(action)}><Icon name="refresh" size={18} /> {action === "test" ? "Probando..." : "Probar conexión"}</button>
                <button className="danger-button" onClick={() => setConfirmDisconnect(true)} disabled={!isAdmin || Boolean(action)}>Desconectar</button>
              </>
            )}
            <button className="secondary-button" onClick={load} disabled={!isAdmin || loading || Boolean(action)}>Actualizar estado</button>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading"><div><span className="eyebrow">Alcance</span><h2>Separación segura</h2></div><Icon name="shield" size={25} /></div>
          <div className="scope-list">
            <div><Icon name="check" size={17} /><span>No modifica Caja</span></div>
            <div><Icon name="check" size={17} /><span>No modifica Cartera</span></div>
            <div><Icon name="check" size={17} /><span>No crea gastos</span></div>
            <div><Icon name="check" size={17} /><span>No modifica pedidos</span></div>
            <div><Icon name="check" size={17} /><span>Base Supabase independiente</span></div>
          </div>
        </article>
      </section>

      {confirmDisconnect ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setConfirmDisconnect(false)}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="disconnect-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-icon danger"><Icon name="alert" size={25} /></div>
            <h2 id="disconnect-title">Desconectar Gmail</h2>
            <p>La aplicación dejará de tener acceso de lectura a la cuenta. Los registros documentales existentes no se eliminarán.</p>
            <div className="button-row modal-actions">
              <button className="secondary-button" onClick={() => setConfirmDisconnect(false)}>Cancelar</button>
              <button className="danger-button" onClick={disconnect}>Desconectar</button>
            </div>
          </section>
        </div>
      ) : null}

      <section className="panel-card phase-card">
        <div><span className="eyebrow">Versión 1.0.0</span><h2>Fase 1A — Base independiente</h2><p>Esta entrega configura la aplicación, autenticación, roles, navegación, tablas documentales y la infraestructura OAuth. La sincronización real todavía permanece deshabilitada.</p></div>
        <Badge tone="blue">Preparada para Fase 2</Badge>
      </section>
    </>
  );
}
