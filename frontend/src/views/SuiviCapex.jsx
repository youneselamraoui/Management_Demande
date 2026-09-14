import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Layers, Download, CreditCard, Monitor, Truck, Wallet, Filter, TrendingUp, Info, ShieldCheck, AlertTriangle, Search } from "lucide-react";
import { exportSvgAsPng } from "../utils/exportGraphe";
import { ProgressBar, StatCard } from "../components/ui/Primitives";
import DatePicker from "../components/ui/DatePicker";
import { getCapex, getConsommationCapex } from "../api/client";

const DEPT_CONFIG = {
  finance: { icon: CreditCard, color: "var(--color-chart-1)" },
  it: { icon: Monitor, color: "var(--color-chart-2)" },
  logistique: { icon: Truck, color: "#F59E0B" },
  qualite: { icon: ShieldCheck, color: "#10B981" },
  qualité: { icon: ShieldCheck, color: "#10B981" },
};
const FALLBACK_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "#8B5CF6", "#EC4899"];
const FALLBACK_ICONS = [Monitor, Truck, CreditCard, Layers, ShieldCheck];

function getDeptConfig(name, index = 0) {
  if (!name) return { icon: Layers, color: FALLBACK_COLORS[index % FALLBACK_COLORS.length] };
  const key = String(name).toLowerCase().trim();
  if (DEPT_CONFIG[key]) return DEPT_CONFIG[key];
  return { icon: FALLBACK_ICONS[index % FALLBACK_ICONS.length], color: FALLBACK_COLORS[index % FALLBACK_COLORS.length] };
}

export default function SuiviCapex() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const [capexList, setCapexList] = useState([]);
  const [selectedId, setSelectedId] = useState(routeId || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [deptSearch, setDeptSearch] = useState("");
  const svgRef = useRef(null);

  function resolveId(list, p) {
    if (!list.length) return "";
    if (p?.Id != null && p.Id !== "") {
      const byId = list.find((c) => String(c.Id) === String(p.Id));
      if (byId) return byId.Id;
    }
    if (p?.capexNom) {
      const byNom = list.find((c) => String(c.nomCapex).toLowerCase() === String(p.capexNom).toLowerCase());
      if (byNom) return byNom.Id;
    }
    return list[0].Id;
  }

  useEffect(() => {
    if (routeId) setSelectedId(routeId);
  }, [routeId]);

  useEffect(() => {
    getCapex()
      .then((list) => {
        setCapexList(list);
        if (list.length > 0) {
          if (routeId) {
            const exists = list.find((c) => String(c.Id) === String(routeId));
            setSelectedId(exists ? exists.Id : list[0].Id);
          } else if (searchParams.get("capex")) {
            setSelectedId(resolveId(list, { capexNom: searchParams.get("capex") }));
          } else if (!selectedId) {
            setSelectedId(list[0].Id);
          }
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!capexList.length) return;
    if (routeId && String(routeId) !== String(selectedId)) {
      const exists = capexList.find((c) => String(c.Id) === String(routeId));
      if (exists) setSelectedId(exists.Id);
    } else if (searchParams.get("capex")) {
      const resolved = resolveId(capexList, { capexNom: searchParams.get("capex") });
      if (resolved && String(resolved) !== String(selectedId)) setSelectedId(resolved);
    }
  }, [searchParams, capexList]);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    getConsommationCapex(selectedId, from || undefined, to || undefined)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedId, from, to]);

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }
  if (loading || !data) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  const totalConsommeReel = data.parDepartement.reduce((sum, d) => sum + d.montantConsomme, 0);
  const consomme = totalConsommeReel;
  const resteBudgetReel = data.budgetTotal - totalConsommeReel;
  const pctConsomme = data.budgetTotal > 0 ? (consomme / data.budgetTotal) * 100 : 0;
  const previsionnel = consomme + data.montantEnAttente;

  const highlighted = data ? data.parDepartement.slice(0, 2) : [];

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  const slices = data ? data.parDepartement.map((d, i) => {
    const pct = data.budgetTotal > 0 ? d.montantConsomme / data.budgetTotal : 0;
    const { color } = getDeptConfig(d.departementNom, i);
    const slice = { ...d, pct, offset: cumulative, color };
    cumulative += pct;
    return slice;
  }) : [];
  const displayParDepartement = deptSearch ? data.parDepartement.filter((d) => d.departementNom.toLowerCase().includes(deptSearch.toLowerCase())) : data.parDepartement;
  const displaySlices = deptSearch ? slices.filter((s) => s.departementNom.toLowerCase().includes(deptSearch.toLowerCase())) : slices;

  return (
    <>
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
              value={selectedId}
              onChange={(e) => { const v=e.target.value; setSelectedId(v); navigate(`/capex/${v}`); }}
              className="bg-transparent outline-none"
            >
              {capexList.map((c) => (
                <option key={c.Id} value={c.Id}>{c.nomCapex}</option>
              ))}
            </select>
          </div>
          <button
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
            onClick={() => {
              const name = `${data.nomCapex || "Capex"}_Repartition_${pctConsomme.toFixed(0)}pct`;
              const legend = slices.map((s) => ({
                label: s.departementNom,
                color: s.color,
                pct: `${((s.pct * 100).toFixed(0))}%`,
              }));
              if (resteBudgetReel > 0) legend.push({ label: "Reste budget", color: "#e2e8f0", pct: `${(100 - pctConsomme).toFixed(0)}%`, dashed: true });
              exportSvgAsPng(svgRef.current, name, 2, legend).catch((e) => alert("Export échoué: " + e.message));
            }}
            title="Exporter le graphe en PNG avec légende"
          >
            <Download className="size-4" /> Exporter PNG
          </button>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <DatePicker value={from} onChange={setFrom} placeholder="jj/mm/aaaa" />
          <span className="px-1 text-sm font-semibold text-muted-foreground">→</span>
          <DatePicker value={to} onChange={setTo} placeholder="jj/mm/aaaa" />
          {(from || to) && (
            <button
              onClick={() => { setFrom(""); setTo(""); }}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Effacer
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher département..."
            value={deptSearch}
            onChange={(e) => setDeptSearch(e.target.value)}
            className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 sm:w-52"
          />
        </div>
      </div>

      {(data.resteBudgetIncoherent || data.ResteBudgetIncoherent) && !from && !to && (
        <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Incohérence ResteBudget détectée</p>
            <p className="mt-1 text-amber-800">
              Valeur stockée en base: {(data.budgetRestantStocke ?? data.BudgetRestantStocke)?.toLocaleString("fr-FR")} $ — Valeur calculée: {(data.budgetRestantCalcule ?? data.BudgetRestantCalcule)?.toLocaleString("fr-FR")} $ (BudgetTotal - consommé). Écart: {((data.budgetRestantStocke ?? data.BudgetRestantStocke) - (data.budgetRestantCalcule ?? data.BudgetRestantCalcule))?.toLocaleString("fr-FR")} $. Modif directe SSMS détectée.
            </p>
          </div>
        </div>
      )}
      {(from || to) && (data.budgetRestantStocke ?? data.BudgetRestantStocke) !== (data.budgetRestantCalcule ?? data.BudgetRestantCalcule) && (
        <div className="mt-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <Info className="mt-0.5 size-5 shrink-0 text-blue-600" />
          <div>
            <p className="font-semibold">Filtre actif — calcul filtré</p>
            <p className="mt-1 text-blue-800">Reste affiché {(data.budgetRestantCalcule ?? data.BudgetRestantCalcule)?.toLocaleString("fr-FR")} $ correspond à l’intervalle {from || "…"} → {to || "…"} (BudgetTotal - consommé filtré). Valeur stockée globale {(data.budgetRestantStocke ?? data.BudgetRestantStocke)?.toLocaleString("fr-FR")} $ ignorée pendant le filtre.</p>
          </div>
        </div>
      )}

      <section
        className="mt-6 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${1 + highlighted.length}, minmax(0, 1fr))` }}
      >
        <StatCard label="Budget Total" value={`${data.budgetTotal.toLocaleString("fr-FR")} $`} icon={<CreditCard className="size-4" />} />
        {highlighted.map((d, i) => {
          const { icon: Icon } = getDeptConfig(d.departementNom, i);
          return (
            <StatCard
              key={d.departementNom}
              label={`Consommation ${d.departementNom}`}
              value={`${d.montantConsomme.toLocaleString("fr-FR")} $`}
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
                {data.nomCapex} — Budget total : {data.budgetTotal.toLocaleString("fr-FR")} $
              </p>
            </div>
            <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              {pctConsomme.toFixed(0)}% Consommé
            </span>
          </div>

          <div className="my-5 flex justify-center">
            <svg ref={svgRef} width="220" height="220" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r={radius} fill="none" stroke="var(--color-muted)" strokeWidth="28" />
              {(deptSearch ? displaySlices : slices).map((s) => (
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
                $ Utilisé
              </text>
            </svg>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {(deptSearch ? displaySlices : slices).map((s) => (
              <span key={`legend-${s.departementNom}`} className="flex items-center gap-1.5 text-xs font-medium">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                {s.departementNom}
              </span>
            ))}
            {resteBudgetReel > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="size-2.5 shrink-0 rounded-full bg-muted" style={{ border: "1px solid var(--color-border)" }} />
                Reste
              </span>
            )}
          </div>

          <div className="flex gap-3 rounded-xl bg-accent p-4 text-sm text-accent-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <div>
              <strong className="block text-foreground">Aperçu budgétaire</strong>
              La consommation totale est de {pctConsomme.toFixed(0)}% sur ce Capex. Le reste à engager
              s'élève à {resteBudgetReel.toLocaleString("fr-FR")} $.
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
            {(deptSearch ? displayParDepartement : data.parDepartement).map((d, i) => {
              const { icon: Icon, color } = getDeptConfig(d.departementNom, i);
              const pct = data.budgetTotal > 0 ? (d.montantConsomme / data.budgetTotal) * 100 : 0;
              return (
                <div key={d.departementNom} className="flex items-center gap-3 border-b border-border py-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg text-white" style={{ backgroundColor: color }}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {d.departementNom}
                      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                    </div>
                    <div className="text-xs text-muted-foreground">{pct.toFixed(0)}% du budget</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{d.montantConsomme.toLocaleString("fr-FR")} $</div>
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
                <div className="font-semibold">{resteBudgetReel.toLocaleString("fr-FR")} $</div>
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
                <span>{previsionnel.toLocaleString("fr-FR")} $</span>
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
            onClick={() => navigate(`/demandes?capex=${encodeURIComponent(data.nomCapex)}`)}
          >
            Voir toutes les demandes →
          </button>
        </div>
      </section>
    </>
  );
}