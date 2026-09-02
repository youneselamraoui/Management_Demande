export function StatCard({ icon, iconBg, iconFg, label, value, trend }) {
  return (
    <div className="card-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
        {trend && (
          <div style={{ fontSize: 12, color: "var(--green-fg)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
            {trend}
          </div>
        )}
      </div>
      <div className="icon-chip" style={{ background: iconBg, color: iconFg }}>
        {icon}
      </div>
    </div>
  );
}

const STATUT_STYLES = {
  EnAttente: { bg: "var(--amber-bg)", fg: "var(--amber-fg)", label: "En attente" },
  Acceptee: { bg: "var(--blue-bg)", fg: "var(--blue-fg)", label: "Approuvée" },
  Rejetee: { bg: "var(--red-bg)", fg: "var(--red-fg)", label: "Rejetée" },
};

export function StatutBadge({ statut }) {
  const s = STATUT_STYLES[statut] ?? { bg: "var(--gray-bg)", fg: "var(--gray-fg)", label: statut };
  return (
    <span className="badge-pill" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

const AVATAR_COLORS = ["#1B6FC9", "#E08A2E", "#1B9C5C", "#8B3FD1", "#C0392B", "#1C9797"];

export function Avatar({ name }) {
  const initials = (name || "?").trim().split(" ")[0].slice(0, 2).toUpperCase();
  const colorIndex = (name || "").length % AVATAR_COLORS.length;
  return (
    <div className="avatar-circle" style={{ background: AVATAR_COLORS[colorIndex] }}>
      {initials}
    </div>
  );
}

export function ProgressBar({ percent, color = "var(--navy)" }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(percent, 100)}%`, background: color }} />
    </div>
  );
}