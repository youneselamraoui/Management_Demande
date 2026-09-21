import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ArrowUpDown, Plus, FileText, Clock, Calendar, ChevronRight, MoreHorizontal, Pencil, Check, X, Building2, Maximize2, Minimize2, CreditCard, Monitor, Truck, ShieldCheck, Layers, Download } from "lucide-react";
import { StatutBadge, Avatar, StatCard } from "../components/ui/Primitives";
import CreateDemandeModal from "../components/CreateDemandeModal";
import DatePicker from "../components/ui/DatePicker";
import { getDemandes, getDetailsDemande, refuserDemande, validerDemande } from "../api/client";
import { createPortal } from "react-dom";
import { exportToExcel, formatDateExcel } from "../utils/exportExcel";


const PAGE_SIZE = 10;

const DEPT_CONFIG = {
  finance: { icon: CreditCard, color: "var(--color-chart-1)" },
  it: { icon: Monitor, color: "var(--color-chart-2)" },
  logistique: { icon: Truck, color: "#F59E0B" },
  qualite: { icon: ShieldCheck, color: "#10B981" },
  qualité: { icon: ShieldCheck, color: "#10B981" },
};
function getDeptConfig(name) {
  if (!name) return { icon: Building2, color: "var(--color-muted-foreground)" };
  const k = String(name).toLowerCase().trim();
  return DEPT_CONFIG[k] ?? { icon: Building2, color: "var(--color-muted-foreground)" };
}
const STATUTS = [
  "EnAttenteValidationAchat1",
  "EnAttenteValidationAchat2",
  "EnAttenteValidationChef",
  "EnAttenteConfirmationFinance",
  "EnAttenteValidationDirecteur",
  "BonDeCommande",
  "RefuseeAchat2",
  "RefuseeFinance",
  "RefuseeDirecteur",
];
const STATUT_LABELS = {
  EnAttenteValidationAchat1: "Pending purchase validation 1",
  EnAttenteValidationAchat2: "Pending purchase validation 2",
  EnAttenteValidationChef: "Pending manager validation",
  EnAttenteValidationFinance: "Pending finance validation",
  EnAttenteConfirmationFinance: "Pending finance confirmation",
  EnAttenteValidationDirecteur: "Pending director validation",
  BonDeCommande: "Purchase Order",
  RefuseeAchat1: "Rejected purchase 1",
  RefuseeAchat2: "Rejected purchase 2",
  RefuseeChef: "Rejected by manager",
  RefuseeFinance: "Rejected by finance",
  RefuseeDirecteur: "Rejected by director",
};

const DEFAULT_FILTERS = {
  demandeur: "All",
  capex: "All",
  departement: "All",
  statut: "All",
  rfx: "All",
  createAt: "All",
  achat1: "All",
  achat2: "All",
  chef: "All",
  finance: "All",
  directeur: "All",
};

function formatDate(v) {
  return v ? new Date(v).toLocaleDateString("en-US") : "—";
}

// Options triées (alphabétique) pour une colonne texte : Demandeur, Capex, RFx...
function textOptions(list, getValue) {
  const set = new Set();
  list.forEach((item) => {
    const v = getValue(item);
    if (v) set.add(v);
  });
  return [...set]
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
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
    const label = d.toLocaleDateString("en-US");
    if (!map.has(label) || d.getTime() < map.get(label)) {
      map.set(label, d.getTime());
    }
  });
  const options = [...map.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([label]) => ({ value: label, label }));
  if (hasEmpty) options.push({ value: "—", label: "— (not set)" });
  return options;
}

export default function DemandesPage() {
  const [searchParams] = useSearchParams();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [tableExpanded, setTableExpanded] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [includeDetails, setIncludeDetails] = useState(false);
  const [exporting, setExporting] = useState(false);
  // filtre intervalle dates – même UX que SuiviCapex
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    ...(searchParams.get("capex") ? { capex: searchParams.get("capex") } : {}),
    ...(searchParams.get("departement") ? { departement: searchParams.get("departement") } : {}),
  }));

  useEffect(() => {
    const capex = searchParams.get("capex");
    const departement = searchParams.get("departement");
    if (capex && capex !== filters.capex) {
      setFilters((prev) => ({ ...prev, capex }));
      setPage(1);
    }
    if (departement && departement !== filters.departement) {
      setFilters((prev) => ({ ...prev, departement }));
      setPage(1);
    }
  }, [searchParams]);

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
    setDateFrom("");
    setDateTo("");
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
  const baseCapexOptions = textOptions(demandes, (d) => d.capexNom);
  const capexOptions = [
    { value: "With Capex", label: "With Capex" },
    { value: "Without Capex", label: "Without Capex" },
    ...baseCapexOptions,
  ];
  const departementOptions = textOptions(demandes, (d) => d.departementNom || d.DepartementNom);
  const rfxOptions = textOptions(demandes, (d) => d.rFx || d.RFX);
  const statutOptions = STATUTS.map((s) => ({ value: s, label: STATUT_LABELS[s] }));
  const createAtOptions = dateOptions(demandes, (d) => d.createAt);
  const achat1Options = dateOptions(demandes, (d) => d.dateValidationAchat1);
  const achat2Options = dateOptions(demandes, (d) => d.dateValidationAchat2);
  const chefOptions = dateOptions(demandes, (d) => d.dateValidateChef);
  const financeOptions = dateOptions(demandes, (d) => d.dateValidateFinance);
  const directeurOptions = dateOptions(demandes, (d) => d.dateValidateDirecteur);

  const activeFiltersCount = Object.values(filters).filter((v) => v !== "All").length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const filtered = demandes
    .filter((d) => {
      // date interval on Created on – same logic as Capex Tracking
      if (dateFrom || dateTo) {
        const t = d.createAt ? new Date(d.createAt) : null;
        if (!t || isNaN(t.getTime())) return false;
        if (dateFrom) {
          const fromD = new Date(dateFrom + "T00:00:00");
          if (t < fromD) return false;
        }
        if (dateTo) {
          const toD = new Date(dateTo + "T23:59:59.999");
          if (t > toD) return false;
        }
      }
      const s = String(d.statut || "");
      const norm = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isRefuse = norm.includes("refus");
      if (filters.statut === "All") return !isRefuse;
      // compare normalized to handle "BonDeCommande" vs "Bon de commande" vs "En attente confirmation finance"
      const fNorm = String(filters.statut).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
      const dNorm = norm.replace(/\s+/g, "");
      return dNorm === fNorm || s === filters.statut;
    })
    .filter((d) => filters.demandeur === "All" || d.utilisateurNom === filters.demandeur)
    .filter((d) => {
      if (filters.capex === "All") return true;
      if (filters.capex === "Without Capex") return !d.capexNom;
      if (filters.capex === "With Capex") return !!d.capexNom;
      return d.capexNom === filters.capex;
    })
    .filter((d) => filters.departement === "All" || (d.departementNom || d.DepartementNom) === filters.departement)
    .filter((d) => filters.rfx === "All" || (d.rFx || d.RFX) === filters.rfx)
    .filter((d) => filters.createAt === "All" || formatDate(d.createAt) === filters.createAt)
    .filter((d) => filters.achat1 === "All" || formatDate(d.dateValidationAchat1) === filters.achat1)
    .filter((d) => filters.achat2 === "All" || formatDate(d.dateValidationAchat2) === filters.achat2)
    .filter((d) => filters.chef === "All" || formatDate(d.dateValidateChef) === filters.chef)
    .filter((d) => filters.finance === "All" || formatDate(d.dateValidateFinance) === filters.finance)
    .filter((d) => filters.directeur === "All" || formatDate(d.dateValidateDirecteur) === filters.directeur)
    .filter((d) => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        String(d.idDemande).includes(q) ||
        (d.utilisateurNom || "").toLowerCase().includes(q) ||
        (d.capexNom || "").toLowerCase().includes(q) ||
        (d.departementNom || d.DepartementNom || "").toLowerCase().includes(q) ||
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
  function isEnAttente(s) {
    if (!s) return false;
    const n = String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    return n.includes("enattente") && !n.includes("refus");
  }
  function isBonDeCommande(s) {
    const n = String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    return n === "bondecommande";
  }
  const stats = {
    total: demandes.length,
    enAttente: demandes.filter((d) => isEnAttente(d.statut)).length,
    ceMois: demandes.filter((d) => {
      const dt = new Date(d.createAt);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length,
  };

  async function handleExport() {
    if (!filtered.length) return;
    setExporting(true);
    try {
      const rows = filtered.map((d) => ({
        N: d.idDemande,
        Requester: d.utilisateurNom,
        Capex: d.capexNom,
        Department: d.departementNom || d.DepartementNom || "",
        Status: d.statut,
        RFx: d.rFx || d.RFX || "",
        CreatedOn: formatDateExcel(d.createAt),
        Purchase1: formatDateExcel(d.dateValidationAchat1),
        Purchase2: formatDateExcel(d.dateValidationAchat2),
        Manager: formatDateExcel(d.dateValidateChef),
        Finance: formatDateExcel(d.dateValidateFinance),
        Director: formatDateExcel(d.dateValidateDirecteur),
      }));
      const columns = [
        { header: "No.", key: "N" },
        { header: "Requester", key: "Requester" },
        { header: "Capex", key: "Capex" },
        { header: "Department", key: "Department" },
        { header: "Status", key: "Status" },
        { header: "RFx", key: "RFx" },
        { header: "Created on", key: "CreatedOn" },
        { header: "Purchase1", key: "Purchase1" },
        { header: "Purchase2", key: "Purchase2" },
        { header: "Manager", key: "Manager" },
        { header: "Finance", key: "Finance" },
        { header: "Director", key: "Director" },
      ];
      const sheets = [{ name: "Requests", rows, columns }];
      if (includeDetails) {
        const allDetails = [];
        for (const d of filtered) {
          let det = detailsCache[d.idDemande];
          if (det === undefined) {
            try { det = await getDetailsDemande(d.idDemande); setDetailsCache((p) => ({ ...p, [d.idDemande]: det })); } catch { det = []; }
          }
          if (Array.isArray(det) && det.length) {
            det.forEach((line) => allDetails.push({
              Request: d.idDemande,
              Item: line.article,
              Quantity: line.quantite,
              UnitPrice: line.prix ?? "",
              Subtotal: line.quantite * (line.prix ?? 0),
              Quote: line.devis || "",
            }));
          } else if (Array.isArray(det) && !det.length) {
            allDetails.push({ Request: d.idDemande, Item: "No items", Quantity: "", UnitPrice: "", Subtotal: "", Quote: "" });
          }
        }
        sheets.push({
          name: "Details",
          rows: allDetails.length ? allDetails : [{ Request: "", Item: "No items found", Quantity: "", UnitPrice: "", Subtotal: "", Quote: "" }],
          columns: [
            { header: "Request", key: "Request" },
            { header: "Item", key: "Item" },
            { header: "Quantity", key: "Quantity" },
            { header: "Unit price", key: "UnitPrice" },
            { header: "Subtotal", key: "Subtotal" },
            { header: "Quote", key: "Quote" },
          ],
        });
      }
      exportToExcel({ filename: `Requests_${new Date().toISOString().slice(0,10)}`, sheets });
      setShowExport(false);
    } catch (e) {
      console.error("Export error", e);
      alert("Export error: " + e.message);
    } finally { setExporting(false); }
  }

  return (
    <>
      <div className="rounded-2xl border border-border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Purchase Requests</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and track the status of your investment requests (Capex).
            </p>
          </div>
          {/*
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
          */}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by No., requester or RFx..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
              title="Reset all filters"
            >
              <X className="size-3.5" />
              Reset ({activeFiltersCount})
            </button>
          )}

          <button
            className="rounded-lg border border-border p-2.5 text-muted-foreground hover:bg-muted"
            onClick={() => setSortAsc((v) => !v)}
            title="Sort by No."
          >
            <ArrowUpDown className="size-4" />
          </button>
          <button
            className="rounded-lg border border-border p-2.5 text-muted-foreground hover:bg-muted"
            onClick={() => setTableExpanded((v) => !v)}
            title={tableExpanded ? "Collapse table" : "Expand table"}
          >
            {tableExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          <button
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"
            onClick={() => setShowExport(true)}
            disabled={!filtered.length}
            title="Export to Excel"
          >
            <Download className="size-4" /> Export
          </button>
        </div>

        {/* Date interval filter – same design as Capex Tracking */}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="size-4" />
            <span className="hidden sm:inline">Period (Created on)</span>
            <span className="sm:hidden">Period</span>
          </div>
          <div className="flex items-center gap-2">
            <DatePicker value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder="mm/dd/yyyy" />
            <span className="px-1 text-sm font-semibold text-muted-foreground">→</span>
            <DatePicker value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder="mm/dd/yyyy" />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          {(dateFrom || dateTo) && (
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} of {demandes.length}
            </span>
          )}
        </div>
      </div>

      {showExport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={() => setShowExport(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">Export to Excel</h3>
            <p className="mt-1 text-sm text-muted-foreground">Exports {filtered.length} filtered request(s) — Excel compatible.</p>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeDetails} onChange={(e) => setIncludeDetails(e.target.checked)} className="size-4 rounded border-border" />
              Include details (Item, Quantity, Price, Subtotal, Quote)
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowExport(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {exporting ? "Exporting..." : <><Download className="size-4" /> Export</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="mt-6 text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <div className={`mt-6 overflow-hidden rounded-2xl border border-border ${tableExpanded ? "ring-1 ring-border" : ""}`}>
          <div className={tableExpanded ? "overflow-x-auto" : "overflow-hidden"}>
            <table className={tableExpanded ? "w-full min-w-[1350px] text-sm" : "w-full table-fixed text-[13px]"}>
              {!tableExpanded && (
                <colgroup>
                  <col style={{ width: "32px" }} />
                  <col style={{ width: "52px" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                </colgroup>
              )}
              <thead>
                <tr className={`bg-muted text-left text-muted-foreground ${tableExpanded ? "text-xs" : "text-[11px]"}`}>
                  <th className={tableExpanded ? "w-10 px-4 py-3" : "px-1 py-3"} />
                  <th className={tableExpanded ? "px-4 py-3 font-medium" : "px-2 py-3 font-medium"}>No.</th>
                  <ColumnFilterHeader
                    label="Requester"
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
                    label="Department"
                    options={departementOptions}
                    selected={filters.departement}
                    onChange={(v) => updateFilter("departement", v)}
                  />
                  <ColumnFilterHeader
                    label="Status"
                    options={statutOptions}
                    selected={filters.statut}
                    onChange={(v) => updateFilter("statut", v)}
                    className="min-w-0"
                  />
                  <ColumnFilterHeader
                    label="RFx"
                    options={rfxOptions}
                    selected={filters.rfx}
                    onChange={(v) => updateFilter("rfx", v)}
                  />
                  <ColumnFilterHeader
                    label="Created on"
                    options={createAtOptions}
                    selected={filters.createAt}
                    onChange={(v) => updateFilter("createAt", v)}
                  />
                  <ColumnFilterHeader
                    label="Purchasing 1"
                    options={achat1Options}
                    selected={filters.achat1}
                    onChange={(v) => updateFilter("achat1", v)}
                  />
                  <ColumnFilterHeader
                    label="Purchasing 2"
                    options={achat2Options}
                    selected={filters.achat2}
                    onChange={(v) => updateFilter("achat2", v)}
                  />
                  <ColumnFilterHeader
                    label="Manager"
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
                    label="Director"
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
                    <td colSpan={13} className="px-4 py-8 text-center text-muted-foreground">
                      No requests found.
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
                      expandedTable={tableExpanded}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3.5 text-xs text-muted-foreground">
            <span>
              Showing {pageItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
              {(page - 1) * PAGE_SIZE + pageItems.length} of {filtered.length} requests
            </span>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-border px-3 py-2 font-medium text-foreground hover:bg-muted disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="rounded-lg border border-border px-3 py-2 font-medium text-foreground hover:bg-muted disabled:opacity-50"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total requests" value={stats.total} icon={<FileText className="size-4" />} />
        <StatCard label="Pending" value={String(stats.enAttente).padStart(2, "0")} icon={<Clock className="size-4" />} />
        <StatCard
          label={`This month (${now.toLocaleDateString("en-US", { month: "short" })})`}
          value={stats.ceMois}
          icon={<Calendar className="size-4" />}
        />
      </div>

      {showModal && <CreateDemandeModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </>
  );
}

// En-tête de colonne avec filtre déroulant + recherche, réutilisable pour
// n'importe quelle colonne (texte, statut, ou date déjà formatée en libellé).

// En-tête de colonne avec filtre déroulant + recherche, réutilisable pour
// n'importe quelle colonne (texte, statut, ou date déjà formatée en libellé).
function ColumnFilterHeader({ label, options, selected, onChange, align = "left", className = "" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  function openMenu() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: align === "right" ? undefined : rect.left,
        right: align === "right" ? window.innerWidth - rect.right : undefined,
      });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    function updatePosition() {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: align === "right" ? undefined : rect.left,
        right: align === "right" ? window.innerWidth - rect.right : undefined,
      });
    }
    function handleScroll(e) {
      if (menuRef.current && e.target && menuRef.current.contains(e.target)) return;
      updatePosition();
    }
    function handleResize() {
      updatePosition();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );
  const isActive = selected !== "All";

  function select(value) {
    onChange(value);
    setOpen(false);
    setQuery("");
  }

  return (
    <th className={`relative px-2 py-3 font-medium truncate text-[11px] ${className}`}>
      <button
        ref={btnRef}
        className="flex items-center gap-1 hover:text-foreground"
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        {label}
        <ChevronRight className={`size-3 transition-transform ${open ? "rotate-90" : ""}`} />
        {isActive && (
          <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            1
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{ position: "fixed", top: position.top, left: position.left, right: position.right }}
          className="z-50 w-56 rounded-lg border border-border bg-card p-2 text-left font-normal normal-case text-foreground shadow-[var(--shadow-card)]"
        >
          <div className="mb-1.5 flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            <div
              onClick={() => select("All")}
              className={`cursor-pointer rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
                selected === "All" ? "font-bold" : "font-normal"
              }`}
            >
              All
            </div>

            {filteredOptions.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">No results.</p>
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
        </div>,
        document.body
      )}
    </th>
  );
}
function DemandeRow({ demande, expanded, onToggle, details, onValider, onRefuser, expandedTable }) {
  const navigate = useNavigate();
  const compact = !expandedTable;
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50">
        <td className={compact ? "px-1 py-3 text-center" : "px-4 py-3.5 text-center"}>
          <ChevronRight
            className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </td>
        <td className={compact ? "px-2 py-3 font-semibold truncate" : "px-4 py-3.5 font-semibold whitespace-nowrap"}>#{demande.idDemande}</td>
        <td className={compact ? "px-2 py-3" : "px-4 py-3.5"}>
          <div className={compact ? "flex items-center gap-1.5 overflow-hidden" : "flex items-center gap-2.5"}>
            <Avatar name={demande.utilisateurNom} />
            <span className={compact ? "truncate" : ""}>{demande.utilisateurNom}</span>
          </div>
        </td>
        <td className={compact ? "px-2 py-3 overflow-hidden" : "px-4 py-3.5 whitespace-nowrap"}>
          {demande.capexNom ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const capexId = demande.capexId ?? demande.idCapex ?? demande.CapexId ?? demande.id ?? demande.Id ?? null;
                if (capexId) navigate(`/capex/${capexId}`);
                else navigate(`/suivi?capex=${encodeURIComponent(demande.capexNom ?? "")}`);
              }}
              className={compact ? "flex max-w-full cursor-pointer items-center gap-1 overflow-hidden text-muted-foreground hover:text-primary hover:underline underline-offset-2" : "flex cursor-pointer items-center gap-1.5 text-muted-foreground hover:text-primary hover:underline underline-offset-2"}
              title={`View tracking ${demande.capexNom}`}
            >
              <Calendar className="size-3.5 shrink-0" /> <span className={compact ? "truncate" : ""}>{demande.capexNom}</span>
            </button>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
        <td className={compact ? "px-2 py-3 overflow-hidden" : "px-4 py-3.5 whitespace-nowrap"}>
          {(() => {
            const { icon: DeptIcon, color } = getDeptConfig(demande.departementNom || demande.DepartementNom);
            return (
              <span className={compact ? "flex items-center gap-1.5 overflow-hidden text-muted-foreground" : "flex items-center gap-1.5 text-muted-foreground"}>
                <DeptIcon className="size-3.5 shrink-0" style={{ color }} />
                <span className={compact ? "truncate" : ""}>{demande.departementNom || demande.DepartementNom || "—"}</span>
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              </span>
            );
          })()}
        </td>
        <td className={compact ? "px-1 py-3 overflow-hidden" : "whitespace-nowrap px-4 py-3.5"}><div className={compact ? "overflow-hidden" : ""}><StatutBadge statut={demande.statut} /></div></td>
        <td className={compact ? "px-2 py-3 overflow-hidden" : "px-4 py-3.5 whitespace-nowrap"}>
          {demande.rFx ? (
            <span className={compact ? "flex items-center gap-1 overflow-hidden" : "flex items-center gap-1.5"}>
              <FileText className="size-3.5 shrink-0 text-muted-foreground" /> <span className={compact ? "truncate text-xs" : ""}>{demande.rFx}</span>
            </span>
          ) : (
            "—"
          )}
        </td>
        <td className={compact ? "px-2 py-3 overflow-hidden" : "whitespace-nowrap px-4 py-3.5"}>
          <span className={compact ? "flex items-center gap-1 overflow-hidden text-muted-foreground" : "flex items-center gap-1.5 text-muted-foreground"}>
            <Clock className="size-3.5 shrink-0" /> <span className={compact ? "truncate text-xs" : ""}>{new Date(demande.createAt).toLocaleDateString("en-US")}</span>
          </span>
        </td>
        <td className={compact ? "px-1 py-3 truncate text-center text-xs text-muted-foreground" : "whitespace-nowrap px-4 py-3.5 text-muted-foreground"}>{demande.dateValidationAchat1 ? new Date(demande.dateValidationAchat1).toLocaleDateString("en-US") : "—"}</td>
        <td className={compact ? "px-1 py-3 truncate text-center text-xs text-muted-foreground" : "whitespace-nowrap px-4 py-3.5 text-muted-foreground"}>{demande.dateValidationAchat2 ? new Date(demande.dateValidationAchat2).toLocaleDateString("en-US") : "—"}</td>
        <td className={compact ? "px-1 py-3 truncate text-center text-xs text-muted-foreground" : "whitespace-nowrap px-4 py-3.5 text-muted-foreground"}>{demande.dateValidateChef ? new Date(demande.dateValidateChef).toLocaleDateString("en-US") : "—"}</td>
        <td className={compact ? "px-1 py-3 truncate text-center text-xs text-muted-foreground" : "whitespace-nowrap px-4 py-3.5 text-muted-foreground"}>{demande.dateValidateFinance ? new Date(demande.dateValidateFinance).toLocaleDateString("en-US") : "—"}</td>
        <td className={compact ? "px-1 py-3 truncate text-center text-xs text-muted-foreground" : "whitespace-nowrap px-4 py-3.5 text-muted-foreground"}>{demande.dateValidateDirecteur ? new Date(demande.dateValidateDirecteur).toLocaleDateString("en-US") : "—"}</td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={13} className="cursor-default bg-muted/40 px-6 py-4">
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
    ["Purchasing 1", demande.dateValidationAchat1],
    ["Purchasing 2", demande.dateValidationAchat2],
    ["Manager", demande.dateValidateChef],
    ["Finance", demande.dateValidateFinance],
    ["Director", demande.dateValidateDirecteur],
  ].filter(([, date]) => date);

  if (!details) return <p className="text-sm text-muted-foreground">Loading items...</p>;
  if (details.error) return <p className="text-sm text-destructive">{details.error}</p>;

  const total = details.reduce((sum, d) => sum + d.quantite * (d.prix ?? 0), 0);

    return (
    <div>
      {datesValidation.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {datesValidation.map(([role, date]) => (
            <span key={role}>{role}: {new Date(date).toLocaleString("en-US")}</span>
          ))}
        </div>
      )}

      {details.length === 0 ? <p className="text-sm text-muted-foreground">No items on this request.</p> : <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="px-2 py-1 text-left font-semibold text-muted-foreground">Item</th>
          <th className="px-2 py-1 text-left font-semibold text-muted-foreground">Quantity</th>
          <th className="px-2 py-1 text-left font-semibold text-muted-foreground">Unit price</th>
          <th className="px-2 py-1 text-left font-semibold text-muted-foreground">Subtotal</th>
          <th className="px-2 py-1 text-left font-semibold text-muted-foreground">Quote</th>
        </tr>
      </thead>
      <tbody>
        {details.map((line) => (
          <tr key={line.id} className="border-t border-border">
            <td className="px-2 py-1.5">{line.article}</td>
            <td className="px-2 py-1.5">{line.quantite}</td>
            <td className="px-2 py-1.5">{line.prix != null ? line.prix.toLocaleString("en-US") + " $" : "—"}</td>
            <td className="px-2 py-1.5">{((line.quantite * (line.prix ?? 0)).toLocaleString("en-US"))} $</td>
            <td className="px-2 py-1.5">{line.devis || "—"}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t border-border">
          <td colSpan={3} className="px-2 py-2"><strong>Total</strong></td>
          <td colSpan={2} className="px-2 py-2"><strong>{total.toLocaleString("en-US")} $</strong></td>
        </tr>
      </tfoot>
      </table>}
    </div>
  );
}