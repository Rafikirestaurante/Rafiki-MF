import React, { useEffect, useState } from "react";
import AppShell from "./components/AppShell.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MovementsPage from "./pages/MovementsPage.jsx";
import InvoicesPage from "./pages/InvoicesPage.jsx";
import VerificationPage from "./pages/VerificationPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import { Alert } from "./components/Ui.jsx";
import { getCurrentProfile, getSession, onAuthStateChange, signOut } from "./services/authService.js";

const pages = {
  inicio: DashboardPage,
  movimientos: MovementsPage,
  facturas: InvoicesPage,
  verificacion: VerificationPage,
  historial: HistoryPage,
  configuracion: SettingsPage
};

function LoadingScreen() {
  return <div className="loading-screen"><div className="brand-mark large">R</div><span>Cargando aplicación...</span></div>;
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [activePage, setActivePage] = useState(() => window.location.hash.replace("#", "") || "inicio");

  useEffect(() => {
    let active = true;
    getSession().then((current) => { if (active) setSession(current); }).catch(() => { if (active) setSession(null); });
    const subscription = onAuthStateChange((current) => setSession(current));
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    setProfileError("");
    getCurrentProfile()
      .then((data) => {
        if (!data) throw new Error("No se encontró el perfil del usuario. Ejecuta el SQL de instalación.");
        if (data.status !== "active") throw new Error("Este usuario está inactivo. Contacta al Administrador.");
        setProfile(data);
      })
      .catch((error) => setProfileError(error.message || "No se pudo cargar el perfil."));
  }, [session]);

  function navigate(page) {
    const safePage = pages[page] ? page : "inicio";
    setActivePage(safePage);
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}#${safePage}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function logout() {
    try { await signOut(); } catch { setSession(null); }
  }

  if (session === undefined) return <LoadingScreen />;
  if (!session) return <LoginPage />;
  if (!profile && !profileError) return <LoadingScreen />;
  if (profileError) return <div className="fatal-screen"><div className="fatal-card"><div className="brand-mark">R</div><h1>No se pudo abrir la aplicación</h1><Alert tone="danger">{profileError}</Alert><button className="primary-button" onClick={logout}>Cerrar sesión</button></div></div>;

  const Page = pages[activePage] || DashboardPage;
  return (
    <AppShell activePage={activePage} onNavigate={navigate} profile={profile} onLogout={logout}>
      <Page profile={profile} onNavigate={navigate} />
    </AppShell>
  );
}
