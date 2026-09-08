import { useEffect, useRef, useState } from "react";
import AppShell from "../components/AppShell";
import { Search, ArrowUpDown, Plus, FileText, Clock, Calendar, ChevronRight, MoreHorizontal, Pencil, Check, X } from "lucide-react";
import { StatutBadge, Avatar, StatCard } from "../components/ui/Primitives";
import CreateDemandeModal from "../components/CreateDemandeModal";
import { getDemandes, getDetailsDemande, refuserDemande, validerDemande } from "../api/client";

const PAGE_SIZE = 5;
const STATUTS = [
  "EnAttenteValidationAchat1",
  "EnAttenteValidationAchat2",
  "EnAttenteValidationChef",
  "EnAttenteValidationFinance",
  "EnAttenteValidationDirecteur",
  "BonDeCommande",
  "RefuseeAchat1",
  "RefuseeAchat2",
  "RefuseeChef",
  "RefuseeFinance",
  "RefuseeDirecteur",
];
const STATUT_LABELS = {
  EnAttenteValidationAchat1: "En attente validation achat1",
  EnAttenteValidationAchat2: "En attente validation achat2",
  EnAttenteValidationChef: "En attente validation chef",
  EnAttenteValidationFinance: "En attente validation finance",
  EnAttenteValidationDirecteur: "En attente validation directeur",
  BonDeCommande: "Bon de commande",
  RefuseeAchat1: "Refusée achat1",
  RefuseeAchat2: "Refusée achat2",
  RefuseeChef: "Refusée chef",
  RefuseeFinance: "Refusée finance",
  RefuseeDirecteur: "Refusée directeur",
};

const DEFAULT_FILTERS = {
  demandeur: "Tous",
  capex: "Tous",
  statut: "Tous",
  rfx: "Tous",
  createAt: "Tous",
  achat1: "Tous",
  achat2: "Tous",
  chef: "Tous",
  finance: "Tous",
  directeur: "Tous",
};

function formatDate(v) {
  return v ? new Date(v).toLocaleDateString("fr-FR") : "—";
}

// Options triées (alphabétique) pour une colonne texte : Demandeur, Capex, RFx...
function textOptions(list, getValue) {
  const set = new Set();
  list.forEach((item) => {
    const v = getValue(item);
    if (v) set.add(v);
  });
  return [...set]
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }))
    .map((v) => ({ value: v, label: v }));
}

// Options triées chronologiquement pour une colonne date, avec une option
// "— (non renseigné)" si certaines lignes n'ont pas encore de date.
function dateOptions(list, getRaw) {
  const map = new Map();
  let hasEmpty = false;
  list.forEach((item) => {
    const raw = getRaw(item);
    if (!raw) {
      hasEmpty = true;
      return;
    }
    const d = new Date(raw);
    const label = d.toLocaleDateString("fr-FR");
    if (!map.has(label) || d.getTime() < map.get(label)) {
      map.set(label, d.getTime());
    }
  });
  const options = [...map.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([label]) => ({ value: label, label }));
  if (hasEmpty) options.push({ value: "—", label: "— (non renseigné)" });
  return options;
}

export default function DemandesPage({ onNavigate, user }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

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

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
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

  async function traiterDemande(id, action) {
    setError(null);
    try {
      const demande = action === "valider" ? await validerDemande(id) : await refuserDemande(id);
      setDemandes((prev) => prev.map((item) => (item.idDemande === id ? demande : item)));
    } catch (e) {
      setError(e.message);
    }
  }

  // Options disponibles pour chaque filtre de colonne, dérivées des demandes chargées
  const demandeurOptions = textOptions(demandes, (d) => d.utilisateurNom);
  const capexOptions = textOptions(demandes, (d) => d.capexNom);
  const rfxOptions = textOptions(demandes, (d) => d.rFx || d.RFX);
  const statutOptions = STATUTS.map((s) => ({ value: s, label: STATUT_LABELS[s] }));
  const createAtOptions = dateOptions(demandes, (d) => d.createAt);
  const achat1Options = dateOptions(demandes, (d) => d.dateValidationAchat1);
  const achat2Options = dateOptions(demandes, (d) => d.dateValidationAchat2);
  const chefOptions = dateOptions(demandes, (d) => d.dateValidateChef);
  const financeOptions = dateOptions(demandes, (d) => d.dateValidateFinance);
  const directeurOptions = dateOptions(demandes, (d) => d.dateValidateDirecteur);

  const activeFiltersCount = Object.values(filters).filter((v) => v !== "Tous").length;

  const filtered = demandes
    .filter((d) => {
      if (filters.statut === "Tous") return !String(d.statut).startsWith("Refusee");
      return d.statut === filters.statut;
    })
    .filter((d) => filters.demandeur === "Tous" || d.utilisateurNom === filters.demandeur)
    .filter((d) => filters.capex === "Tous" || d.capexNom === filters.capex)
    .filter((d) => filters.rfx === "Tous" || (d.rFx || d.RFX) === filters.rfx)
    .filter((d) => filters.createAt === "Tous" || formatDate(d.createAt) === filters.createAt)
    .filter((d) => filters.achat1 === "Tous" || formatDate(d.dateValidationAchat1) === filters.achat1)
    .filter((d) => filters.achat2 === "Tous" || formatDate(d.dateValidationAchat2) === filters.achat2)
    .filter((d) => filters.chef === "Tous" || formatDate(d.dateValidateChef) === filters.chef)
    .filter((d) => filters.finance === "Tous" || formatDate(d.dateValidateFinance) === filters.finance)
    .filter((d) => filters.directeur === "Tous" || formatDate(d.dateValidateDirecteur) === filters.directeur)
    .filter((d) => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        String(d.idDemande).includes(q) ||
        (d.utilisateurNom || "").toLowerCase().includes(q) ||
        (d.capexNom || "").toLowerCase().includes(q) ||
        (d.statut || "").toLowerCase().includes(q) ||
        (d.rFx || d.RFX || "").toLowerCase().includes(q) ||
        formatDate(d.createAt).includes(q) ||
        formatDate(d.dateValidationAchat1).includes(q) ||
        formatDate(d.dateValidationAchat2).includes(q) ||
        formatDate(d.dateValidateChef).includes(q) ||
        formatDate(d.dateValidateFinance).includes(q) ||
        formatDate(d.dateValidateDirecteur).includes(q)
      );
    })
    .sort((a, b) => (sortAsc ? a.idDemande - b.idDemande : b.idDemande - a.idDemande));

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const now = new Date();
  const stats = {
    total: demandes.length,
    enAttente: demandes.filter((d) => d.statut?.startsWith("EnAttenteValidation")).length,
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

          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
              title="Réinitialiser les filtres"
            >
              {activeFiltersCount} filtre{activeFiltersCount > 1 ? "s" : ""}
              <X className="size-3.5" />
            </button>
          )}

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
        <div className="mt-6 rounded-2xl border border-border">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[1200px] text-sm">
              <thead>
                <tr className="bg-muted text-left text-xs text-muted-foreground [&>th:first-child]:rounded-tl-2xl [&>th:last-child]:rounded-tr-2xl">
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3 font-medium">N°</th>
                  <ColumnFilterHeader
                    label="Demandeur"
                    options={demandeurOptions}
                    selected={filters.demandeur}
                    onChange={(v) => updateFilter("demandeur", v)}
                  />
                  <ColumnFilterHeader
                    label="Capex"
                    options={capexOptions}
                    selected={filters.capex}
                    onChange={(v) => updateFilter("capex", v)}
                  />
                  <ColumnFilterHeader
                    label="Statut"
                    options={statutOptions}
                    selected={filters.statut}
                    onChange={(v) => updateFilter("statut", v)}
                    className="min-w-[190px]"
                  />
                  <ColumnFilterHeader
                    label="RFx"
                    options={rfxOptions}
                    selected={filters.rfx}
                    onChange={(v) => updateFilter("rfx", v)}
                  />
                  <ColumnFilterHeader
                    label="Créée le"
                    options={createAtOptions}
                    selected={filters.createAt}
                    onChange={(v) => updateFilter("createAt", v)}
                  />
                  <ColumnFilterHeader
                    label="Achat1"
                    options={achat1Options}
                    selected={filters.achat1}
                    onChange={(v) => updateFilter("achat1", v)}
                  />
                  <ColumnFilterHeader
                    label="Achat2"
                    options={achat2Options}
                    selected={filters.achat2}
                    onChange={(v) => updateFilter("achat2", v)}
                  />
                  <ColumnFilterHeader
                    label="Chef"
                    options={chefOptions}
                    selected={filters.chef}
                    onChange={(v) => updateFilter("chef", v)}
                    align="right"
                  />
                  <ColumnFilterHeader
                    label="Finance"
                    options={financeOptions}
                    selected={filters.finance}
                    onChange={(v) => updateFilter("finance", v)}
                    align="right"
                  />
                  <ColumnFilterHeader
                    label="Directeur"
                    options={directeurOptions}
                    selected={filters.directeur}
                    onChange={(v) => updateFilter("directeur", v)}
                    align="right"
                  />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">
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
                      onValider={() => traiterDemande(d.idDemande, "valider")}
                      onRefuser={() => traiterDemande(d.idDemande, "refuser")}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between rounded-b-2xl border-t border-border px-4 py-3.5 text-xs text-muted-foreground">
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

// En-tête de colonne avec filtre déroulant + recherche, réutilisable pour
// n'importe quelle colonne (texte, statut, ou date déjà formatée en libellé).
function ColumnFilterHeader({ label, options, selected, onChange, align = "left", className = "" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );
  const isActive = selected !== "Tous";

  function select(value) {
    onChange(value);
    setOpen(false);
    setQuery("");
  }

  return (
    <th className={`relative px-4 py-3 font-medium ${className}`} ref={ref}>
      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => setOpen((v) => !v)}>
        {label}
        <ChevronRight className={`size-3 transition-transform ${open ? "rotate-90" : ""}`} />
        {isActive && (
          <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            1
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-9 z-50 w-56 rounded-lg border border-border bg-card p-2 text-left font-normal normal-case text-foreground shadow-[var(--shadow-card)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="mb-1.5 flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            <div
              onClick={() => select("Tous")}
              className={`cursor-pointer rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
                selected === "Tous" ? "font-bold" : "font-normal"
              }`}
            >
              Tous
            </div>

            {filteredOptions.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">Aucun résultat.</p>
            ) : (
              filteredOptions.map((o) => (
                <div
                  key={o.value}
                  onClick={() => select(o.value)}
                  className={`cursor-pointer rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
                    selected === o.value ? "font-bold" : "font-normal"
                  }`}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </th>
  );
}

function DemandeRow({ demande, expanded, onToggle, details, onValider, onRefuser }) {
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
        <td className="whitespace-nowrap px-4 py-3.5"><StatutBadge statut={demande.statut} /></td>
        <td className="px-4 py-3.5">
          {demande.rFx ? (
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5 text-muted-foreground" /> {demande.rFx}
            </span>
          ) : (
            "—"
          )}
        </td>
        <td className="whitespace-nowrap px-4 py-3.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5" /> {new Date(demande.createAt).toLocaleDateString("fr-FR")}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{demande.dateValidationAchat1 ? new Date(demande.dateValidationAchat1).toLocaleDateString("fr-FR") : "—"}</td>
        <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{demande.dateValidationAchat2 ? new Date(demande.dateValidationAchat2).toLocaleDateString("fr-FR") : "—"}</td>
        <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{demande.dateValidateChef ? new Date(demande.dateValidateChef).toLocaleDateString("fr-FR") : "—"}</td>
        <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{demande.dateValidateFinance ? new Date(demande.dateValidateFinance).toLocaleDateString("fr-FR") : "—"}</td>
        <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{demande.dateValidateDirecteur ? new Date(demande.dateValidateDirecteur).toLocaleDateString("fr-FR") : "—"}</td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={12} className="cursor-default bg-muted/40 px-6 py-4">
            <DemandeDetails demande={demande} details={details} onValider={onValider} onRefuser={onRefuser} />
          </td>
        </tr>
      )}
    </>
  );
}

function DemandeDetails({ demande, details, onValider, onRefuser }) {
  const enAttente = demande.statut?.startsWith("EnAttenteValidation");
  const datesValidation = [
    ["Achat 1", demande.dateValidationAchat1],
    ["Achat 2", demande.dateValidationAchat2],
    ["Chef", demande.dateValidateChef],
    ["Finance", demande.dateValidateFinance],
    ["Directeur", demande.dateValidateDirecteur],
  ].filter(([, date]) => date);

  if (!details) return <p className="text-sm text-muted-foreground">Chargement des articles...</p>;
  if (details.error) return <p className="text-sm text-destructive">{details.error}</p>;

  const total = details.reduce((sum, d) => sum + d.quantite * d.prix, 0);

  return (
    <div>
      {datesValidation.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {datesValidation.map(([role, date]) => (
            <span key={role}>{role} : {new Date(date).toLocaleString("fr-FR")}</span>
          ))}
        </div>
      )}

      {details.length === 0 ? <p className="text-sm text-muted-foreground">Aucun article sur cette demande.</p> : <table className="w-full border-collapse text-sm">
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
            <td className="px-2 py-1.5">{line.prix.toLocaleString("fr-FR")} $</td>
            <td className="px-2 py-1.5">{(line.quantite * line.prix).toLocaleString("fr-FR")} $</td>
            <td className="px-2 py-1.5">{line.devis || "—"}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t border-border">
          <td colSpan={3} className="px-2 py-2"><strong>Total</strong></td>
          <td colSpan={2} className="px-2 py-2"><strong>{total.toLocaleString("fr-FR")} $</strong></td>
        </tr>
      </tfoot>
      </table>}
    </div>
  );
}