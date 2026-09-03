import { useEffect, useState } from "react";
import { Layers, Download, CreditCard, Monitor, Truck, Wallet, Filter, TrendingUp, Info } from "lucide-react";
import AppShell from "../components/AppShell";
import { ProgressBar, StatCard } from "../components/ui/Primitives";
import { getCapex, getConsommationCapex } from "../api/client";

const DEPT_ICONS = [Monitor, Truck, CreditCard, Layers];
const DEPT_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

export default function SuiviCapex({ onNavigate, user }) {
  const [capexList, setCapexList] = useState([]);
  const [selectedCapexId, setSelectedCapexId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCapex()
      .then((list) => {
        setCapexList(list);
        if (list.length > 0) setSelectedCapexId(list[0].capexId);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedCapexId) return;
    setLoading(true);
    getConsommationCapex(selectedCapexId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCapexId]);

  if (error) {
    return (
      <AppShell active="suivi" onNavigate={onNavigate} user={user}>
        <p className="text-destructive">{error}</p>
      </AppShell>
    );
  }
  if (loading || !data) {
    return (
      <AppShell active="suivi" onNavigate={onNavigate} user={user}>
        <p className="text-muted-foreground">Chargement...</p>
      </AppShell>
    );
  }

  const totalConsommeReel = data.parDepartement.reduce((sum, d) => sum + d.montantConsomme, 0);
  const consomme = totalConsommeReel;
  const resteBudgetReel = data.budgetTotal - totalConsommeReel;
  const pctConsomme = data.budgetTotal > 0 ? (consomme / data.budgetTotal) * 100 : 0;
  const previsionnel = consomme + data.montantEnAttente;

  const highlighted = data.parDepartement.slice(0, 2);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  const slices = data.parDepartement.map((d, i) => {
    const pct = data.budgetTotal > 0 ? d.montantConsomme / data.budgetTotal : 0;
    const slice = { ...d, pct, offset: cumulative, color: DEPT_COLORS[i % DEPT_COLORS.length] };
    cumulative += pct;
    return slice;
  });

  return (
    <AppShell
      active="suivi"
      onNavigate={onNavigate}
      user={user}
      breadcrumb={{ label: "Tableau de bord", onClick: () => onNavigate("demandes") }}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Suivi Capex</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyse détaillée de la consommation budgétaire par département.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2.5 text-sm font-medium">
            <Layers className="size-4 text-muted-foreground" />
            <select
              value={selectedCapexId}
              onChange={(e) => setSelectedCapexId(e.target.value)}
              className="bg-transparent outline-none"
            >
              {capexList.map((c) => (
                <option key={c.capexId} value={c.capexId}>{c.nomCapex}</option>
              ))}
            </select>
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
            <Download className="size-4" /> Exporter
          </button>
        </div>
      </header>

      <section
        className="mt-6 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${1 + highlighted.length}, minmax(0, 1fr))` }}
      >
        <StatCard label="Budget Total" value={`${data.budgetTotal.toLocaleString("fr-FR")} MAD`} icon={<CreditCard className="size-4" />} />
        {highlighted.map((d, i) => {
          const Icon = DEPT_ICONS[i % DEPT_ICONS.length];
          return (
            <StatCard
              key={d.departementNom}
              label={`Consommation ${d.departementNom}`}
              value={`${d.montantConsomme.toLocaleString("fr-FR")} MAD`}
              icon={<Icon className="size-4" />}
            />
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">Répartition de la consommation</h2>
              <p className="text-xs text-muted-foreground">
                {data.nomCapex} — Budget total : {data.budgetTotal.toLocaleString("fr-FR")} MAD
              </p>
            </div>
            <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              {pctConsomme.toFixed(0)}% Consommé
            </span>
          </div>

          <div className="my-5 flex justify-center">
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r={radius} fill="none" stroke="var(--color-muted)" strokeWidth="28" />
              {slices.map((s) => (
                <circle
                  key={s.departementNom}
                  cx="110" cy="110" r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="28"
                  strokeDasharray={`${s.pct * circumference} ${circumference}`}
                  strokeDashoffset={-s.offset * circumference}
                  transform="rotate(-90 110 110)"
                />
              ))}
              <text x="110" y="105" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--color-foreground)">
                {consomme.toLocaleString("fr-FR")}
              </text>
              <text x="110" y="126" textAnchor="middle" fontSize="12" fill="var(--color-muted-foreground)">
                MAD Utilisé
              </text>
            </svg>
          </div>

          <div className="flex gap-3 rounded-xl bg-accent p-4 text-sm text-accent-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <div>
              <strong className="block text-foreground">Aperçu budgétaire</strong>
              La consommation totale est de {pctConsomme.toFixed(0)}% sur ce Capex. Le reste à engager
              s'élève à {resteBudgetReel.toLocaleString("fr-FR")} MAD.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">Détail par département</h2>
              <p className="text-xs text-muted-foreground">Ventilation des dépenses engagées</p>
            </div>
            <Filter className="size-4 text-muted-foreground" />
          </div>

          <div className="mt-3">
            {data.parDepartement.map((d, i) => {
              const Icon = DEPT_ICONS[i % DEPT_ICONS.length];
              const pct = data.budgetTotal > 0 ? (d.montantConsomme / data.budgetTotal) * 100 : 0;
              return (
                <div key={d.departementNom} className="flex items-center gap-3 border-b border-border py-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 text-sm font-semibold">{d.departementNom}</div>
                  <div className="text-right">
                    <div className="font-semibold">{d.montantConsomme.toLocaleString("fr-FR")} MAD</div>
                    <span className="mt-0.5 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center gap-3 py-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Wallet className="size-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">Reste budget</div>
                <div className="text-xs text-muted-foreground">Fonds disponibles</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{resteBudgetReel.toLocaleString("fr-FR")} MAD</div>
                <span className="mt-0.5 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {(100 - pctConsomme).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {data.montantEnAttente > 0 && (
            <div className="mt-3 rounded-xl bg-muted p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="size-4" /> Projections
              </div>
              <div className="mt-2.5 flex justify-between text-sm">
                <span>Prévisionnel (consommé + en attente)</span>
                <span>{previsionnel.toLocaleString("fr-FR")} MAD</span>
              </div>
              <div className="mt-2">
                <ProgressBar percent={data.budgetTotal > 0 ? (previsionnel / data.budgetTotal) * 100 : 0} color="var(--color-primary)" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Estimation basée sur les demandes en cours de validation.
              </div>
            </div>
          )}

          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={() => onNavigate("demandes")}
          >
            Voir toutes les demandes →
          </button>
        </div>
      </section>
    </AppShell>
  );
}