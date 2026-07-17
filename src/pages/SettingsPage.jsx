import React, { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "../components/Icons.jsx";
import { Alert, Badge, PageHeader } from "../components/Ui.jsx";
import {
  disconnectGmail,
  getGmailConnectionStatus,
  startGmailConnection,
  testGmailConnection,
  syncGmailNow,
  getRecentSyncRuns
} from "../services/gmailIntegrationService.js";
import { getEmployeeAccessSettings, saveEmployeeAccessSettings } from "../services/employeeAccessService.js";

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
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(sevenDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [lastSync, setLastSync] = useState(null);
  const [employeeAccess, setEmployeeAccess] = useState({ configured: false, enabled: false, username: "empleados", password_configured: false, public_url: "" });
  const [employeeUsername, setEmployeeUsername] = useState("empleados");
  const [employeePassword, setEmployeePassword] = useState("");
  const [employeeEnabled, setEmployeeEnabled] = useState(false);
  const [employeeAction, setEmployeeAction] = useState("");
  const [employeeMessage, setEmployeeMessage] = useState("");
  const [employeeTone, setEmployeeTone] = useState("info");

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
      const [gmailStatus, runs, publicAccess] = await Promise.all([
        getGmailConnectionStatus(),
        getRecentSyncRuns(1),
        getEmployeeAccessSettings()
      ]);
      setStatus(gmailStatus);
      setLastSync(runs[0] || null);
      setEmployeeAccess(publicAccess);
      setEmployeeUsername(publicAccess.username || "empleados");
      setEmployeeEnabled(Boolean(publicAccess.enabled));
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


  async function synchronize() {
    setAction("sync");
    setMessage("");
    try {
      const data = await syncGmailNow(dateFrom, dateTo);
      setTone(data.errors_count ? "warning" : "success");
      setMessage(`Sincronización terminada: ${data.messages_found || 0} correos revisados, ${data.bancolombia_emails || 0} de Bancolombia y ${data.movements_created || 0} movimientos nuevos.`);
      await load();
    } catch (error) {
      setTone("danger");
      setMessage(error.message || "No se pudo sincronizar Gmail.");
    } finally {
      setAction("");
    }
  }

  async function savePublicEmployeeAccess() {
    setEmployeeAction("save");
    setEmployeeMessage("");
    try {
      const data = await saveEmployeeAccessSettings({ username: employeeUsername, password: employeePassword, enabled: employeeEnabled });
      setEmployeeAccess((current) => ({ ...current, ...data }));
      setEmployeePassword("");
      setEmployeeTone("success");
      setEmployeeMessage(`Acceso público ${data.enabled ? "activado" : "guardado como desactivado"}. Las sesiones anteriores fueron cerradas.`);
    } catch (error) {
      setEmployeeTone("danger");
      setEmployeeMessage(error.message || "No se pudo guardar el acceso para empleados.");
    } finally {
      setEmployeeAction("");
    }
  }

  async function copyEmployeeLink() {
    const link = employeeAccess.public_url || `${window.location.origin}/empleados`;
    try {
      await navigator.clipboard.writeText(link);
      setEmployeeTone("success");
      setEmployeeMessage("Enlace público copiado.");
    } catch {
      setEmployeeTone("warning");
      setEmployeeMessage(`Copia manualmente este enlace: ${link}`);
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

      <section className="panel-card sync-card">
        <div className="panel-heading">
          <div><span className="eyebrow">Fase 2B.1</span><h2>Sincronización y extractor Bancolombia</h2></div>
          <Badge tone={lastSync?.status === "success" ? "success" : lastSync?.status === "error" ? "danger" : lastSync ? "warning" : "neutral"}>
            {lastSync ? (lastSync.status === "success" ? "Completada" : lastSync.status === "partial" ? "Con novedades" : lastSync.status === "running" ? "En curso" : "Fallida") : "Sin ejecuciones"}
          </Badge>
        </div>
        <p className="panel-description">Consulta correos por rango de fechas. Las alertas válidas de Bancolombia crean movimientos informativos; los demás correos permanecen como candidatos para las siguientes etapas.</p>
        <div className="sync-controls">
          <label><span>Desde</span><input type="date" value={dateFrom} max={dateTo} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label><span>Hasta</span><input type="date" value={dateTo} min={dateFrom} max={today} onChange={(event) => setDateTo(event.target.value)} /></label>
          <button className="primary-button" onClick={synchronize} disabled={!isAdmin || !connected || Boolean(action) || !dateFrom || !dateTo}>
            <Icon name="refresh" size={18} /> {action === "sync" ? "Sincronizando..." : "Sincronizar ahora"}
          </button>
        </div>
        {lastSync ? <div className="sync-summary">
          <div><span>Última ejecución</span><strong>{formatDate(lastSync.started_at)}</strong></div>
          <div><span>Correos revisados</span><strong>{lastSync.messages_scanned || 0}</strong></div>
          <div><span>Correos Bancolombia</span><strong>{lastSync.detail?.bancolombia_emails || 0}</strong></div>
          <div><span>Movimientos creados</span><strong>{lastSync.movements_created || 0}</strong></div>
          <div><span>Ya registrados</span><strong>{lastSync.duplicates_ignored || 0}</strong></div>
          <div><span>Errores</span><strong>{lastSync.errors_count || 0}</strong></div>
        </div> : null}
        {!connected ? <Alert tone="warning">Conecta y prueba Gmail antes de ejecutar una sincronización.</Alert> : null}
      </section>

      <section className="panel-card employee-access-settings-card">
        <div className="panel-heading">
          <div><span className="eyebrow">Acceso restringido</span><h2>Enlace público para empleados</h2></div>
          <Badge tone={employeeEnabled ? "success" : "neutral"}>{employeeEnabled ? "Activo" : "Desactivado"}</Badge>
        </div>
        <p className="panel-description">Permite consultar solamente los cinco movimientos más recientes, sincronizar alertas Bancolombia de los últimos tres días y confirmar la recepción de ingresos.</p>
        {employeeMessage ? <Alert tone={employeeTone}>{employeeMessage}</Alert> : null}
        <div className="employee-access-form">
          <label><span>Nombre de acceso</span><input value={employeeUsername} maxLength={40} onChange={(event) => setEmployeeUsername(event.target.value.toLowerCase())} placeholder="empleados" disabled={!isAdmin || Boolean(employeeAction)} /></label>
          <label><span>{employeeAccess.password_configured ? "Nueva contraseña (opcional)" : "Contraseña"}</span><input type="password" value={employeePassword} maxLength={72} onChange={(event) => setEmployeePassword(event.target.value)} placeholder={employeeAccess.password_configured ? "Déjala vacía para conservar la actual" : "Mínimo 4 caracteres"} disabled={!isAdmin || Boolean(employeeAction)} /></label>
          <label className="employee-access-toggle"><input type="checkbox" checked={employeeEnabled} onChange={(event) => setEmployeeEnabled(event.target.checked)} disabled={!isAdmin || Boolean(employeeAction)} /><span>Habilitar acceso público</span></label>
        </div>
        <div className="employee-public-link-box"><span>Enlace para compartir</span><strong>{employeeAccess.public_url || `${window.location.origin}/empleados`}</strong></div>
        <div className="button-row">
          <button className="primary-button" onClick={savePublicEmployeeAccess} disabled={!isAdmin || Boolean(employeeAction) || !employeeUsername || (!employeeAccess.password_configured && employeePassword.length < 4)}><Icon name="shield" size={18} /> {employeeAction === "save" ? "Guardando..." : "Guardar acceso"}</button>
          <button className="secondary-button" onClick={copyEmployeeLink} disabled={!employeeAccess.public_url && !window.location.origin}><Icon name="check" size={18} /> Copiar enlace</button>
          <a className="secondary-button employee-link-button" href="/empleados" target="_blank" rel="noreferrer">Abrir vista pública</a>
        </div>
        <div className="employee-access-restrictions">
          <div><Icon name="check" size={16} /><span>Solo cinco movimientos</span></div>
          <div><Icon name="check" size={16} /><span>Sin acceso a Gmail ni facturas</span></div>
          <div><Icon name="check" size={16} /><span>Sesión temporal de 8 horas</span></div>
          <div><Icon name="check" size={16} /><span>Sin selección libre de fechas</span></div>
        </div>
        <Alert tone="warning">El nombre y la contraseña son compartidos. Al cambiar cualquiera de los dos, todas las sesiones públicas abiertas se cierran automáticamente.</Alert>
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
        <div><span className="eyebrow">Versión 1.2.2</span><h2>Fase 2B.2 — Acceso público para empleados</h2><p>Vista limitada con credenciales compartidas, últimos cinco movimientos, sincronización restringida y confirmación de pagos recibidos.</p></div>
        <Badge tone="blue">Fase 2B.2</Badge>
      </section>
    </>
  );
}
