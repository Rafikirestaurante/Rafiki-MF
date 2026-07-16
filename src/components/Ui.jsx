import React from "react";
import Icon from "./Icons.jsx";

export function Badge({ tone = "neutral", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function MetricCard({ label, value, hint, icon, tone = "default" }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-icon"><Icon name={icon} size={22} /></div>
      <div>
        <p className="metric-label">{label}</p>
        <strong className="metric-value">{value}</strong>
        {hint ? <p className="metric-hint">{hint}</p> : null}
      </div>
    </article>
  );
}

export function EmptyState({ icon = "search", title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} size={30} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action || null}
    </div>
  );
}

export function Alert({ tone = "info", children }) {
  return <div className={`alert alert-${tone}`}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </header>
  );
}
