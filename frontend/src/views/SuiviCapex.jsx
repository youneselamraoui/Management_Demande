// src/pages/SuiviCapex.jsx
import { useEffect, useState } from "react";
import { Layers, Download, CreditCard, Monitor, Truck, Wallet, Filter, TrendingUp, Info } from "lucide-react";
import AppShell from "../components/AppShell";
import { ProgressBar } from "../components/ui/Primitives";
import { getCapex, getConsommationCapex } from "../api/client";
import "../styles/capex-theme.css";

const DEPT_ICONS = [Monitor, Truck, CreditCard, Layers];
const DEPT_COLORS = [
  { bg: "var(--orange-bg)", fg: "var(--orange-fg)", bar: "#E08A2E" },
  { bg: "var(--blue-bg)", fg: "var(--blue-fg)", bar: "#1B6FC9" },
  { bg: "var(--green-bg)", fg: "var(--green-fg)", bar: "#1B9C5C" },
  { bg: "#F3E8FD", fg: "#8B3FD1", bar: "#8B3FD1" },
];

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
        <p style={{ color: "var(--red-fg)" }}>{error}</p>
      </AppShell>
    );
  }
  if (loading || !data) {
    return (
      <AppShell active="suivi" onNavigate={onNavigate} user={user}>
        <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
      </AppShell>
    );
  }

  const consomme = data.budgetTotal - data.resteBudget;
  const pctConsomme = data.budgetTotal > 0 ? (consomme / data.budgetTotal) * 100 : 0;
  const previsionnel = consomme + data.montantEnAttente;

  const highlighted = data.parDepartement.slice(0, 2);

  // Angles du donut (SVG) — un cercle = 2πr de circonférence, chaque part = sa proportion
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  const slices = [
    ...data.parDepartement.map((d, i) => {
      const pct = data.budgetTotal > 0 ? d.montantConsomme / data.budgetTotal : 0;
      const slice = { ...d, pct, offset: cumulative, color: DEPT_COLORS[i % DEPT_COLORS.length].bar };
      cumulative += pct;
      return slice;
    }),
  ];
  const restePct = Math.max(1 - cumulative, 0);

  return (
    <AppShell
      active="suivi"
      onNavigate={onNavigate}
      user={user}
      breadcrumb={{ label: "Tableau de bord", onClick: () => onNavigate("demandes") }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-title">Suivi Capex</h1>
          <p className="page-subtitle">Analyse détaillée de la consommation budgétaire par département.</p>
        </div>
        <div className="page-actions">
          <div className="select-pill">
            <Layers size={15} />
            <select value={selectedCapexId} onChange={(e) => setSelectedCapexId(e.target.value)}>
              {capexList.map((c) => (
                <option key={c.capexId} value={c.capexId}>{c.nomCapex}</option>
              ))}
            </select>
          </div>
          <button className="btn-outline"><Download size={15} /> Exporter</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${1 + highlighted.length}, 1fr)`, gap: 16, marginBottom: 20 }}>
        <div className="card-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>Budget Total</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{data.budgetTotal.toLocaleString("fr-FR")} MAD</div>
          </div>
          <div className="icon-chip" style={{ background: "var(--blue-bg)", color: "var(--blue-fg)" }}>
            <CreditCard size={18} />
          </div>
        </div>

        {highlighted.map((d, i) => {
          const Icon = DEPT_ICONS[i % DEPT_ICONS.length];
          const colors = DEPT_COLORS[i % DEPT_COLORS.length];
          return (
            <div key={d.departementNom} className="card-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Consommation {d.departementNom}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{d.montantConsomme.toLocaleString("fr-FR")} MAD</div>
              </div>
              <div className="icon-chip" style={{ background: colors.bg, color: colors.fg }}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 className="card-panel-title">Répartition de la consommation</h2>
              <p className="card-panel-subtitle">{data.nomCapex} — Budget total : {data.budgetTotal.toLocaleString("fr-FR")} MAD</p>
            </div>
            <span className="badge-pill" style={{ background: "var(--blue-bg)", color: "var(--blue-fg)" }}>
              {pctConsomme.toFixed(0)}% Consommé
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 20px" }}>
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r={radius} fill="none" stroke="var(--gray-bg)" strokeWidth="28" />
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
                  strokeLinecap="butt"
                />
              ))}
              <text x="110" y="105" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text-primary)">
                {consomme.toLocaleString("fr-FR")}
              </text>
              <text x="110" y="126" textAnchor="middle" fontSize="12" fill="var(--text-secondary)">
                MAD Utilisé
              </text>
            </svg>
          </div>

          <div className="info-box">
            <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Aperçu budgétaire</strong>
              La consommation totale est de {pctConsomme.toFixed(0)}% sur ce Capex.
              Le reste à engager s'élève à {data.resteBudget.toLocaleString("fr-FR")} MAD.
            </div>
          </div>
        </div>

        <div className="card-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 className="card-panel-title">Détail par département</h2>
              <p className="card-panel-subtitle">Ventilation des dépenses engagées</p>
            </div>
            <Filter size={16} color="var(--text-secondary)" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.parDepartement.map((d, i) => {
              const Icon = DEPT_ICONS[i % DEPT_ICONS.length];
              const colors = DEPT_COLORS[i % DEPT_COLORS.length];
              const pct = data.budgetTotal > 0 ? (d.montantConsomme / data.budgetTotal) * 100 : 0;
              return (
                <div key={d.departementNom} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border-soft)" }}>
                  <div className="icon-chip" style={{ background: colors.bg, color: colors.fg, width: 36, height: 36 }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{d.departementNom}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600 }}>{d.montantConsomme.toLocaleString("fr-FR")} MAD</div>
                    <span className="badge-pill" style={{ background: "var(--gray-bg)", color: "var(--text-secondary)", marginTop: 2 }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
              <div className="icon-chip" style={{ background: "var(--gray-bg)", color: "var(--text-secondary)", width: 36, height: 36 }}>
                <Wallet size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Reste budget</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Fonds disponibles</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600 }}>{data.resteBudget.toLocaleString("fr-FR")} MAD</div>
                <span className="badge-pill" style={{ background: "var(--gray-bg)", color: "var(--text-secondary)", marginTop: 2 }}>
                  {(100 - pctConsomme).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {data.montantEnAttente > 0 && (
            <div style={{ background: "var(--bg-page)", borderRadius: 10, padding: 14, marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                <TrendingUp size={15} /> Projections
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span>Prévisionnel (consommé + en attente)</span>
                <span>{previsionnel.toLocaleString("fr-FR")} MAD</span>
              </div>
              <ProgressBar percent={data.budgetTotal > 0 ? (previsionnel / data.budgetTotal) * 100 : 0} color="var(--navy)" />
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
                Estimation basée sur les demandes en cours de validation.
              </div>
            </div>
          )}

          <button className="btn-navy" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} onClick={() => onNavigate("demandes")}>
            Voir toutes les demandes →
          </button>
        </div>
      </div>
    </AppShell>
  );
}