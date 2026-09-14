import { useEffect, useRef, useState } from "react";
import AppShell from "../components/AppShell";
import { Search, FileText, Calendar, Truck, Hash, ChevronRight, X, Download } from "lucide-react";
import { getBonCommandes, getDetailsDemande } from "../api/client";
import DatePicker from "../components/ui/DatePicker";
import { createPortal } from "react-dom";
import { exportToExcel, formatDateExcel } from "../utils/exportExcel";

const PAGE_SIZE = 10;

const DEFAULT_FILTERS = { po: "Tous", dateCreation: "Tous", fournisseur: "Tous" };

function formatDate(v) { return v ? new Date(v).toLocaleDateString("fr-FR") : "—"; }
function textOptions(list, getValue) {
  const set = new Set();
  list.forEach((item) => { const v = getValue(item); if (v) set.add(v); });
  return [...set].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })).map((v) => ({ value: v, label: v }));
}
function dateOptions(list, getRaw) {
  const map = new Map(); let hasEmpty = false;
  list.forEach((item) => {
    const raw = getRaw(item); if (!raw) { hasEmpty = true; return; }
    const d = new Date(raw); const label = d.toLocaleDateString("fr-FR");
    if (!map.has(label) || d.getTime() < map.get(label)) map.set(label, d.getTime());
  });
  const options = [...map.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => ({ value: label, label }));
  if (hasEmpty) options.push({ value: "—", label: "— (non renseigné)" });
  return options;
}

export default function BonCommandesPage({ onNavigate, params, user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  // filtre intervalle dates – même UX que SuiviCapex
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [includeDetails, setIncludeDetails] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function toggleExpand(demandeId) {
    if (expandedId === demandeId) { setExpandedId(null); return; }
    setExpandedId(demandeId);
    if (!detailsCache[demandeId]) {
      try {
        const details = await getDetailsDemande(demandeId);
        setDetailsCache((prev) => ({ ...prev, [demandeId]: details }));
      } catch (e) {
        setDetailsCache((prev) => ({ ...prev, [demandeId]: { error: e.message } }));
      }
    }
  }

  useEffect(() => {
    setLoading(true);
    getBonCommandes()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function updateFilter(key, value) { setFilters((prev) => ({ ...prev, [key]: value })); setPage(1); }

  const poOptions = textOptions(data, (b) => b.po ?? b.Po);
  const fournisseurOptions = textOptions(data, (b) => b.fournisseurNom ?? b.FournisseurNom);
  const dateCreationOptions = dateOptions(data, (b) => b.dateCreation ?? b.DateCreation);
  const activeFiltersCount = Object.values(filters).filter((v) => v !== "Tous").length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const filtered = data.filter((b) => {
    const q = search.toLowerCase();
    if (q) {
      const ok = String(b.demandeId ?? b.DemandeId).toLowerCase().includes(q) ||
        (b.po ?? b.Po ?? "").toLowerCase().includes(q) ||
        (b.fournisseurNom ?? b.FournisseurNom ?? "").toLowerCase().includes(q);
      if (!ok) return false;
    }
    if (filters.po !== "Tous" && (b.po ?? b.Po) !== filters.po) return false;
    if (filters.fournisseur !== "Tous" && (b.fournisseurNom ?? b.FournisseurNom) !== filters.fournisseur) return false;
    if (filters.dateCreation !== "Tous" && formatDate(b.dateCreation ?? b.DateCreation) !== filters.dateCreation) return false;
    // intervalle dates sur DateCreation – même logique que SuiviCapex
    if (dateFrom || dateTo) {
      const raw = b.dateCreation ?? b.DateCreation;
      const t = raw ? new Date(raw) : null;
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
    return true;
  });

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleExport() {
    if (!filtered.length) return;
    setExporting(true);
    try {
      const rows = filtered.map((b) => ({
        DemandeId: b.demandeId ?? b.DemandeId,
        PO: b.po ?? b.Po ?? "",
        DateCreation: formatDateExcel(b.dateCreation ?? b.DateCreation),
        Fournisseur: b.fournisseurNom ?? b.FournisseurNom ?? "",
      }));
      const columns = [
        { header: "DemandeId", key: "DemandeId" },
        { header: "PO", key: "PO" },
        { header: "DateCreation", key: "DateCreation" },
        { header: "Fournisseur", key: "Fournisseur" },
      ];
      const sheets = [{ name: "Bons de commande", rows, columns }];
      if (includeDetails) {
        const allDetails = [];
        for (const b of filtered) {
          const demandeId = b.demandeId ?? b.DemandeId;
          let d = detailsCache[demandeId];
          if (d === undefined) {
            try { d = await getDetailsDemande(demandeId); setDetailsCache((p) => ({ ...p, [demandeId]: d })); } catch (e) { d = []; }
          }
          if (Array.isArray(d) && d.length) {
            d.forEach((line) => allDetails.push({
              DemandeId: demandeId,
              PO: b.po ?? b.Po ?? "",
              Article: line.article,
              Quantite: line.quantite,
              PrixUnitaire: line.prix ?? "",
              SousTotal: line.quantite * (line.prix ?? 0),
              Devis: line.devis || "",
            }));
          } else if (Array.isArray(d) && !d.length) {
            allDetails.push({ DemandeId: demandeId, PO: b.po ?? b.Po ?? "", Article: "Aucun article", Quantite: "", PrixUnitaire: "", SousTotal: "", Devis: "" });
          }
        }
        // Toujours créer la feuille Details quand l'option est cochée, même si vide
        sheets.push({
          name: "Details",
          rows: allDetails.length ? allDetails : [{ DemandeId: "", PO: "", Article: "Aucun article trouvé", Quantite: "", PrixUnitaire: "", SousTotal: "", Devis: "" }],
          columns: [
            { header: "DemandeId", key: "DemandeId" },
            { header: "PO", key: "PO" },
            { header: "Article", key: "Article" },
            { header: "Quantité", key: "Quantite" },
            { header: "Prix unitaire", key: "PrixUnitaire" },
            { header: "Sous-total", key: "SousTotal" },
            { header: "Devis", key: "Devis" },
          ],
        });
      }
      exportToExcel({ filename: `Bons_de_commande_${new Date().toISOString().slice(0,10)}`, sheets });
      setShowExport(false);
    } catch (e) {
      console.error("Export error", e);
      alert("Erreur export: " + e.message);
    } finally { setExporting(false); }
  }

  return (
    <AppShell active="boncommandes" onNavigate={onNavigate} user={user}>
      <div className="rounded-2xl border border-border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Bons de commande</h1>
            <p className="mt-1 text-sm text-muted-foreground">Liste des bons de commande générés à partir des demandes validées.</p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par Demande, PO ou fournisseur..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {activeFiltersCount > 0 && (
            <button onClick={() => { setFilters(DEFAULT_FILTERS); setDateFrom(""); setDateTo(""); setPage(1); }} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2.5 text-sm font-medium hover:bg-muted/70">
              <X className="size-3.5" /> Réinitialiser ({activeFiltersCount})
            </button>
          )}
          <button onClick={() => setShowExport(true)} disabled={!filtered.length} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50">
            <Download className="size-4" /> Exporter
          </button>
        </div>

        {/* Filtre date intervalle – même design que SuiviCapex */}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="size-4" />
            <span className="hidden sm:inline">Période (Date création)</span>
            <span className="sm:hidden">Période</span>
          </div>
          <div className="flex items-center gap-2">
            <DatePicker value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder="jj/mm/aaaa" />
            <span className="px-1 text-sm font-semibold text-muted-foreground">→</span>
            <DatePicker value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder="jj/mm/aaaa" />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Effacer
              </button>
            )}
          </div>
          {(dateFrom || dateTo) && (
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} sur {data.length}
            </span>
          )}
        </div>
      </div>

      {loading && <p className="mt-6 text-sm text-muted-foreground">Chargement...</p>}
      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      {showExport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={() => setShowExport(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">Exporter en Excel</h3>
            <p className="mt-1 text-sm text-muted-foreground">Exporte {filtered.length} ligne(s) filtrée(s) — compatible Excel.</p>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeDetails} onChange={(e) => setIncludeDetails(e.target.checked)} className="size-4 rounded border-border" />
              Inclure les détails (Article, Quantité, Prix, Sous-total, Devis)
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowExport(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Annuler</button>
              <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {exporting ? "Export..." : <><Download className="size-4" /> Exporter</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="bg-muted text-left text-xs text-muted-foreground">
                  <th className="w-8 px-4 py-3" />
                  <th className="px-4 py-3 font-medium"><span className="flex items-center gap-1.5"><Hash className="size-3.5" /> N°</span></th>
                  <ColumnFilterHeader label="PO" options={poOptions} selected={filters.po} onChange={(v) => updateFilter("po", v)} />
                  <ColumnFilterHeader label="DateCreation" options={dateCreationOptions} selected={filters.dateCreation} onChange={(v) => updateFilter("dateCreation", v)} />
                  <ColumnFilterHeader label="Fournisseur" options={fournisseurOptions} selected={filters.fournisseur} onChange={(v) => updateFilter("fournisseur", v)} />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucun bon de commande trouvé.</td>
                  </tr>
                ) : (
                  pageItems.map((b) => {
                    const demandeId = b.demandeId ?? b.DemandeId;
                    const expanded = expandedId === demandeId;
                    const details = detailsCache[demandeId];
                    return (
                      <>
                        <tr key={b.id ?? b.Id} onClick={() => toggleExpand(demandeId)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="px-4 py-3 text-center"><ChevronRight className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} /></td>
                          <td className="px-4 py-3.5 font-semibold">#{demandeId}</td>
                          <td className="px-4 py-3.5">{b.po ?? b.Po ?? "—"}</td>
                          <td className="px-4 py-3.5 text-muted-foreground">{b.dateCreation ?? b.DateCreation ? new Date(b.dateCreation ?? b.DateCreation).toLocaleDateString("fr-FR") : "—"}</td>
                          <td className="px-4 py-3.5">{b.fournisseurNom ?? b.FournisseurNom ?? "—"}</td>
                        </tr>
                        {expanded && (
                          <tr>
                            <td colSpan={5} className="bg-muted/40 px-6 py-4">
                              {(!details) ? <p className="text-sm text-muted-foreground">Chargement des articles...</p>
                                : details.error ? <p className="text-sm text-destructive">{details.error}</p>
                                : <BonCommandeDetails details={details} />}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3.5 text-xs text-muted-foreground">
            <span>Affichage de {pageItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} à {(page - 1) * PAGE_SIZE + pageItems.length} sur {filtered.length} bons</span>
            <div className="flex gap-2">
              <button className="rounded-lg border border-border px-3 py-2 font-medium text-foreground hover:bg-muted disabled:opacity-50" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Précédent</button>
              <button className="rounded-lg border border-border px-3 py-2 font-medium text-foreground hover:bg-muted disabled:opacity-50" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ColumnFilterHeader({ label, options, selected, onChange, align = "left", className = "" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  function openMenu() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: align === "right" ? undefined : rect.left, right: align === "right" ? window.innerWidth - rect.right : undefined });
    }
    setOpen(true);
  }
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (btnRef.current && !btnRef.current.contains(e.target) && menuRef.current && !menuRef.current.contains(e.target)) { setOpen(false); setQuery(""); }
    }
    function updatePosition() {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: align === "right" ? undefined : rect.left, right: align === "right" ? window.innerWidth - rect.right : undefined });
    }
    function handleScroll(e) { if (menuRef.current && e.target && menuRef.current.contains(e.target)) return; updatePosition(); }
    function handleResize() { updatePosition(); }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);
  const filteredOptions = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  const isActive = selected !== "Tous";
  function select(value) { onChange(value); setOpen(false); setQuery(""); }
  return (
    <th className={`relative px-4 py-3 font-medium ${className}`}>
      <button ref={btnRef} className="flex items-center gap-1 hover:text-foreground" onClick={() => (open ? setOpen(false) : openMenu())}>
        {label} <ChevronRight className={`size-3 transition-transform ${open ? "rotate-90" : ""}`} />
        {isActive && <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">1</span>}
      </button>
      {open && createPortal(
        <div ref={menuRef} onClick={(e) => e.stopPropagation()} style={{ position: "fixed", top: position.top, left: position.left, right: position.right }} className="z-50 w-56 rounded-lg border border-border bg-card p-2 text-left font-normal normal-case text-foreground shadow-[var(--shadow-card)]">
          <div className="mb-1.5 flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input autoFocus type="text" placeholder="Rechercher..." value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="max-h-56 overflow-y-auto">
            <div onClick={() => select("Tous")} className={`cursor-pointer rounded-md px-2 py-1.5 text-sm hover:bg-muted ${selected === "Tous" ? "font-bold" : "font-normal"}`}>Tous</div>
            {filteredOptions.length === 0 ? <p className="px-2 py-2 text-xs text-muted-foreground">Aucun résultat.</p> : filteredOptions.map((o) => <div key={o.value} onClick={() => select(o.value)} className={`cursor-pointer rounded-md px-2 py-1.5 text-sm hover:bg-muted ${selected === o.value ? "font-bold" : "font-normal"}`}>{o.label}</div>)}
          </div>
        </div>,
        document.body
      )}
    </th>
  );
}

function BonCommandeDetails({ details }) {
  if (!details || details.length === 0) return <p className="text-sm text-muted-foreground">Aucun article.</p>;
  const total = details.reduce((s, d) => s + d.quantite * (d.prix ?? 0), 0);
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
            <td className="px-2 py-1.5">{line.prix != null ? line.prix.toLocaleString("fr-FR") + " $" : "—"}</td>
            <td className="px-2 py-1.5">{(line.quantite * (line.prix ?? 0)).toLocaleString("fr-FR")} $</td>
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
    </table>
  );
}
