import { useEffect, useState } from "react";
import { getCapex, getConsommationCapex, getDemandes, getDetailsDemande } from "../api/client";
import { CreditCard, TrendingDown, PiggyBank, FileText, MoreHorizontal } from "lucide-react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import AppShell from "../components/AppShell";
import { StatCard, StatutBadge, Avatar } from "../components/ui/Primitives";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const DEPT_COLORS = ["#2E5FF2", "#ED8936", "#17A34A", "#8B3FD1", "#E1483F"];

export default function Dashboard({ onNavigate, user }) {
  const [consoByCapex, setConsoByCapex] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [capexes, dem] = await Promise.all([getCapex(), getDemandes()]);
      setDemandes(dem);

      const consos = await Promise.all(capexes.map((c) => getConsommationCapex(c.capexId)));
      setConsoByCapex(consos);

      const accepted = dem.filter((d) => d.statut === "Acceptee");
      const details = await Promise.all(
        accepted.map((d) => getDetailsDemande(d.idDemande).catch(() => []))
      );

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
        <p style={{ color: "var(--red-fg)" }}>{error}</p>
      </AppShell>
    );
  }
  if (loading) {
    return (
      <AppShell active="dashboard" onNavigate={onNavigate} user={user}>
        <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
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

  const avgTrend = monthlyTrend.length
    ? monthlyTrend.reduce((s, m) => s + m.value, 0) / monthlyTrend.length
    : 0;

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

  const recentDemandes = [...demandes]
    .sort((a, b) => new Date(b.createAt) - new Date(a.createAt))
    .slice(0, 5);

  return (
    <AppShell active="dashboard" onNavigate={onNavigate} user={user}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bienvenue, {user?.name ?? "Utilisateur"}</h1>
          <p className="page-subtitle">Voici un aperçu de vos Capex et demandes d'achat.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
        <StatCard
          label="Budget Total"
          value={`${budgetTotal.toLocaleString("fr-FR")} MAD`}
          icon={<CreditCard size={16} />}
          iconBg="var(--blue-bg)"
          iconFg="var(--blue-fg)"
          footnote="Alloué pour l'année en cours"
        />
        <StatCard
          label="Consommé"
          value={`${totalConsomme.toLocaleString("fr-FR")} MAD`}
          icon={<TrendingDown size={16} />}
          iconBg="var(--orange-bg)"
          iconFg="var(--orange-fg)"
          trend={consommeTrend}
        />
        <StatCard
          label="Reste Budget"
          value={`${resteBudget.toLocaleString("fr-FR")} MAD`}
          icon={<PiggyBank size={16} />}
          iconBg="var(--green-bg)"
          iconFg="var(--green-fg)"
          footnote={`${pctRestant.toFixed(0)}% disponible`}
        />
        <StatCard
          label="En attente"
          value={enAttenteCount}
          icon={<FileText size={16} />}
          iconBg="var(--amber-bg)"
          iconFg="var(--amber-fg)"
          footnote={`${demandes.length} demandes au total`}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 20, marginBottom: 20 }}>
        <div className="card-panel">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h2 className="card-panel-title">Tendance mensuelle</h2>
              <p className="card-panel-subtitle">Montant consommé (demandes approuvées) sur 12 mois</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E5FF2" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#2E5FF2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border-soft)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} width={50} />
              <Tooltip formatter={(v) => `${v.toLocaleString("fr-FR")} MAD`} />
              <ReferenceLine
                y={avgTrend}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{ value: "Avg", position: "insideTopLeft", fontSize: 11, fill: "#94a3b8" }}
              />
              {monthlyTrend.length > 0 && (
                <ReferenceLine
                  x={monthlyTrend[monthlyTrend.length - 1].month}
                  stroke="#2E5FF2"
                  strokeDasharray="3 3"
                />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#2E5FF2"
                strokeWidth={3}
                fill="url(#trendFill)"
                dot={{ r: 3, fill: "#2E5FF2", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-panel">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 className="card-panel-title">Répartition</h2>
            <button className="icon-btn" style={{ width: 28, height: 28 }}>
              <MoreHorizontal size={15} />
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 16px" }}>
            <DonutRing data={deptData} total={totalConsomme} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {deptData.map((d) => {
              const pct = totalConsomme > 0 ? (d.value / totalConsomme) * 100 : 0;
              return (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: "var(--text-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                  <strong style={{ whiteSpace: "nowrap" }}>{d.value.toLocaleString("fr-FR")} MAD</strong>
                  <span className="badge-pill" style={{ background: "var(--gray-bg)", color: "var(--text-secondary)" }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
          <h2 className="card-panel-title" style={{ margin: 0 }}>Demandes récentes</h2>
          <button className="btn-outline" onClick={() => onNavigate("demandes")}>
            Voir tout
          </button>
        </div>
        <table className="table-clean">
          <thead>
            <tr>
              <th>Demandeur</th>
              <th>Capex</th>
              <th>Statut</th>
              <th>RFx</th>
              <th>Créée le</th>
            </tr>
          </thead>
          <tbody>
            {recentDemandes.map((d) => (
              <tr key={d.idDemande} style={{ cursor: "pointer" }} onClick={() => onNavigate("demandes")}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={d.utilisateurNom} />
                    {d.utilisateurNom}
                  </div>
                </td>
                <td>{d.capexNom}</td>
                <td><StatutBadge statut={d.statut} /></td>
                <td>{d.rFx || "—"}</td>
                <td>{new Date(d.createAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function DonutRing({ data, total }) {
  const radius = 78;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  const gapDeg = 3;

  let cumulative = 0;
  const slices = data.map((d) => {
    const pct = total > 0 ? d.value / total : 0;
    const slice = { ...d, pct, offset: cumulative };
    cumulative += pct;
    return slice;
  });

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--gray-bg)" strokeWidth={strokeWidth} />
      {slices.map((s) => {
        const segLen = Math.max(s.pct * circumference - gapDeg, 0);
        return (
          <circle
            key={s.name}
            cx="100"
            cy="100"
            r={radius}
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
      <text x="100" y="96" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text-primary)">
        {total.toLocaleString("fr-FR")}
      </text>
      <text x="100" y="118" textAnchor="middle" fontSize="12" fill="var(--text-secondary)">
        MAD consommé
      </text>
    </svg>
  );
}