import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { Search, Filter, ArrowUpDown, Plus, FileText, Clock, Calendar, ChevronRight, MoreHorizontal, Pencil } from "lucide-react";
import { StatutBadge, Avatar, StatCard } from "../components/ui/Primitives";
import CreateDemandeModal from "../components/CreateDemandeModal";
import { getDemandes, getDetailsDemande } from "../api/client";

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
      <div className="rounded-2xl border border-border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Demandes d'achat</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gérez et suivez l'état de vos demandes d'investissement (Capex).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-border p-2.5 text-muted-foreground hover:bg-muted" title="Plus d'options">
              <MoreHorizontal className="size-4" />
            </button>
            <button className="rounded-lg border border-border p-2.5 text-muted-foreground hover:bg-muted" title="Modifier">
              <Pencil className="size-4" />
            </button>
            <button
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={() => setShowModal(true)}
            >
              <Plus className="size-4" /> Nouvelle demande
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par N°, demandeur ou RFx..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
              onClick={() => setShowFilter((v) => !v)}
            >
              <Filter className="size-4" /> Filtrer
            </button>
            {showFilter && (
              <div className="absolute right-0 top-12 z-10 w-48 rounded-lg border border-border bg-card p-1.5 shadow-[var(--shadow-card)]">
                {["Tous", "EnAttente", "Acceptee", "Rejetee"].map((s) => (
                  <div
                    key={s}
                    onClick={() => { setStatutFilter(s); setShowFilter(false); setPage(1); }}
                    className={`cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-muted ${
                      statutFilter === s ? "font-bold" : "font-normal"
                    }`}
                  >
                    {s === "Tous" ? "Tous les statuts" : s === "EnAttente" ? "En attente" : s === "Acceptee" ? "Approuvée" : "Rejetée"}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="rounded-lg border border-border p-2.5 text-muted-foreground hover:bg-muted"
            onClick={() => setSortAsc((v) => !v)}
            title="Trier par N°"
          >
            <ArrowUpDown className="size-4" />
          </button>
        </div>
      </div>

      {loading && <p className="mt-6 text-sm text-muted-foreground">Chargement...</p>}
      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-muted text-left text-xs text-muted-foreground">
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3 font-medium">N°</th>
                  <th className="px-4 py-3 font-medium">Demandeur</th>
                  <th className="px-4 py-3 font-medium">Capex</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">RFx</th>
                  <th className="px-4 py-3 font-medium">Créée le</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Aucune demande trouvée.
                    </td>
                  </tr>
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
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3.5 text-xs text-muted-foreground">
            <span>
              Affichage de {pageItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} à{" "}
              {(page - 1) * PAGE_SIZE + pageItems.length} sur {filtered.length} demandes
            </span>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-border px-3 py-2 font-medium text-foreground hover:bg-muted disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </button>
              <button
                className="rounded-lg border border-border px-3 py-2 font-medium text-foreground hover:bg-muted disabled:opacity-50"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total demandes" value={stats.total} icon={<FileText className="size-4" />} />
        <StatCard label="En attente" value={String(stats.enAttente).padStart(2, "0")} icon={<Clock className="size-4" />} />
        <StatCard
          label={`Ce mois (${now.toLocaleDateString("fr-FR", { month: "short" })})`}
          value={stats.ceMois}
          icon={<Calendar className="size-4" />}
        />
      </div>

      {showModal && <CreateDemandeModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </AppShell>
  );
}

function DemandeRow({ demande, expanded, onToggle, details }) {
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50">
        <td className="px-4 py-3.5 text-center">
          <ChevronRight
            className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </td>
        <td className="px-4 py-3.5 font-semibold">#{demande.idDemande}</td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={demande.utilisateurNom} />
            {demande.utilisateurNom}
          </div>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5" /> {demande.capexNom}
          </div>
        </td>
        <td className="px-4 py-3.5"><StatutBadge statut={demande.statut} /></td>
        <td className="px-4 py-3.5">
          {demande.rFx ? (
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5 text-muted-foreground" /> {demande.rFx}
            </span>
          ) : (
            "—"
          )}
        </td>
        <td className="px-4 py-3.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5" /> {new Date(demande.createAt).toLocaleDateString("fr-FR")}
          </span>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={7} className="cursor-default bg-muted/40 px-6 py-4">
            <DemandeDetails details={details} />
          </td>
        </tr>
      )}
    </>
  );
}

function DemandeDetails({ details }) {
  if (!details) return <p className="text-sm text-muted-foreground">Chargement des articles...</p>;
  if (details.error) return <p className="text-sm text-destructive">{details.error}</p>;
  if (details.length === 0) return <p className="text-sm text-muted-foreground">Aucun article sur cette demande.</p>;

  const total = details.reduce((sum, d) => sum + d.quantite * d.prix, 0);

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="px-2 py-1 text-left font-semibold text-muted-foreground">Article</th>
          <th className="px-2 py-1 text-left font-semibold text-muted-foreground">Quantité</th>
          <th className="px-2 py-1 text-left font-semibold text-muted-foreground">Prix unitaire</th>
          <th className="px-2 py-1 text-left font-semibold text-muted-foreground">Sous-total</th>
          <th className="px-2 py-1 text-left font-semibold text-muted-foreground">Devis</th>
        </tr>
      </thead>
      <tbody>
        {details.map((line) => (
          <tr key={line.id} className="border-t border-border">
            <td className="px-2 py-1.5">{line.article}</td>
            <td className="px-2 py-1.5">{line.quantite}</td>
            <td className="px-2 py-1.5">{line.prix.toLocaleString("fr-FR")} MAD</td>
            <td className="px-2 py-1.5">{(line.quantite * line.prix).toLocaleString("fr-FR")} MAD</td>
            <td className="px-2 py-1.5">{line.devis || "—"}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t border-border">
          <td colSpan={3} className="px-2 py-2"><strong>Total</strong></td>
          <td colSpan={2} className="px-2 py-2"><strong>{total.toLocaleString("fr-FR")} MAD</strong></td>
        </tr>
      </tfoot>
    </table>
  );
}