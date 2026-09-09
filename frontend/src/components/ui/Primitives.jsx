import { TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";

export function StatCard({ label, value, icon, trend, footnote }) {
  const hasTrend = typeof trend === "number";
  const up = trend >= 0;
  return (
        <div className="rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
            {icon}
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <MoreHorizontal className="size-4 text-muted-foreground" />
      </div>
            <p className="mt-4 text-[32px] font-extrabold tracking-tight">{value}</p>
      {hasTrend ? (
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
              up ? "bg-success-soft text-success" : "bg-danger-soft text-destructive"
            }`}
          >
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-[11px] text-muted-foreground">vs mois dernier</span>
        </div>
      ) : footnote ? (
        <p className="mt-2 text-[11px] text-muted-foreground">{footnote}</p>
      ) : null}
    </div>
  );
}

const STATUT_STYLES = {
  EnAttente: "bg-warning-soft text-warning",
  ValidationAchat1: "bg-warning-soft text-warning",
  ValidationAchat2: "bg-warning-soft text-warning",
  ValidationChef: "bg-warning-soft text-warning",
  ValidationFinance: "bg-warning-soft text-warning",
  ValidationDirecteur: "bg-warning-soft text-warning",
  EnAttenteValidationAchat1: "bg-warning-soft text-warning",
  EnAttenteValidationAchat2: "bg-warning-soft text-warning",
  EnAttenteValidationChef: "bg-warning-soft text-warning",
  EnAttenteValidationFinance: "bg-warning-soft text-warning",
  EnAttenteValidationDirecteur: "bg-warning-soft text-warning",
  BonDeCommande: "bg-success-soft text-success",
  Acceptee: "bg-success-soft text-success",
  Rejetee: "bg-danger-soft text-destructive",
  RefuseeAchat1: "bg-danger-soft text-destructive",
  RefuseeAchat2: "bg-danger-soft text-destructive",
  RefuseeChef: "bg-danger-soft text-destructive",
  RefuseeFinance: "bg-danger-soft text-destructive",
  RefuseeDirecteur: "bg-danger-soft text-destructive",
};
const STATUT_LABELS = {
  EnAttente: "En attente",
  ValidationAchat1: "En attente validation achat1",
  ValidationAchat2: "En attente validation achat2",
  ValidationChef: "En attente validation chef",
  ValidationFinance: "En attente validation finance",
  ValidationDirecteur: "En attente validation directeur",
  EnAttenteValidationAchat1: "En attente validation achat1",
  EnAttenteValidationAchat2: "En attente validation achat2",
  EnAttenteValidationChef: "En attente validation chef",
  EnAttenteValidationFinance: "En attente validation finance",
  EnAttenteValidationDirecteur: "En attente validation directeur",
  BonDeCommande: "Bon commande",
  Acceptee: "Bon commande",
  Rejetee: "Rejetée",
  RefuseeAchat1: "Refusée achat1",
  RefuseeAchat2: "Refusée achat2",
  RefuseeChef: "Refusée chef",
  RefuseeFinance: "Refusée finance",
  RefuseeDirecteur: "Refusée directeur",
};

export function StatutBadge({ statut }) {
  return (
    <span
      className={`inline-flex max-w-full items-center justify-center truncate rounded-full px-2 py-1 text-center text-[11px] font-semibold leading-none ${
        STATUT_STYLES[statut] ?? "bg-muted text-muted-foreground"
      }`}
      title={STATUT_LABELS[statut] ?? statut}
    >
      {STATUT_LABELS[statut] ?? statut}
    </span>
  );
}

export function Avatar({ name = "" }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
      {initials}
    </div>
  );
}

export function ProgressBar({ percent, color }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.min(Math.max(percent, 0), 100)}%`, backgroundColor: color ?? "var(--color-primary)" }}
      />
    </div>
  );
}
