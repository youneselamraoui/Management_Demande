import { useEffect, useState } from "react";
import { getCapex, getConsommationCapex, getDemandes, getDetailsDemande } from "../api/client";
import { CreditCard, TrendingDown, PiggyBank, FileText, MoreHorizontal } from "lucide-react";
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import AppShell from "../components/AppShell";
import { StatCard, StatutBadge, Avatar } from "../components/ui/Primitives";
import logo from "../assets/img/logo.png";


const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const DEPT_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

export default function Dashboard({ onNavigate, user }) {
  const [consoByCapex, setConsoByCapex] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [capexes, dem] = await Promise.all([getCapex(), getDemandes()]);
      setDemandes(dem);

      const consos = await Promise.all(capexes.map((c) => getConsommationCapex(c.capexId)));
      setConsoByCapex(consos);

      const accepted = dem.filter((d) => d.statut === "Acceptee");
      const details = await Promise.all(accepted.map((d) => getDetailsDemande(d.idDemande).catch(() => [])));

      const byMonth = {};
      accepted.forEach((d, i) => {
        const dt = new Date(d.createAt);
        const key = `${dt.getFullYear()}-${dt.getMonth()}`;
        const total = (details[i] || []).reduce((s, l) => s + l.quantite * l.prix, 0);
        byMonth[key] = (byMonth[key] || 0) + total;
      });

      const now = new Date();
      const last12 = Array.from({ length: 12 }).map((_, i) => {
        const dt = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const key = `${dt.getFullYear()}-${dt.getMonth()}`;
        return { month: MONTHS[dt.getMonth()], value: byMonth[key] || 0 };
      });
      setMonthlyTrend(last12);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <AppShell active="dashboard" onNavigate={onNavigate} user={user}>
        <p className="text-destructive">{error}</p>
      </AppShell>
    );
  }
  if (loading) {
    return (
      <AppShell active="dashboard" onNavigate={onNavigate} user={user}>
        <p className="text-muted-foreground">Chargement...</p>
      </AppShell>
    );
  }

  const budgetTotal = consoByCapex.reduce((s, c) => s + (c?.budgetTotal || 0), 0);
  const totalConsomme = consoByCapex.reduce(
    (s, c) => s + (c?.parDepartement || []).reduce((s2, d) => s2 + d.montantConsomme, 0),
    0
  );
  const resteBudget = budgetTotal - totalConsomme;
  const enAttenteCount = demandes.filter((d) => d.statut === "EnAttente").length;
  const pctRestant = budgetTotal > 0 ? (resteBudget / budgetTotal) * 100 : 0;

  const consommeTrend =
    monthlyTrend.length >= 2
      ? (() => {
          const last = monthlyTrend[monthlyTrend.length - 1].value;
          const prev = monthlyTrend[monthlyTrend.length - 2].value;
          return prev > 0 ? ((last - prev) / prev) * 100 : 0;
        })()
      : 0;

  const deptTotals = {};
  consoByCapex.forEach((c) => {
    (c?.parDepartement || []).forEach((d) => {
      deptTotals[d.departementNom] = (deptTotals[d.departementNom] || 0) + d.montantConsomme;
    });
  });
  const deptData = Object.entries(deptTotals).map(([name, value], i) => ({
    name,
    value,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  const recentDemandes = [...demandes].sort((a, b) => new Date(b.createAt) - new Date(a.createAt)).slice(0, 5);

  return (
    <AppShell active="dashboard" onNavigate={onNavigate} user={user}>
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Bienvenue, {user?.name ?? "Utilisateur"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aperçu de vos Capex et demandes d'achat.</p>
        </div>
      </header>

      <section className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Budget Total" value={`${budgetTotal.toLocaleString("fr-FR")} $`} icon={<CreditCard className="size-4" />} footnote="Alloué pour l'année en cours" />
        <StatCard label="Consommé" value={`${totalConsomme.toLocaleString("fr-FR")} $`} icon={<TrendingDown className="size-4" />} trend={consommeTrend} />
        <StatCard
            label="Reste Budget"
            value={`${resteBudget.toLocaleString("fr-FR")} $`}
            icon={<img src={logo} alt="logo" className="size-4 object-contain" />}
            footnote={`${pctRestant.toFixed(0)}% disponible`}
        />

        <StatCard label="En attente" value={enAttenteCount} icon={<FileText className="size-4" />} footnote={`${demandes.length} demandes au total`} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border p-6 lg:col-span-2">
          <h2 className="font-bold">Tendance mensuelle</h2>
          <p className="text-xs text-muted-foreground">Montant consommé (demandes approuvées) sur 12 mois</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ left: 0, right: 8, top: 8 }}>
                    <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                    <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    width={64}
                    tickFormatter={(v) => v.toLocaleString("fr-FR")}
                    />
                    <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12 }}
                    formatter={(v) => [`${v.toLocaleString("fr-FR")} $`, "Montant"]}
                    />
                    <Area type="monotone" dataKey="value" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 3, fill: "var(--color-card)", strokeWidth: 2 }} />
                </AreaChart>
                </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Répartition</h2>
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </div>
          <div className="flex justify-center py-2">
            <DonutRing data={deptData} total={totalConsomme} />
          </div>
          <ul className="mt-2 space-y-2.5">
            {deptData.map((d) => {
              const pct = totalConsomme > 0 ? (d.value / totalConsomme) * 100 : 0;
              return (
                <li key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                  <span className="font-semibold">{d.value.toLocaleString("fr-FR")} $</span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{pct.toFixed(0)}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Demandes récentes</h2>
          <button className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => onNavigate("demandes")}>
            Voir tout
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-muted text-left text-xs text-muted-foreground">
                {["Demandeur", "Capex", "Statut", "RFx", "Créée le"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium first:rounded-l-lg last:rounded-r-lg">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentDemandes.map((d) => (
                <tr key={d.idDemande} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50" onClick={() => onNavigate("demandes")}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={d.utilisateurNom} />
                      {d.utilisateurNom}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{d.capexNom}</td>
                  <td className="px-4 py-4"><StatutBadge statut={d.statut} /></td>
                  <td className="px-4 py-4 text-muted-foreground">{d.rFx || "—"}</td>
                  <td className="px-4 py-4 text-muted-foreground">{new Date(d.createAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

function DonutRing({ data, total }) {
  const radius = 78;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  const gapDeg = 3;
  const MIN_VISIBLE = 4; // longueur mini garantie pour toute part > 0

  let cumulative = 0;
  const slices = data.map((d) => {
    const pct = total > 0 ? d.value / total : 0;
    const slice = { ...d, pct, offset: cumulative };
    cumulative += pct;
    return slice;
  });

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--color-muted)" strokeWidth={strokeWidth} />
      {slices.map((s) => {
        const raw = s.pct * circumference;
        if (raw <= 0) return null;
        const gap = Math.min(gapDeg, raw * 0.3); // le gap ne mange jamais plus de 30% du segment
        const segLen = Math.max(raw - gap, MIN_VISIBLE);
        return (
          <circle
            key={s.name}
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${segLen} ${circumference}`}
            strokeDashoffset={-s.offset * circumference}
            transform="rotate(-90 100 100)"
          />
        );
      })}
      <text x="100" y="96" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--color-foreground)">
        {total.toLocaleString("fr-FR")}
      </text>
      <text x="100" y="118" textAnchor="middle" fontSize="12" fill="var(--color-muted-foreground)">
        $ consommé
      </text>
    </svg>
  );
}