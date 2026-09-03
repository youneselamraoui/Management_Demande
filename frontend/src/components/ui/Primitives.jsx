import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";

export function StatCard({ label, value, icon, iconBg, iconFg, trend, footnote }) {
  const isUp = trend !== undefined && trend >= 0;
  return (
    <div className="card-panel stat-card">
      <div className="stat-card-top">
        <div className="stat-card-icon-label">
          <div className="icon-chip icon-chip-sm" style={{ background: iconBg, color: iconFg }}>
            {icon}
          </div>
          <span className="stat-card-label">{label}</span>
        </div>
        <button className="stat-card-menu">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="stat-card-value">{value}</div>

      {trend !== undefined ? (
        <div className="stat-card-trend-row">
          <span className={`trend-badge ${isUp ? "trend-up" : "trend-down"}`}>
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="stat-card-trend-text">vs mois dernier</span>
        </div>
      ) : footnote ? (
        <div className="stat-card-footnote">{footnote}</div>
      ) : null}
    </div>
  );
}

export function StatutBadge({ statut }) {
  const map = {
    EnAttente: { label: "En attente", bg: "var(--amber-bg)", fg: "var(--amber-fg)" },
    Acceptee: { label: "Approuvée", bg: "var(--green-bg)", fg: "var(--green-fg)" },
    Rejetee: { label: "Rejetée", bg: "var(--red-bg)", fg: "var(--red-fg)" },
  };
  const s = map[statut] ?? { label: statut, bg: "var(--gray-bg)", fg: "var(--gray-fg)" };
  return (
    <span className="badge-pill" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

export function Avatar({ name = "" }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#2E5FF2", "#17A34A", "#C2820A", "#8B3FD1", "#E1483F"];
  const color = colors[name.length % colors.length];
  return (
    <div className="avatar-circle" style={{ background: color }}>
      {initials}
    </div>
  );
}

export function ProgressBar({ percent, color = "var(--navy)" }) {
  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: `${Math.min(percent, 100)}%`, background: color }}
      />
    </div>
  );
}