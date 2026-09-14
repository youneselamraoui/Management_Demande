import { useEffect, useMemo, useState, useRef } from "react";
import AppShell from "../components/AppShell";
import { StatCard } from "../components/ui/Primitives";
import DatePicker from "../components/ui/DatePicker";
import { getDemandes } from "../api/client";
import {
  Building2, Layers, CreditCard, Monitor, Truck, ShieldCheck,
  Search, Download, Filter, Calendar, BarChart3, PieChart as PieIcon, ChevronRight, X, Clock, FileText, ArrowUpDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, Label, AreaChart, Area
} from "recharts";
import { StatutBadge, Avatar } from "../components/ui/Primitives";
import { exportToExcel } from "../utils/exportExcel";

const DEPT_CONFIG = {
  finance: { icon: CreditCard, color: "var(--color-chart-1)" },
  it: { icon: Monitor, color: "var(--color-chart-2)" },
  logistique: { icon: Truck, color: "#F59E0B" },
  qualite: { icon: ShieldCheck, color: "#10B981" },
  qualité: { icon: ShieldCheck, color: "#10B981" },
};
const FALLBACK_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"];
const CAPEX_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "var(--color-chart-3)", "var(--color-chart-4)"];

function getDeptConfig(name, idx=0) {
  if (!name) return { icon: Building2, color: FALLBACK_COLORS[idx % FALLBACK_COLORS.length] };
  const k = String(name).toLowerCase().trim();
  if (DEPT_CONFIG[k]) return DEPT_CONFIG[k];
  return { icon: Building2, color: FALLBACK_COLORS[idx % FALLBACK_COLORS.length] };
}

export default function DemandesParDepartement({ onNavigate, user }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [capexFilter, setCapexFilter] = useState("Tous");
  const [selectedDept, setSelectedDept] = useState("Tous");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deptSearch, setDeptSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const svgRef = useRef(null);
  const PAGE_SIZE = 8;

  useEffect(() => {
    setLoading(true);
    getDemandes().then(setDemandes).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, []);

  const capexOptions = useMemo(() => {
    const s = new Set(demandes.map(d=>d.capexNom).filter(Boolean));
    return ["Tous", "Avec Capex", "Sans Capex", ...[...s].sort((a,b)=>a.localeCompare(b,"fr",{sensitivity:"base"}))];
  }, [demandes]);

  const deptOptions = useMemo(() => {
    const s = new Set(demandes.map(d=> (d.departementNom||d.DepartementNom||"Non assigné")).filter(Boolean));
    return ["Tous", ...[...s].sort((a,b)=>a.localeCompare(b,"fr",{sensitivity:"base"}))];
  }, [demandes]);

  // base filtré sans le département sélectionné — pour les badges qui doivent rester stables
  const filteredBase = useMemo(() => {
    return demandes.filter(d=>{
      if (dateFrom || dateTo) {
        const t = d.createAt ? new Date(d.createAt) : null;
        if (!t || isNaN(t.getTime())) return false;
        if (dateFrom && t < new Date(dateFrom+"T00:00:00")) return false;
        if (dateTo && t > new Date(dateTo+"T23:59:59.999")) return false;
      }
      if (capexFilter !== "Tous") {
        if (capexFilter === "Sans Capex" && d.capexNom) return false;
        if (capexFilter === "Avec Capex" && !d.capexNom) return false;
        if (capexFilter !== "Sans Capex" && capexFilter !== "Avec Capex" && d.capexNom !== capexFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = `${d.departementNom||d.DepartementNom||""} ${d.capexNom||""} ${d.utilisateurNom||""} ${d.statut||""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (deptSearch) {
        const q = deptSearch.toLowerCase();
        if (!(d.departementNom||d.DepartementNom||"").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [demandes, dateFrom, dateTo, capexFilter, search, deptSearch]);

  const filtered = useMemo(() => {
    if (selectedDept === "Tous") return filteredBase;
    return filteredBase.filter(d=> (d.departementNom||d.DepartementNom||"Non assigné") === selectedDept);
  }, [filteredBase, selectedDept]);

  // agrégations filtrées (pour graphes / listes) — respectent selectedDept
  const { deptMap, capexList } = useMemo(() => {
    const map = {};
    const capexSet = new Set();
    filtered.forEach(d=>{
      const dept = d.departementNom || d.DepartementNom || "Non assigné";
      const capex = d.capexNom || "Sans Capex";
      capexSet.add(capex);
      if (!map[dept]) map[dept] = { total:0, byCapex:{}, byStatut:{} };
      map[dept].total += 1;
      map[dept].byCapex[capex] = (map[dept].byCapex[capex]||0)+1;
      const st = d.statut || "—";
      map[dept].byStatut[st] = (map[dept].byStatut[st]||0)+1;
    });
    return { deptMap: map, capexList: [...capexSet].sort((a,b)=>a.localeCompare(b,"fr")) };
  }, [filtered]);

  // agrégation base (sans selectedDept) — pour les badges des pills qui doivent afficher le vrai comptage avant clic
  const pillCounts = useMemo(() => {
    const map = {};
    filteredBase.forEach(d=>{
      const dept = d.departementNom || d.DepartementNom || "Non assigné";
      map[dept] = (map[dept]||0)+1;
    });
    return map;
  }, [filteredBase]);

  const deptEntries = useMemo(()=> Object.entries(deptMap).sort((a,b)=> b[1].total - a[1].total), [deptMap]);

  const totalDemandes = filtered.length;
  const totalDepts = deptEntries.length;
  const topDept = deptEntries[0]?.[0] ?? "—";
  const topCount = deptEntries[0]?.[1].total ?? 0;

  // data pour bar stacked
  const barData = useMemo(()=> deptEntries.map(([dept,info])=>{
    const row = { departement: dept, total: info.total };
    capexList.forEach(c=> row[c] = info.byCapex[c] || 0);
    return row;
  }), [deptEntries, capexList]);

  // data pour donut
  const pieData = useMemo(()=> deptEntries.map(([name,info],i)=>({
    name, value: info.total, color: FALLBACK_COLORS[i % FALLBACK_COLORS.length]
  })), [deptEntries]);

  // Helpers single département
  const isEnAttente = (s)=>{
    const n = String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    return n.includes("enattente") && !n.includes("refus");
  };
  const formatDate = (v)=> v ? new Date(v).toLocaleDateString("fr-FR") : "—";

  function handleExport(){
    if (selectedDept !== "Tous") {
      const rows = filtered.map(d=>({
        N: d.idDemande ?? d.Id, Demandeur: d.utilisateurNom, Capex: d.capexNom, Departement: d.departementNom||d.DepartementNom, Statut: d.statut, RFx: d.rFx||d.RFX||"", CreeLe: d.createAt ? new Date(d.createAt).toLocaleDateString("fr-FR") : ""
      }));
      const columns = [
        {header:"N°",key:"N"}, {header:"Demandeur",key:"Demandeur"}, {header:"Capex",key:"Capex"}, {header:"Département",key:"Departement"}, {header:"Statut",key:"Statut"}, {header:"RFx",key:"RFx"}, {header:"Créée le",key:"CreeLe"}
      ];
      exportToExcel({ filename:`Demandes_${selectedDept}_${new Date().toISOString().slice(0,10)}`, sheets:[{name:selectedDept, rows, columns}] });
      return;
    }
    const rows = deptEntries.map(([dept,info])=>{
      const r = { Departement: dept, Total: info.total };
      capexList.forEach(c=> r[c]= info.byCapex[c]||0);
      return r;
    });
    const columns = [{header:"Département",key:"Departement"},{header:"Total",key:"Total"}, ...capexList.map(c=>({header:c,key:c}))];
    exportToExcel({ filename:`Demandes_par_departement_${new Date().toISOString().slice(0,10)}`, sheets:[{name:"Par département", rows, columns}] });
  }

  // Derived for single dept mode — hooks must be before early returns
  const isSingle = selectedDept !== "Tous";
  const singleDemandes = isSingle ? filtered : [];
  useEffect(()=>{ setPage(1); }, [selectedDept, capexFilter, dateFrom, dateTo, search, deptSearch]);
  const singleSorted = useMemo(()=> [...singleDemandes].sort((a,b)=> sortAsc ? a.idDemande - b.idDemande : b.idDemande - a.idDemande), [singleDemandes, sortAsc]);
  const singleTotalPages = Math.max(Math.ceil(singleSorted.length / PAGE_SIZE),1);
  const singlePageItems = useMemo(()=> singleSorted.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE), [singleSorted, page]);
  const singleDeptInfo = isSingle ? deptMap[selectedDept] : null;
  const singleCapexData = useMemo(()=>{
    if (!isSingle || !singleDeptInfo) return [];
    return Object.entries(singleDeptInfo.byCapex).map(([name, value], i)=>({ name, value, color: CAPEX_COLORS[capexList.indexOf(name) % CAPEX_COLORS.length] }));
  }, [isSingle, singleDeptInfo, capexList]);
  const singleStatutData = useMemo(()=>{
    if (!isSingle || !singleDeptInfo) return [];
    return Object.entries(singleDeptInfo.byStatut).map(([name, value], i)=>({ name: name==="—"?"Non défini":name, value, color: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }));
  }, [isSingle, singleDeptInfo]);
  const singleMonthly = useMemo(()=>{
    if (!isSingle) return [];
    const map = {};
    singleDemandes.forEach(d=>{
      if (!d.createAt) return;
      const dt = new Date(d.createAt);
      const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
      map[key] = (map[key]||0)+1;
    });
    return Object.entries(map).sort().slice(-12).map(([k,v])=>{
      const [y,m]=k.split("-"); const dt=new Date(Number(y),Number(m)-1,1);
      return { month: dt.toLocaleDateString("fr-FR",{month:"short"}), demandes: v };
    });
  }, [isSingle, singleDemandes]);

  const enAttenteSingle = isSingle ? singleDemandes.filter(d=>isEnAttente(d.statut)).length : 0;
  const ceMoisSingle = isSingle ? singleDemandes.filter(d=>{ const dt=new Date(d.createAt); const now=new Date(); return dt.getMonth()===now.getMonth() && dt.getFullYear()===now.getFullYear(); }).length : 0;

  if (loading) return <AppShell active="repartition" onNavigate={onNavigate} user={user}><p className="text-muted-foreground">Chargement...</p></AppShell>;
  if (error) return <AppShell active="repartition" onNavigate={onNavigate} user={user}><p className="text-destructive">{error}</p></AppShell>;

  return (
    <AppShell active="repartition" onNavigate={onNavigate} user={user} breadcrumb={{label:"Tableau de bord", onClick:()=>onNavigate("dashboard")}}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Demandes par département</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSingle ? <>Statistiques et demandes du département <span className="font-semibold text-foreground">{selectedDept}</span> — vue détaillée.</> : "Répartition des demandes d'achat par département et par Capex — vue analytique."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} disabled={!filtered.length} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50">
            <Download className="size-4"/> Exporter {isSingle ? "liste" : "Excel"}
          </button>
          {!isSingle && <button onClick={()=>onNavigate("demandes")} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Voir demandes →</button>}
          {isSingle && <button onClick={()=>setSelectedDept("Tous")} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted">← Tous les départements</button>}
        </div>
      </header>

      {/* Sélecteur département — choix unique sur la même page */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="size-4 text-primary"/> Département
          </div>
          <div className="flex flex-wrap gap-2">
            {deptOptions.map(d=>{
              const isActive = selectedDept===d;
              const cfg = getDeptConfig(d, deptOptions.indexOf(d));
              return (
                <button
                  key={d}
                  onClick={()=>setSelectedDept(d)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${isActive ? "bg-primary border-primary text-primary-foreground shadow-sm" : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {d!=="Tous" && <span className="size-2 rounded-full" style={{backgroundColor: isActive ? "white" : cfg.color}}/>}
                  {d}
                  {d!=="Tous" && <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[11px] ${isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>{pillCounts[d] ?? 0}</span>}
                </button>
              );
            })}
          </div>
          {isSingle && <span className="ml-auto text-xs text-muted-foreground">{singleDemandes.length} demande(s) dans ce département</span>}
        </div>
      </div>

      {/* Filtres – même design que SuiviCapex / Demandes */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <DatePicker value={dateFrom} onChange={v=>setDateFrom(v)} placeholder="jj/mm/aaaa"/>
          <span className="px-1 text-sm font-semibold text-muted-foreground">→</span>
          <DatePicker value={dateTo} onChange={v=>setDateTo(v)} placeholder="jj/mm/aaaa"/>
          {(dateFrom||dateTo) && <button onClick={()=>{setDateFrom("");setDateTo("");}} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">Effacer</button>}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
          <Layers className="size-4 text-muted-foreground"/>
          <select value={capexFilter} onChange={e=>setCapexFilter(e.target.value)} className="bg-transparent text-sm font-medium outline-none">
            {capexOptions.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="size-4 shrink-0 text-muted-foreground"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher (capex, demandeur...)" className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 sm:w-56"/>
          </div>
          {!isSingle && (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Building2 className="size-4 text-muted-foreground"/>
              <input value={deptSearch} onChange={e=>setDeptSearch(e.target.value)} placeholder="Filtrer département..." className="w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"/>
            </div>
          )}
          <button onClick={()=>{setSearch("");setDeptSearch("");setCapexFilter("Tous");setDateFrom("");setDateTo(""); if(isSingle) setSelectedDept("Tous");}} className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"><X className="size-3.5"/> Réinitialiser</button>
        </div>
      </div>

      {/* === MODE SINGLE DEPARTEMENT === */}
      {isSingle ? (
        <>
          {(() => {
            const cfg = getDeptConfig(selectedDept, deptOptions.indexOf(selectedDept));
            const Icon = cfg.icon;
            return (
              <>
                <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label={`Demandes — ${selectedDept}`} value={singleDemandes.length} icon={<Building2 className="size-4"/>} footnote={`${singleCapexData.length} Capex distincts`} />
                  <StatCard label="En attente" value={enAttenteSingle} icon={<Clock className="size-4"/>} footnote={`${singleDemandes.length ? ((enAttenteSingle/singleDemandes.length)*100).toFixed(0):0}% du département`} />
                  <StatCard label="Ce mois" value={ceMoisSingle} icon={<Calendar className="size-4"/>} footnote={new Date().toLocaleDateString("fr-FR",{month:"long"})} />
                  <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl text-white" style={{backgroundColor: cfg.color}}><Icon className="size-5"/></div>
                    <div>
                      <p className="text-sm font-bold">{selectedDept}</p>
                      <p className="text-xs text-muted-foreground">{capexFilter!=="Tous" ? `Filtré Capex: ${capexFilter}` : "Tous Capex"} • {singleDemandes.length} demande(s)</p>
                    </div>
                  </div>
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-3">
                  {/* Bar Capex pour ce département */}
                  <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
                    <h2 className="font-bold flex items-center gap-2"><BarChart3 className="size-4 text-primary"/> Répartition par Capex — {selectedDept}</h2>
                    <p className="text-xs text-muted-foreground">Nombre de demandes par Capex</p>
                    <div className="mt-4 h-[280px]">
                      {singleCapexData.length===0 ? <p className="grid h-full place-items-center text-sm text-muted-foreground">Aucune donnée</p> :
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={singleCapexData} layout="vertical" margin={{left: 80, right: 16, top: 8, bottom: 8}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false}/>
                          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize:12, fill:"var(--color-muted-foreground)"}}/>
                          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={90} tick={{fontSize:11, fill:"var(--color-muted-foreground)"}}/>
                          <Tooltip contentStyle={{borderRadius:12, border:"1px solid var(--color-border)"}} formatter={(v)=>[v, "Demandes"]}/>
                          <Bar dataKey="value" radius={[0,8,8,0]}>
                            {singleCapexData.map((e,i)=><Cell key={e.name} fill={e.color}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      }
                    </div>
                  </div>

                  {/* Donut Statut */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-bold flex items-center gap-2"><PieIcon className="size-4 text-primary"/> Par statut</h2>
                    <p className="text-xs text-muted-foreground">Répartition des statuts</p>
                    <div className="mt-2 flex justify-center">
                      {singleStatutData.length===0 ? <p className="py-16 text-sm text-muted-foreground">Aucune donnée</p> :
                      <PieChart width={220} height={220}>
                        <Pie data={singleStatutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="var(--color-card)" strokeWidth={2}>
                          {singleStatutData.map((e,i)=><Cell key={e.name} fill={e.color}/>)}
                          <Label content={({viewBox})=>{
                            const {cx,cy}=viewBox;
                            return (<text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"><tspan x={cx} dy="-6" fontSize="20" fontWeight="800" fill="var(--color-foreground)">{singleDemandes.length}</tspan><tspan x={cx} dy="16" fontSize="11" fill="var(--color-muted-foreground)">demandes</tspan></text>);
                          }}/>
                        </Pie>
                        <Tooltip contentStyle={{borderRadius:12, border:"1px solid var(--color-border)"}}/>
                      </PieChart>
                      }
                    </div>
                    <ul className="mt-2 space-y-1.5 max-h-[120px] overflow-auto pr-1">
                      {singleStatutData.map(d=>(
                        <li key={d.name} className="flex items-center gap-2 text-xs">
                          <span className="size-2.5 shrink-0 rounded-full" style={{backgroundColor:d.color}}/>
                          <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                          <span className="font-semibold">{d.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {singleMonthly.length>1 && (
                  <section className="mt-6 rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-bold">Évolution mensuelle — {selectedDept}</h2>
                    <p className="text-xs text-muted-foreground">Demandes créées par mois (12 derniers mois)</p>
                    <div className="mt-4 h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={singleMonthly} margin={{left:0,right:8,top:8}}>
                          <defs>
                            <linearGradient id="singleFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={cfg.color} stopOpacity={0.28}/>
                              <stop offset="100%" stopColor={cfg.color} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false}/>
                          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize:12, fill:"var(--color-muted-foreground)"}}/>
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize:12, fill:"var(--color-muted-foreground)"}} width={32}/>
                          <Tooltip contentStyle={{borderRadius:12, border:"1px solid var(--color-border)"}}/>
                          <Area type="monotone" dataKey="demandes" stroke={cfg.color} strokeWidth={2.5} fill="url(#singleFill)" dot={{r:3}}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {/* Liste des demandes du département */}
                <section className="mt-6 overflow-hidden rounded-2xl border border-border">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <h2 className="font-bold text-sm">Demandes — {selectedDept} ({singleSorted.length})</h2>
                    <div className="flex items-center gap-2">
                      <button onClick={()=>setSortAsc(v=>!v)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted" title="Trier par N°"><ArrowUpDown className="size-3.5"/> N°</button>
                      <button onClick={()=>onNavigate("demandes",{departement:selectedDept})} className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">Ouvrir dans Suivi <ChevronRight className="size-3"/></button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="bg-muted text-left text-xs text-muted-foreground">
                          <th className="px-4 py-3 font-medium">N°</th>
                          <th className="px-4 py-3 font-medium">Demandeur</th>
                          <th className="px-4 py-3 font-medium">Capex</th>
                          <th className="px-4 py-3 font-medium">Statut</th>
                          <th className="px-4 py-3 font-medium">RFx</th>
                          <th className="px-4 py-3 font-medium">Créée le</th>
                        </tr>
                      </thead>
                      <tbody>
                        {singlePageItems.length===0 ? (
                          <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucune demande.</td></tr>
                        ) : singlePageItems.map(d=>(
                          <tr key={d.idDemande ?? d.Id} className="border-t border-border hover:bg-muted/40 cursor-pointer" onClick={()=>onNavigate("demandes")}>
                            <td className="px-4 py-3 font-semibold">#{d.idDemande ?? d.Id}</td>
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={d.utilisateurNom}/><span className="truncate">{d.utilisateurNom}</span></div></td>
                            <td className="px-4 py-3 text-muted-foreground">{d.capexNom}</td>
                            <td className="px-4 py-3"><StatutBadge statut={d.statut}/></td>
                            <td className="px-4 py-3 text-muted-foreground">{d.rFx || d.RFX || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(d.createAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                    <span>Affichage {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, singleSorted.length)} sur {singleSorted.length}</span>
                    <div className="flex gap-2">
                      <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted disabled:opacity-50">Précédent</button>
                      <button disabled={page===singleTotalPages} onClick={()=>setPage(p=>p+1)} className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted disabled:opacity-50">Suivant</button>
                    </div>
                  </div>
                </section>
              </>
            );
          })()}
        </>
      ) : (
        <>
      {/* Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Départements" value={totalDepts} icon={<Building2 className="size-4"/>} footnote={`${totalDemandes} demandes filtrées`} />
        <StatCard label="Total demandes" value={totalDemandes} icon={<Layers className="size-4"/>} footnote={capexFilter!=="Tous" ? `Capex: ${capexFilter}` : `${capexList.length} Capex distincts`} />
        <StatCard label="Top département" value={topDept} icon={<BarChart3 className="size-4"/>} footnote={`${topCount} demande(s) — ${totalDemandes? ((topCount/totalDemandes)*100).toFixed(0):0}% du total`} />
      </section>

      {/* Graphes */}
      <section className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Bar stacked */}
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold flex items-center gap-2"><BarChart3 className="size-4 text-primary"/> Demandes par département × Capex</h2>
              <p className="text-xs text-muted-foreground">Chaque barre = un département, segments = Capex</p>
            </div>
            <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">{totalDemandes} demandes</span>
          </div>
          <div className="mt-4 h-[340px]">
            {barData.length===0 ? <p className="grid h-full place-items-center text-sm text-muted-foreground">Aucune donnée</p> :
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{top:8,right:8,left:0,bottom:24}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false}/>
                <XAxis dataKey="departement" tickLine={false} axisLine={false} tick={{fontSize:11, fill:"var(--color-muted-foreground)"}} interval={0} angle={-14} textAnchor="end" height={50}/>
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize:12, fill:"var(--color-muted-foreground)"}}/>
                <Tooltip
                  contentStyle={{borderRadius:12, border:"1px solid var(--color-border)", fontSize:12}}
                  cursor={{fill:"var(--color-muted)", opacity:0.2}}
                />
                <Legend wrapperStyle={{fontSize:12, paddingTop:8}}/>
                {capexList.map((capex,i)=>(
                  <Bar key={capex} dataKey={capex} stackId="a" fill={CAPEX_COLORS[i % CAPEX_COLORS.length]} radius={capexList.length===1 ? [8,8,8,8] : i===0 ? [0,0,8,8] : i===capexList.length-1 ? [8,8,0,0] : [0,0,0,0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            }
          </div>
        </div>

        {/* Donut */}
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold flex items-center gap-2"><PieIcon className="size-4 text-primary"/> Répartition globale</h2>
              <p className="text-xs text-muted-foreground">Part de chaque département</p>
            </div>
            <Filter className="size-4 text-muted-foreground"/>
          </div>
          <div className="mt-2 flex justify-center">
            {pieData.length===0 ? <p className="py-16 text-sm text-muted-foreground">Aucune donnée</p> :
            <PieChart width={220} height={220}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                innerRadius={68} outerRadius={92}
                paddingAngle={3}
                stroke="var(--color-card)"
                strokeWidth={2}
              >
                {pieData.map((e,i)=><Cell key={e.name} fill={e.color}/>)}
                <Label
                  content={({viewBox})=>{
                    const {cx,cy}=viewBox;
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} dy="-6" fontSize="22" fontWeight="800" fill="var(--color-foreground)">{totalDemandes}</tspan>
                        <tspan x={cx} dy="18" fontSize="12" fill="var(--color-muted-foreground)">demandes</tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
              <Tooltip contentStyle={{borderRadius:12, border:"1px solid var(--color-border)"}} formatter={(v, n)=>[`${v} (${totalDemandes? ((v/totalDemandes)*100).toFixed(0):0}%)`, n]}/>
            </PieChart>
            }
          </div>
          <ul className="mt-1 space-y-2">
            {pieData.map(d=>{
              const pct = totalDemandes? (d.value/totalDemandes)*100:0;
              return (
                <li key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{backgroundColor:d.color}}/>
                  <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                  <span className="font-semibold">{d.value}</span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{pct.toFixed(0)}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Détail par département */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Détail par département</h2>
          <span className="text-xs text-muted-foreground">{deptEntries.length} département(s)</span>
        </div>
        <div className="mt-4 grid gap-3">
          {deptEntries.length===0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucun résultat avec les filtres actuels.</p> :
            deptEntries.map(([dept, info], idx)=>{
              const {icon:Icon, color} = getDeptConfig(dept, idx);
              const pct = totalDemandes? (info.total/totalDemandes)*100:0;
              return (
                <div key={dept} className="rounded-2xl border border-border p-4 hover:shadow-[var(--shadow-card)] transition">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl text-white shrink-0" style={{backgroundColor:color}}>
                      <Icon className="size-5"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{dept}</span>
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">{info.total} demande(s)</span>
                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}% du total</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {Object.entries(info.byCapex).sort((a,b)=>b[1]-a[1]).map(([capex, cnt], i)=>(
                          <button
                            key={capex}
                            onClick={()=>onNavigate("demandes", {capex})}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                            title={`Voir demandes ${capex}`}
                          >
                            <span className="size-2 rounded-full" style={{backgroundColor: CAPEX_COLORS[capexList.indexOf(capex) % CAPEX_COLORS.length]}}/>
                            {capex} <span className="font-bold">{cnt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="hidden sm:block text-right shrink-0">
                      <div className="text-lg font-extrabold">{info.total}</div>
                      <div className="text-xs text-muted-foreground">demandes</div>
                    </div>
                    <button
                      onClick={()=>setSelectedDept(dept)}
                      className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      title="Voir statistiques de ce département"
                    >
                      Voir <ChevronRight className="size-3"/>
                    </button>
                  </div>
                  {/* mini bar Capex */}
                  <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
                    {Object.entries(info.byCapex).sort((a,b)=>capexList.indexOf(a[0])-capexList.indexOf(b[0])).map(([capex,cnt])=>{
                      const w = info.total? (cnt/info.total)*100:0;
                      return <div key={capex} style={{width:`${w}%`, backgroundColor: CAPEX_COLORS[capexList.indexOf(capex) % CAPEX_COLORS.length]}} title={`${capex}: ${cnt}`} />;
                    })}
                  </div>
                </div>
              );
            })
          }
        </div>
      </section>

      {/* Tableau récap simple */}
      {deptEntries.length>0 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-muted text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Département</th>
                  <th className="px-4 py-3 font-medium text-center">Total</th>
                  {capexList.map(c=> <th key={c} className="px-4 py-3 font-medium text-center whitespace-nowrap">{c}</th>)}
                  <th className="px-4 py-3 font-medium text-center">% du total</th>
                </tr>
              </thead>
              <tbody>
                {deptEntries.map(([dept,info])=>(
                  <tr key={dept} className="border-t border-border hover:bg-muted/40 cursor-pointer" onClick={()=>setSelectedDept(dept)}>
                    <td className="px-4 py-3 font-semibold flex items-center gap-2"><Building2 className="size-4 text-muted-foreground shrink-0"/>{dept}</td>
                    <td className="px-4 py-3 text-center font-bold">{info.total}</td>
                    {capexList.map(c=> <td key={c} className="px-4 py-3 text-center">{info.byCapex[c]||0}</td>)}
                    <td className="px-4 py-3 text-center"><span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">{totalDemandes? ((info.total/totalDemandes)*100).toFixed(0):0}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
        </>
      )}
    </AppShell>
  );
}
