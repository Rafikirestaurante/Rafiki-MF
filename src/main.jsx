import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import EmployeePublicPage from "./pages/EmployeePublicPage.jsx";
import "./styles/app.css";
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {window.location.pathname.replace(/\/$/, "") === "/empleados" ? <EmployeePublicPage /> : <App />}
  </React.StrictMode>
);
