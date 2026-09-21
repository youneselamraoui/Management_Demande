import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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

export default function DemandesParDepartement() {
  const navigate = useNavigate();
  const { nom: routeDept } = useParams();
  const [searchParams] = useSearchParams();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [capexFilter, setCapexFilter] = useState(searchParams.get("capex") || "All");
  const [selectedDept, setSelectedDept] = useState(routeDept ? decodeURIComponent(routeDept) : "All");
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
  useEffect(() => {
    if (routeDept) setSelectedDept(decodeURIComponent(routeDept));
    else setSelectedDept("All");
  }, [routeDept]);

  const capexOptions = useMemo(() => {
    const s = new Set(demandes.map(d=>d.capexNom).filter(Boolean));
    return ["All", "With Capex", "Without Capex", ...[...s].sort((a,b)=>a.localeCompare(b,"en",{sensitivity:"base"}))];
  }, [demandes]);

  const deptOptions = useMemo(() => {
    const s = new Set(demandes.map(d=> (d.departementNom||d.DepartementNom||"Unassigned")).filter(Boolean));
    return ["All", ...[...s].sort((a,b)=>a.localeCompare(b,"en",{sensitivity:"base"}))];
  }, [demandes]);

  // base filtered without the selected department — for badges that should remain stable
  const filteredBase = useMemo(() => {
    return demandes.filter(d=>{
      if (dateFrom || dateTo) {
        const t = d.createAt ? new Date(d.createAt) : null;
        if (!t || isNaN(t.getTime())) return false;
        if (dateFrom && t < new Date(dateFrom+"T00:00:00")) return false;
        if (dateTo && t > new Date(dateTo+"T23:59:59.999")) return false;
      }
      if (capexFilter !== "All") {
        if (capexFilter === "Without Capex" && d.capexNom) return false;
        if (capexFilter === "With Capex" && !d.capexNom) return false;
        if (capexFilter !== "Without Capex" && capexFilter !== "With Capex" && d.capexNom !== capexFilter) return false;
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
    if (selectedDept === "All") return filteredBase;
    return filteredBase.filter(d=> (d.departementNom||d.DepartementNom||"Unassigned") === selectedDept);
  }, [filteredBase, selectedDept]);

  // filtered aggregations (for charts / lists) — respect selectedDept
  const { deptMap, capexList } = useMemo(() => {
    const map = {};
    const capexSet = new Set();
    filtered.forEach(d=>{
      const dept = d.departementNom || d.DepartementNom || "Unassigned";
      const capex = d.capexNom || "Without Capex";
      capexSet.add(capex);
      if (!map[dept]) map[dept] = { total:0, byCapex:{}, byStatut:{} };
      map[dept].total += 1;
      map[dept].byCapex[capex] = (map[dept].byCapex[capex]||0)+1;
      const st = d.statut || "—";
      map[dept].byStatut[st] = (map[dept].byStatut[st]||0)+1;
    });
    return { deptMap: map, capexList: [...capexSet].sort((a,b)=>a.localeCompare(b,"en")) };
  }, [filtered]);

  // base aggregation (without selectedDept) — for pill badges that should show true count before click
  const pillCounts = useMemo(() => {
    const map = {};
    filteredBase.forEach(d=>{
      const dept = d.departementNom || d.DepartementNom || "Unassigned";
      map[dept] = (map[dept]||0)+1;
    });
    return map;
  }, [filteredBase]);

  const deptEntries = useMemo(()=> Object.entries(deptMap).sort((a,b)=> b[1].total - a[1].total), [deptMap]);

  const totalDemandes = filtered.length;
  const totalDepts = deptEntries.length;
  const topDept = deptEntries[0]?.[0] ?? "—";
  const topCount = deptEntries[0]?.[1].total ?? 0;

  // data for stacked bar
  const barData = useMemo(()=> deptEntries.map(([dept,info])=>{
    const row = { departement: dept, total: info.total };
    capexList.forEach(c=> row[c] = info.byCapex[c] || 0);
    return row;
  }), [deptEntries, capexList]);

  // data for donut
  const pieData = useMemo(()=> deptEntries.map(([name,info],i)=>({
    name, value: info.total, color: FALLBACK_COLORS[i % FALLBACK_COLORS.length]
  })), [deptEntries]);

  // Helpers single department
  const isEnAttente = (s)=>{
    const n = String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    return n.includes("enattente") && !n.includes("refus");
  };
  const formatDate = (v)=> v ? new Date(v).toLocaleDateString("en-US") : "—";

  function handleExport(){
    if (selectedDept !== "All") {
      const rows = filtered.map(d=>({
        N: d.idDemande ?? d.Id, Demandeur: d.utilisateurNom, Capex: d.capexNom, Departement: d.departementNom||d.DepartementNom, Statut: d.statut, RFx: d.rFx||d.RFX||"", CreeLe: d.createAt ? new Date(d.createAt).toLocaleDateString("en-US") : ""
      }));
      const columns = [
        {header:"No.",key:"N"}, {header:"Requester",key:"Demandeur"}, {header:"Capex",key:"Capex"}, {header:"Department",key:"Departement"}, {header:"Status",key:"Statut"}, {header:"RFx",key:"RFx"}, {header:"Created on",key:"CreeLe"}
      ];
      exportToExcel({ filename:`Requests_${selectedDept}_${new Date().toISOString().slice(0,10)}`, sheets:[{name:selectedDept, rows, columns}] });
      return;
    }
    const rows = deptEntries.map(([dept,info])=>{
      const r = { Departement: dept, Total: info.total };
      capexList.forEach(c=> r[c]= info.byCapex[c]||0);
      return r;
    });
    const columns = [{header:"Department",key:"Departement"},{header:"Total",key:"Total"}, ...capexList.map(c=>({header:c,key:c}))];
    exportToExcel({ filename:`Requests_by_department_${new Date().toISOString().slice(0,10)}`, sheets:[{name:"By department", rows, columns}] });
  }

  // Derived for single dept mode — hooks must be before early returns
  const isSingle = selectedDept !== "All";
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
    return Object.entries(singleDeptInfo.byStatut).map(([name, value], i)=>({ name: name==="—"?"Not defined":name, value, color: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }));
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
      return { month: dt.toLocaleDateString("en-US",{month:"short"}), demandes: v };
    });
  }, [isSingle, singleDemandes]);

  const enAttenteSingle = isSingle ? singleDemandes.filter(d=>isEnAttente(d.statut)).length : 0;
  const ceMoisSingle = isSingle ? singleDemandes.filter(d=>{ const dt=new Date(d.createAt); const now=new Date(); return dt.getMonth()===now.getMonth() && dt.getFullYear()===now.getFullYear(); }).length : 0;

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Requests by Department</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSingle ? <>Statistics and requests for department <span className="font-semibold text-foreground">{selectedDept}</span> — detailed view.</> : "Breakdown of purchase requests by department and Capex — analytical view."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} disabled={!filtered.length} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50">
            <Download className="size-4"/> Export {isSingle ? "list" : "Excel"}
          </button>
          {!isSingle && <button onClick={()=>navigate("/demandes")} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">View requests →</button>}
          {isSingle && <button onClick={()=>navigate("/repartition")} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted">← All departments</button>}
        </div>
      </header>

      {/* Department selector — single choice on same page */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="size-4 text-primary"/> Department
          </div>
          <div className="flex flex-wrap gap-2">
            {deptOptions.map(d=>{
              const isActive = selectedDept===d;
              const cfg = getDeptConfig(d, deptOptions.indexOf(d));
              return (
                <button
                  key={d}
                  onClick={()=>navigate(d==="All" ? "/repartition" : `/departements/${encodeURIComponent(d)}`)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${isActive ? "bg-primary border-primary text-primary-foreground shadow-sm" : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {d!=="All" && <span className="size-2 rounded-full" style={{backgroundColor: isActive ? "white" : cfg.color}}/>}
                  {d}
                  {d!=="All" && <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[11px] ${isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>{pillCounts[d] ?? 0}</span>}
                </button>
              );
            })}
          </div>
          {isSingle && <span className="ml-auto text-xs text-muted-foreground">{singleDemandes.length} request(s) in this department</span>}
        </div>
      </div>

      {/* Filters – same design as SuiviCapex / Demandes */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <DatePicker value={dateFrom} onChange={v=>setDateFrom(v)} placeholder="mm/dd/yyyy"/>
          <span className="px-1 text-sm font-semibold text-muted-foreground">→</span>
          <DatePicker value={dateTo} onChange={v=>setDateTo(v)} placeholder="mm/dd/yyyy"/>
          {(dateFrom||dateTo) && <button onClick={()=>{setDateFrom("");setDateTo("");}} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">Clear</button>}
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
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search (capex, requester...)" className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 sm:w-56"/>
          </div>
          {!isSingle && (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Building2 className="size-4 text-muted-foreground"/>
              <input value={deptSearch} onChange={e=>setDeptSearch(e.target.value)} placeholder="Filter department..." className="w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"/>
            </div>
          )}
          <button onClick={()=>{setSearch("");setDeptSearch("");setCapexFilter("All");setDateFrom("");setDateTo(""); if(isSingle) setSelectedDept("All");}} className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"><X className="size-3.5"/> Reset</button>
        </div>
      </div>

      {/* === SINGLE DEPARTMENT MODE === */}
      {isSingle ? (
        <>
          {(() => {
            const cfg = getDeptConfig(selectedDept, deptOptions.indexOf(selectedDept));
            const Icon = cfg.icon;
            return (
              <>
                <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label={`Requests — ${selectedDept}`} value={singleDemandes.length} icon={<Building2 className="size-4"/>} footnote={`${singleCapexData.length} distinct Capex`} />
                  <StatCard label="Pending" value={enAttenteSingle} icon={<Clock className="size-4"/>} footnote={`${singleDemandes.length ? ((enAttenteSingle/singleDemandes.length)*100).toFixed(0):0}% of department`} />
                  <StatCard label="This month" value={ceMoisSingle} icon={<Calendar className="size-4"/>} footnote={new Date().toLocaleDateString("en-US",{month:"long"})} />
                  <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl text-white" style={{backgroundColor: cfg.color}}><Icon className="size-5"/></div>
                    <div>
                      <p className="text-sm font-bold">{selectedDept}</p>
                      <p className="text-xs text-muted-foreground">{capexFilter!=="All" ? `Filtered Capex: ${capexFilter}` : "All Capex"} • {singleDemandes.length} request(s)</p>
                    </div>
                  </div>
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-3">
                  {/* Capex bar for this department */}
                  <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
                    <h2 className="font-bold flex items-center gap-2"><BarChart3 className="size-4 text-primary"/> Breakdown by Capex — {selectedDept}</h2>
                    <p className="text-xs text-muted-foreground">Number of requests per Capex</p>
                    <div className="mt-4 h-[280px]">
                      {singleCapexData.length===0 ? <p className="grid h-full place-items-center text-sm text-muted-foreground">No data</p> :
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={singleCapexData} layout="vertical" margin={{left: 80, right: 16, top: 8, bottom: 8}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false}/>
                          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize:12, fill:"var(--color-muted-foreground)"}}/>
                          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={90} tick={{fontSize:11, fill:"var(--color-muted-foreground)"}}/>
                          <Tooltip contentStyle={{borderRadius:12, border:"1px solid var(--color-border)"}} formatter={(v)=>[v, "Requests"]}/>
                          <Bar dataKey="value" radius={[0,8,8,0]}>
                            {singleCapexData.map((e,i)=><Cell key={e.name} fill={e.color}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      }
                    </div>
                  </div>

                  {/* Donut Status */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-bold flex items-center gap-2"><PieIcon className="size-4 text-primary"/> By status</h2>
                    <p className="text-xs text-muted-foreground">Status breakdown</p>
                    <div className="mt-2 flex justify-center">
                      {singleStatutData.length===0 ? <p className="py-16 text-sm text-muted-foreground">No data</p> :
                      <PieChart width={220} height={220}>
                        <Pie data={singleStatutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="var(--color-card)" strokeWidth={2}>
                          {singleStatutData.map((e,i)=><Cell key={e.name} fill={e.color}/>)}
                          <Label content={({viewBox})=>{
                            const {cx,cy}=viewBox;
                            return (<text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"><tspan x={cx} dy="-6" fontSize="20" fontWeight="800" fill="var(--color-foreground)">{singleDemandes.length}</tspan><tspan x={cx} dy="16" fontSize="11" fill="var(--color-muted-foreground)">requests</tspan></text>);
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
                    <h2 className="font-bold">Monthly trend — {selectedDept}</h2>
                    <p className="text-xs text-muted-foreground">Requests created per month (last 12 months)</p>
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

                {/* List of requests for the department */}
                <section className="mt-6 overflow-hidden rounded-2xl border border-border">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <h2 className="font-bold text-sm">Requests — {selectedDept} ({singleSorted.length})</h2>
                    <div className="flex items-center gap-2">
                      <button onClick={()=>setSortAsc(v=>!v)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted" title="Sort by No."><ArrowUpDown className="size-3.5"/> No.</button>
                      <button onClick={()=>navigate(`/demandes?departement=${encodeURIComponent(selectedDept)}`)} className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">Open in Tracking <ChevronRight className="size-3"/></button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="bg-muted text-left text-xs text-muted-foreground">
                          <th className="px-4 py-3 font-medium">No.</th>
                          <th className="px-4 py-3 font-medium">Requester</th>
                          <th className="px-4 py-3 font-medium">Capex</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">RFx</th>
                          <th className="px-4 py-3 font-medium">Created on</th>
                        </tr>
                      </thead>
                      <tbody>
                        {singlePageItems.length===0 ? (
                          <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No requests.</td></tr>
                        ) : singlePageItems.map(d=>(
                          <tr key={d.idDemande ?? d.Id} className="border-t border-border hover:bg-muted/40 cursor-pointer" onClick={()=>navigate("/demandes")}>
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
                    <span>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, singleSorted.length)} of {singleSorted.length}</span>
                    <div className="flex gap-2">
                      <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted disabled:opacity-50">Previous</button>
                      <button disabled={page===singleTotalPages} onClick={()=>setPage(p=>p+1)} className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted disabled:opacity-50">Next</button>
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
        <StatCard label="Departments" value={totalDepts} icon={<Building2 className="size-4"/>} footnote={`${totalDemandes} filtered requests`} />
        <StatCard label="Total requests" value={totalDemandes} icon={<Layers className="size-4"/>} footnote={capexFilter!=="All" ? `Capex: ${capexFilter}` : `${capexList.length} distinct Capex`} />
        <StatCard label="Top department" value={topDept} icon={<BarChart3 className="size-4"/>} footnote={`${topCount} request(s) — ${totalDemandes? ((topCount/totalDemandes)*100).toFixed(0):0}% of total`} />
      </section>

      {/* Charts */}
      <section className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Stacked bar */}
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold flex items-center gap-2"><BarChart3 className="size-4 text-primary"/> Requests by department × Capex</h2>
              <p className="text-xs text-muted-foreground">Each bar = a department, segments = Capex</p>
            </div>
            <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">{totalDemandes} requests</span>
          </div>
          <div className="mt-4 h-[340px]">
            {barData.length===0 ? <p className="grid h-full place-items-center text-sm text-muted-foreground">No data</p> :
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
              <h2 className="font-bold flex items-center gap-2"><PieIcon className="size-4 text-primary"/> Overall breakdown</h2>
              <p className="text-xs text-muted-foreground">Share of each department</p>
            </div>
            <Filter className="size-4 text-muted-foreground"/>
          </div>
          <div className="mt-2 flex justify-center">
            {pieData.length===0 ? <p className="py-16 text-sm text-muted-foreground">No data</p> :
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
                        <tspan x={cx} dy="18" fontSize="12" fill="var(--color-muted-foreground)">requests</tspan>
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

      {/* Details by department */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Details by department</h2>
          <span className="text-xs text-muted-foreground">{deptEntries.length} department(s)</span>
        </div>
        <div className="mt-4 grid gap-3">
          {deptEntries.length===0 ? <p className="py-8 text-center text-sm text-muted-foreground">No results with current filters.</p> :
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
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">{info.total} request(s)</span>
                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}% of total</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {Object.entries(info.byCapex).sort((a,b)=>b[1]-a[1]).map(([capex, cnt], i)=>(
                          <button
                            key={capex}
                            onClick={()=>navigate(`/demandes?capex=${encodeURIComponent(capex)}`)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                            title={`View ${capex} requests`}
                          >
                            <span className="size-2 rounded-full" style={{backgroundColor: CAPEX_COLORS[capexList.indexOf(capex) % CAPEX_COLORS.length]}}/>
                            {capex} <span className="font-bold">{cnt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="hidden sm:block text-right shrink-0">
                      <div className="text-lg font-extrabold">{info.total}</div>
                      <div className="text-xs text-muted-foreground">requests</div>
                    </div>
                    <button
                      onClick={()=>navigate(`/departements/${encodeURIComponent(dept)}`)}
                      className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      title="View statistics for this department"
                    >
                      View <ChevronRight className="size-3"/>
                    </button>
                  </div>
                  {/* mini Capex bar */}
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

      {/* Simple summary table */}
      {deptEntries.length>0 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-muted text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium text-center">Total</th>
                  {capexList.map(c=> <th key={c} className="px-4 py-3 font-medium text-center whitespace-nowrap">{c}</th>)}
                  <th className="px-4 py-3 font-medium text-center">% of total</th>
                </tr>
              </thead>
              <tbody>
                {deptEntries.map(([dept,info])=>(
                  <tr key={dept} className="border-t border-border hover:bg-muted/40 cursor-pointer" onClick={()=>navigate(`/departements/${encodeURIComponent(dept)}`)}>
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
    </>
  );
}
