// src/pages/DemandesPage.jsx
import { useEffect, useState } from "react";
import { Search, Filter, ArrowUpDown, Plus, FileText, Clock, Calendar, ChevronRight } from "lucide-react";
import AppShell from "../components/AppShell";
import { StatutBadge, Avatar, StatCard } from "../components/ui/Primitives";
import CreateDemandeModal from "../components/CreateDemandeModal";
import { getDemandes, getDetailsDemande } from "../api/client";
import "../styles/capex-theme.css";

const PAGE_SIZE = 5;

export default function DemandesPage({ onNavigate, user }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("Tous");
  const [showFilter, setShowFilter] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    getDemandes()
      .then(setDemandes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleCreated(newDemande) {
    setDemandes((prev) => [newDemande, ...prev]);
  }

  async function toggleExpand(id) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!detailsCache[id]) {
      try {
        const details = await getDetailsDemande(id);
        setDetailsCache((prev) => ({ ...prev, [id]: details }));
      } catch (e) {
        setDetailsCache((prev) => ({ ...prev, [id]: { error: e.message } }));
      }
    }
  }

  const filtered = demandes
    .filter((d) => statutFilter === "Tous" || d.statut === statutFilter)
    .filter((d) => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        String(d.idDemande).includes(q) ||
        d.utilisateurNom.toLowerCase().includes(q) ||
        (d.rFx || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (sortAsc ? a.idDemande - b.idDemande : b.idDemande - a.idDemande));

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const now = new Date();
  const stats = {
    total: demandes.length,
    enAttente: demandes.filter((d) => d.statut === "EnAttente").length,
    ceMois: demandes.filter((d) => {
      const dt = new Date(d.createAt);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <AppShell active="demandes" onNavigate={onNavigate} user={user}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Demandes d'achat</h1>
          <p className="page-subtitle">Gérez et suivez l'état de vos demandes d'investissement (Capex).</p>
        </div>
        <button className="btn-navy" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nouvelle demande
        </button>
      </div>

      <div className="card-panel" style={{ marginBottom: 16, padding: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border-soft)", borderRadius: 10, padding: "9px 14px" }}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Rechercher par N°, demandeur ou RFx..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ border: "none", outline: "none", flex: 1, fontSize: 14 }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <button className="btn-outline" onClick={() => setShowFilter((v) => !v)}>
            <Filter size={15} /> Filtrer
          </button>
          {showFilter && (
            <div className="card-panel" style={{ position: "absolute", top: 44, right: 0, zIndex: 10, width: 180, padding: 8 }}>
              {["Tous", "EnAttente", "Acceptee", "Rejetee"].map((s) => (
                <div
                  key={s}
                  onClick={() => { setStatutFilter(s); setShowFilter(false); setPage(1); }}
                  style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: statutFilter === s ? 700 : 400 }}
                >
                  {s === "Tous" ? "Tous les statuts" : s === "EnAttente" ? "En attente" : s === "Acceptee" ? "Approuvée" : "Rejetée"}
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-outline" onClick={() => setSortAsc((v) => !v)} title="Trier par N°">
          <ArrowUpDown size={15} />
        </button>
      </div>

      {loading && <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>}
      {error && <p style={{ color: "var(--red-fg)" }}>{error}</p>}

      {!loading && !error && (
        <div className="card-panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table-clean">
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>N°</th>
                <th>Demandeur</th>
                <th>Capex</th>
                <th>Statut</th>
                <th>RFx</th>
                <th>Créée le</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-secondary)", padding: 24 }}>Aucune demande trouvée.</td></tr>
              ) : (
                pageItems.map((d) => (
                  <DemandeRow
                    key={d.idDemande}
                    demande={d}
                    expanded={expandedId === d.idDemande}
                    onToggle={() => toggleExpand(d.idDemande)}
                    details={detailsCache[d.idDemande]}
                  />
                ))
              )}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderTop: "1px solid var(--border-soft)", fontSize: 13, color: "var(--text-secondary)" }}>
            <span>Affichage de {pageItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} à {(page - 1) * PAGE_SIZE + pageItems.length} sur {filtered.length} demandes</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Précédent</button>
              <button className="btn-outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 20 }}>
        <StatCard label="TOTAL DEMANDES" value={stats.total} icon={<FileText size={18} />} iconBg="var(--blue-bg)" iconFg="var(--blue-fg)" />
        <StatCard label="EN ATTENTE" value={String(stats.enAttente).padStart(2, "0")} icon={<Clock size={18} />} iconBg="var(--amber-bg)" iconFg="var(--amber-fg)" />
        <StatCard label={`CE MOIS (${now.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()})`} value={stats.ceMois} icon={<Calendar size={18} />} iconBg="var(--blue-bg)" iconFg="var(--blue-fg)" />
      </div>

      {showModal && (
        <CreateDemandeModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </AppShell>
  );
}

function DemandeRow({ demande, expanded, onToggle, details }) {
  return (
    <>
      <tr onClick={onToggle}>
        <td style={{ textAlign: "center" }}>
          <ChevronRight
            size={16}
            color="var(--text-secondary)"
            style={{ transition: "transform 0.15s ease", transform: expanded ? "rotate(90deg)" : "none" }}
          />
        </td>
        <td style={{ fontWeight: 600 }}>#{demande.idDemande}</td>
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={demande.utilisateurNom} />
            {demande.utilisateurNom}
          </div>
        </td>
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
            <Calendar size={14} /> {demande.capexNom}
          </div>
        </td>
        <td><StatutBadge statut={demande.statut} /></td>
        <td>
          {demande.rFx ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={14} color="var(--text-secondary)" /> {demande.rFx}
            </span>
          ) : "—"}
        </td>
        <td>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
            <Clock size={14} /> {new Date(demande.createAt).toLocaleDateString("fr-FR")}
          </span>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={7} style={{ background: "var(--bg-page)", padding: "16px 20px", cursor: "default" }}>
            <DemandeDetails details={details} />
          </td>
        </tr>
      )}
    </>
  );
}

function DemandeDetails({ details }) {
  if (!details) return <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>Chargement des articles...</p>;
  if (details.error) return <p style={{ color: "var(--red-fg)", fontSize: 13, margin: 0 }}>{details.error}</p>;
  if (details.length === 0) return <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>Aucun article sur cette demande.</p>;

  const total = details.reduce((sum, d) => sum + d.quantite * d.prix, 0);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Article</th>
          <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Quantité</th>
          <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Prix unitaire</th>
          <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Sous-total</th>
          <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Devis</th>
        </tr>
      </thead>
      <tbody>
        {details.map((line) => (
          <tr key={line.id}>
            <td style={{ padding: "6px 8px", borderTop: "1px solid var(--border-soft)" }}>{line.article}</td>
            <td style={{ padding: "6px 8px", borderTop: "1px solid var(--border-soft)" }}>{line.quantite}</td>
            <td style={{ padding: "6px 8px", borderTop: "1px solid var(--border-soft)" }}>{line.prix.toLocaleString("fr-FR")} MAD</td>
            <td style={{ padding: "6px 8px", borderTop: "1px solid var(--border-soft)" }}>{(line.quantite * line.prix).toLocaleString("fr-FR")} MAD</td>
            <td style={{ padding: "6px 8px", borderTop: "1px solid var(--border-soft)" }}>{line.devis || "—"}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3} style={{ padding: "8px", borderTop: "1px solid var(--border-soft)" }}><strong>Total</strong></td>
          <td colSpan={2} style={{ padding: "8px", borderTop: "1px solid var(--border-soft)" }}><strong>{total.toLocaleString("fr-FR")} MAD</strong></td>
        </tr>
      </tfoot>
    </table>
  );
}