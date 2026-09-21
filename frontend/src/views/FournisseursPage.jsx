import { useEffect, useState, useRef } from "react";
import { Store, FileText, TrendingUp, Layers, Search, Download, Wallet, Calendar, Hash } from "lucide-react";
import { exportSvgAsPng } from "../utils/exportGraphe";
import { exportToExcel, formatDateExcel } from "../utils/exportExcel";
import { ProgressBar, StatCard } from "../components/ui/Primitives";
import DatePicker from "../components/ui/DatePicker";
import { getFournisseurStats } from "../api/client";

const FOURNISSEUR_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B"];
const FOURNISSEUR_ICONS = [Store, FileText, TrendingUp, Layers];
const DEPT_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "#8B5CF6", "#EC4899"];

function getFournisseurColor(index) { return FOURNISSEUR_COLORS[index % FOURNISSEUR_COLORS.length]; }

export default function FournisseursPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const svgRef = useRef(null);
  const svgDeptRef = useRef(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getFournisseurStats(from || undefined, to || undefined);
      setStats(data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [from, to]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (loading || !stats) return <p className="text-muted-foreground">Loading...</p>;

  const list = stats.parFournisseur ?? [];
  const filtered = search ? list.filter(f => f.fournisseurNom.toLowerCase().includes(search.toLowerCase())) : list;
  const totalMontant = stats.montantGlobal ?? 0;
  const totalBC = stats.totalBonCommandes ?? 0;
  const totalFournisseurs = stats.totalFournisseurs ?? 0;
  const montantMoyen = stats.montantMoyenGlobal ?? 0;
  const top = list[0];
  const selected = selectedId ? list.find(f => String(f.fournisseurId) === String(selectedId)) : null;

  const radius = 80; const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  const slices = filtered.filter(f => f.montantTotal > 0).map((f, i) => {
    const pct = totalMontant > 0 ? f.montantTotal / totalMontant : 0;
    const color = getFournisseurColor(i);
    const slice = { ...f, pct, offset: cumulative, color };
    cumulative += pct; return slice;
  });
  const hasData = slices.length > 0 && totalMontant > 0;

  const selDeptSlices = selected ? (() => {
    const total = selected.nombreBonCommandes || 1;
    let cum = 0;
    return (selected.parDepartement ?? []).map((d, i) => {
      const pct = d.nombreCommandes / total;
      const color = DEPT_COLORS[i % DEPT_COLORS.length];
      const s = { ...d, pct, offset: cum, color }; cum += pct; return s;
    });
  })() : [];

  const deptOptions = selected ? ["All", ...(selected.parDepartement ?? []).map(d => d.departementNom)] : [];
  const commandesFiltrees = selected ? (deptFilter === "All" ? (selected.commandes ?? []) : (selected.commandes ?? []).filter(c => c.departementNom === deptFilter)) : [];

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Supplier Statistics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Purchase orders by supplier — all orders are validated.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2.5 text-sm font-medium bg-card">
            <Store className="size-4 text-muted-foreground" />
            <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setDeptFilter("All"); }} className="bg-transparent outline-none min-w-[220px]">
              <option value="">All suppliers</option>
              {list.map(f => <option key={f.fournisseurId} value={f.fournisseurId}>{f.fournisseurNom} ({f.nombreBonCommandes})</option>)}
            </select>
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
            onClick={() => {
              const targetRef = selected ? svgDeptRef.current : svgRef.current;
              const name = selected ? `${selected.fournisseurNom}_${new Date().toISOString().slice(0,10)}` : `Suppliers_${new Date().toISOString().slice(0,10)}`;
              const legend = selected ? selDeptSlices.map(s=>({label:s.departementNom,color:s.color,pct:`${(s.pct*100).toFixed(0)}%`})) : slices.map(s=>({label:s.fournisseurNom,color:s.color,pct:`${(s.pct*100).toFixed(0)}%`}));
              exportSvgAsPng(targetRef, name, 2, legend).catch(e=>alert("Export failed: "+e.message));
            }}>
            <Download className="size-4" /> PNG
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              if (selected) {
                const rowsDept = (selected.parDepartement ?? []).map(d => ({ Departement: d.departementNom, NombreCommandes: d.nombreCommandes, MontantTotal: d.montantTotal }));
                const rowsDetail = commandesFiltrees.map(c => ({ BonCommande: c.bonCommandeId, Demande: c.demandeId, PO: c.po, DateCreation: formatDateExcel(c.dateCreation), Departement: c.departementNom, Demandeur: c.demandeurNom, Montant: c.montant }));
                exportToExcel({
                  filename: `Supplier_${selected.fournisseurNom}_${new Date().toISOString().slice(0,10)}`,
                  sheets: [
                    { name: "Summary", rows: [{ Fournisseur: selected.fournisseurNom, NombreBC: selected.nombreBonCommandes, MontantTotal: selected.montantTotal, MontantMoyen: selected.montantMoyen, DerniereCommande: formatDateExcel(selected.derniereCommande) }], columns: [{header:"Supplier",key:"Fournisseur"},{header:"Number of POs",key:"NombreBC"},{header:"Total Amount",key:"MontantTotal"},{header:"Average Amount",key:"MontantMoyen"},{header:"Last Order",key:"DerniereCommande"}] },
                    { name: "By Department", rows: rowsDept, columns: [{header:"Department",key:"Departement"},{header:"Number of Orders",key:"NombreCommandes"},{header:"Total Amount",key:"MontantTotal"}] },
                    { name: "Order Details", rows: rowsDetail, columns: [{header:"PO",key:"BonCommande"},{header:"Request",key:"Demande"},{header:"PO",key:"PO"},{header:"Date",key:"DateCreation"},{header:"Department",key:"Departement"},{header:"Requester",key:"Demandeur"},{header:"Amount",key:"Montant"}] },
                  ]
                });
              } else {
                const rowsFournisseur = filtered.map(f => ({ Fournisseur: f.fournisseurNom, NombreBC: f.nombreBonCommandes, MontantTotal: f.montantTotal, MontantMoyen: f.montantMoyen, DerniereCommande: formatDateExcel(f.derniereCommande), Pourcent: totalMontant>0 ? ((f.montantTotal/totalMontant)*100).toFixed(1)+"%" : "0%" }));
                const rowsDeptGlobal = (() => {
                  const map = new Map();
                  filtered.forEach(f => (f.parDepartement ?? []).forEach(d => {
                    const cur = map.get(d.departementNom) ?? { Departement: d.departementNom, NombreCommandes: 0, MontantTotal: 0 };
                    cur.NombreCommandes += d.nombreCommandes; cur.MontantTotal += d.montantTotal; map.set(d.departementNom, cur);
                  }));
                  return [...map.values()];
                })();
                exportToExcel({
                  filename: `Suppliers_Global_${new Date().toISOString().slice(0,10)}`,
                  sheets: [
                    { name: "Summary", rows: [{ TotalFournisseurs: totalFournisseurs, TotalBC: totalBC, MontantGlobal: totalMontant, MontantMoyen: montantMoyen, Periode: `${from||"start"} → ${to||"today"}` }], columns: [{header:"Total Suppliers",key:"TotalFournisseurs"},{header:"Total POs",key:"TotalBC"},{header:"Total Amount",key:"MontantGlobal"},{header:"Average Amount",key:"MontantMoyen"},{header:"Period",key:"Periode"}] },
                    { name: "By Supplier", rows: rowsFournisseur, columns: [{header:"Supplier",key:"Fournisseur"},{header:"Number of POs",key:"NombreBC"},{header:"Total Amount",key:"MontantTotal"},{header:"Average Amount",key:"MontantMoyen"},{header:"Last Order",key:"DerniereCommande"},{header:"% of Total",key:"Pourcent"}] },
                    { name: "By Department", rows: rowsDeptGlobal, columns: [{header:"Department",key:"Departement"},{header:"Number of Orders",key:"NombreCommandes"},{header:"Total Amount",key:"MontantTotal"}] },
                  ]
                });
              }
            }}>
            <Download className="size-4" /> Excel
          </button>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <DatePicker value={from} onChange={setFrom} placeholder="mm/dd/yyyy" />
          <span className="px-1 text-sm font-semibold text-muted-foreground">→</span>
          <DatePicker value={to} onChange={setTo} placeholder="mm/dd/yyyy" />
          {(from || to) && <button onClick={()=>{setFrom("");setTo("");}} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">Clear</button>}
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input type="text" placeholder="Search supplier..." value={search} onChange={e=>setSearch(e.target.value)} className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 sm:w-52" />
        </div>
      </div>

      {selected ? (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label={`POs — ${selected.fournisseurNom}`} value={selected.nombreBonCommandes} icon={<FileText className="size-4" />} footnote={`${selected.montantTotal.toLocaleString("en-US")} $ total`} />
            <StatCard label="Total Amount" value={`${selected.montantTotal.toLocaleString("en-US")} $`} icon={<Wallet className="size-4" />} footnote={`Avg ${selected.montantMoyen.toLocaleString("en-US")} $ / PO`} />
            <StatCard label="Departments" value={(selected.parDepartement?.length ?? 0)} icon={<Layers className="size-4" />} footnote={selected.derniereCommande ? `Last ${new Date(selected.derniereCommande).toLocaleDateString("en-US")}` : "No orders"} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border p-6">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-bold">Orders by Department</h2><p className="text-xs text-muted-foreground">{selected.fournisseurNom} — {selected.nombreBonCommandes} POs • {selected.montantTotal.toLocaleString("en-US")} $</p></div>
                <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">{(selected.parDepartement?.length ?? 0)} departments</span>
              </div>
              <div className="my-5 flex justify-center">
                <svg ref={svgDeptRef} width="220" height="220" viewBox="0 0 220 220">
                  <circle cx="110" cy="110" r={80} fill="none" stroke="var(--color-muted)" strokeWidth="28" />
                  {selDeptSlices.map(s => (
                    <circle key={s.departementNom} cx="110" cy="110" r={80} fill="none" stroke={s.color} strokeWidth="28" strokeDasharray={`${s.pct*2*Math.PI*80} ${2*Math.PI*80}`} strokeDashoffset={-s.offset*2*Math.PI*80} transform="rotate(-90 110 110)" />
                  ))}
                  <text x="110" y="105" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--color-foreground)">{selected.nombreBonCommandes}</text>
                  <text x="110" y="126" textAnchor="middle" fontSize="12" fill="var(--color-muted-foreground)">Orders</text>
                </svg>
              </div>
              <div className="space-y-2">
                {(selected.parDepartement ?? []).map((d,i)=>{
                  const color = DEPT_COLORS[i%DEPT_COLORS.length]; const pct = selected.nombreBonCommandes>0 ? d.nombreCommandes/selected.nombreBonCommandes*100 : 0;
                  return (
                    <div key={d.departementNom} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
                      <span className="size-2.5 rounded-full shrink-0" style={{backgroundColor:color}} />
                      <span className="flex-1 text-sm font-medium">{d.departementNom}</span>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{d.nombreCommandes} POs</div>
                        <div className="text-xs text-muted-foreground">{d.montantTotal.toLocaleString("en-US")} $</div>
                      </div>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border p-6">
              <h2 className="font-bold">Amount by Department</h2>
              <p className="text-xs text-muted-foreground">Spending by department for {selected.fournisseurNom}</p>
              <div className="mt-4 space-y-3">
                {(selected.parDepartement ?? []).slice().sort((a,b)=>b.montantTotal-a.montantTotal).map((d,i)=>{
                  const color = DEPT_COLORS[i%DEPT_COLORS.length];
                  const maxMontant = Math.max(...(selected.parDepartement ?? []).map(x=>x.montantTotal),1);
                  const pct = d.montantTotal / maxMontant * 100;
                  return (
                    <div key={d.departementNom}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium"><span className="size-2.5 rounded-full" style={{backgroundColor:color}}/>{d.departementNom}</span>
                        <span className="font-semibold">{d.montantTotal.toLocaleString("en-US")} $</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{width:`${pct}%`, backgroundColor:color}} /></div>
                      <div className="mt-1 text-xs text-muted-foreground">{d.nombreCommandes} order(s)</div>
                    </div>
                  );
                })}
                {(!selected.parDepartement || selected.parDepartement.length===0) && <p className="text-sm text-muted-foreground text-center py-8">No orders</p>}
              </div>
            </div>
          </section>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
              <div>
                <h2 className="font-bold">Detailed Orders by Department</h2>
                <p className="text-xs text-muted-foreground">{selected.fournisseurNom} — {commandesFiltrees.length} order(s) {deptFilter!=="All" ? `• ${deptFilter}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Filter by department</span>
                <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm outline-none">
                  {deptOptions.map(o=> <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              {(() => {
                const groupes = deptFilter === "All"
                  ? (selected.parDepartement ?? []).map(d => ({
                      nom: d.departementNom,
                      commandes: (selected.commandes ?? []).filter(c => c.departementNom === d.departementNom),
                      montant: d.montantTotal
                    }))
                  : [{ nom: deptFilter, commandes: commandesFiltrees, montant: commandesFiltrees.reduce((s,c)=>s+c.montant,0) }];
                if (groupes.length === 0 || commandesFiltrees.length === 0) {
                  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">No orders</p>;
                }
                return (
                  <div>
                    {groupes.filter(g=>g.commandes.length>0).map(g => (
                      <div key={g.nom} className="border-b border-border last:border-0">
                        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5 text-sm font-semibold">
                          <span className="rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground">{g.nom}</span>
                          <span className="text-muted-foreground font-normal text-xs">{g.commandes.length} order(s) • {g.montant.toLocaleString("en-US")} $</span>
                        </div>
                        <table className="w-full min-w-[760px] text-sm">
                          <thead><tr className="bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-2 font-medium"># PO</th><th className="px-4 py-2 font-medium">Request</th><th className="px-4 py-2 font-medium">PO</th><th className="px-4 py-2 font-medium">Date</th><th className="px-4 py-2 font-medium">Requester</th><th className="px-4 py-2 font-medium text-right">Amount</th></tr></thead>
                          <tbody>
                            {g.commandes.map(c=>(
                              <tr key={c.bonCommandeId} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                                <td className="px-4 py-2.5 font-semibold">#{c.bonCommandeId}</td>
                                <td className="px-4 py-2.5">#{c.demandeId}</td>
                                <td className="px-4 py-2.5">{c.po || "—"}</td>
                                <td className="px-4 py-2.5 text-muted-foreground">{new Date(c.dateCreation).toLocaleDateString("en-US")}</td>
                                <td className="px-4 py-2.5">{c.demandeurNom}</td>
                                <td className="px-4 py-2.5 text-right font-semibold">{c.montant.toLocaleString("en-US")} $</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                    <div className="flex justify-between bg-muted/50 px-4 py-3 text-sm font-bold">
                      <span>Total {deptFilter==="All" ? `(${commandesFiltrees.length} POs)` : `${deptFilter} (${commandesFiltrees.length} POs)`}</span>
                      <span>{commandesFiltrees.reduce((s,c)=>s+c.montant,0).toLocaleString("en-US")} $</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      ) : (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Suppliers" value={totalFournisseurs} icon={<Store className="size-4" />} footnote={`${filtered.length} shown${search?" (filtered)":""}`} />
            <StatCard label="Purchase Orders" value={totalBC} icon={<FileText className="size-4" />} footnote={top ? `Top: ${top.fournisseurNom} (${top.nombreBonCommandes})` : "No orders"} />
            <StatCard label="Total Amount" value={`${totalMontant.toLocaleString("en-US")} $`} icon={<Wallet className="size-4" />} footnote={`Avg ${montantMoyen.toLocaleString("en-US")} $ / PO`} />
            <StatCard label="Top Supplier" value={top ? top.fournisseurNom : "—"} icon={<TrendingUp className="size-4" />} footnote={top ? `${top.montantTotal.toLocaleString("en-US")} $ (${totalMontant>0?(top.montantTotal/totalMontant*100).toFixed(0):0}%)` : "No data"} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border p-6">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-bold">Breakdown by Supplier</h2><p className="text-xs text-muted-foreground">Committed Amount (POs) — {from||"start"} → {to||"today"}</p></div>
                <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">{filtered.length} suppliers</span>
              </div>
              <div className="my-5 flex justify-center">
                <svg ref={svgRef} width="220" height="220" viewBox="0 0 220 220">
                  <circle cx="110" cy="110" r={radius} fill="none" stroke="var(--color-muted)" strokeWidth="28" />
                  {hasData ? slices.map(s => (<circle key={s.fournisseurId} cx="110" cy="110" r={radius} fill="none" stroke={s.color} strokeWidth="28" strokeDasharray={`${s.pct*circumference} ${circumference}`} strokeDashoffset={-s.offset*circumference} transform="rotate(-90 110 110)" />)) : null}
                  <text x="110" y="105" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--color-foreground)">{totalMontant.toLocaleString("en-US")}</text>
                  <text x="110" y="126" textAnchor="middle" fontSize="12" fill="var(--color-muted-foreground)">$ Total</text>
                </svg>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {slices.map(s => (<span key={`legend-${s.fournisseurId}`} className="flex items-center gap-1.5 text-xs font-medium"><span className="size-2.5 shrink-0 rounded-full" style={{backgroundColor:s.color}} />{s.fournisseurNom} <span className="text-muted-foreground">({(s.pct*100).toFixed(0)}%)</span></span>))}
                {!hasData && <span className="text-xs text-muted-foreground">No amount to display</span>}
              </div>
              <div className="mt-4 flex gap-3 rounded-xl bg-accent p-4 text-sm text-accent-foreground">
                <Store className="mt-0.5 size-4 shrink-0" /><div><strong className="block text-foreground">Overview</strong>{totalBC} order(s) for {totalMontant.toLocaleString("en-US")} $ committed. {top ? `Supplier ${top.fournisseurNom} accounts for ${(top.montantTotal/totalMontant*100).toFixed(0)}% of the total.` : ""}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-6">
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">Details by Supplier</h2><p className="text-xs text-muted-foreground">Number of orders + total amount</p></div></div>
              <div className="mt-3">
                {filtered.length===0 ? <p className="py-8 text-center text-sm text-muted-foreground">No suppliers found.</p> :
                filtered.map((f,i)=>{
                  const color = getFournisseurColor(list.indexOf(f)); const pct = totalMontant>0 ? (f.montantTotal/totalMontant)*100 : 0; const Icon = FOURNISSEUR_ICONS[i % FOURNISSEUR_ICONS.length];
                  return (
                    <div key={f.fournisseurId} onClick={()=>setSelectedId(String(f.fournisseurId))} className="flex items-center gap-3 border-b border-border py-3 cursor-pointer hover:bg-muted/40 -mx-2 px-2 rounded-lg">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg text-white" style={{backgroundColor:color}}><Icon className="size-4" /></div>
                      <div className="flex-1 min-w-0"><div className="flex items-center gap-2 text-sm font-semibold truncate">{f.fournisseurNom} <span className="size-2 rounded-full shrink-0" style={{backgroundColor:color}} /></div><div className="text-xs text-muted-foreground">{f.nombreBonCommandes} POs • {f.montantTotal.toLocaleString("en-US")} $ • {f.montantMoyen.toLocaleString("en-US")} $ / PO</div></div>
                      <div className="text-right shrink-0"><div className="font-semibold">{f.montantTotal.toLocaleString("en-US")} $</div><span className="mt-0.5 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{pct.toFixed(0)}%</span></div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4"><ProgressBar percent={totalMontant>0?100:0} color="var(--color-primary)" /><div className="mt-2 text-xs text-muted-foreground">{totalBC} POs in total • Click a supplier to see details by department →</div></div>
            </div>
          </section>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="bg-muted text-left text-xs text-muted-foreground"><th className="px-4 py-3 font-medium">Supplier</th><th className="px-4 py-3 font-medium">PO Count</th><th className="px-4 py-3 font-medium">Total Amount</th><th className="px-4 py-3 font-medium">Average Amount</th><th className="px-4 py-3 font-medium">Last Order</th><th className="px-4 py-3 font-medium">% of Total</th></tr></thead>
                <tbody>
                  {filtered.map(f=>{
                    const pct = totalMontant>0 ? (f.montantTotal/totalMontant)*100 : 0;
                    return (
                      <tr key={f.fournisseurId} onClick={()=>setSelectedId(String(f.fournisseurId))} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer">
                        <td className="px-4 py-3.5 font-semibold">{f.fournisseurNom}</td>
                        <td className="px-4 py-3.5">{f.nombreBonCommandes}</td>
                        <td className="px-4 py-3.5">{f.montantTotal.toLocaleString("en-US")} $</td>
                        <td className="px-4 py-3.5">{f.montantMoyen.toLocaleString("en-US")} $</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{f.derniereCommande ? new Date(f.derniereCommande).toLocaleDateString("en-US") : "—"}</td>
                        <td className="px-4 py-3.5"><span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">{pct.toFixed(1)}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr className="bg-muted/50 font-semibold"><td className="px-4 py-3">Total</td><td className="px-4 py-3">{totalBC}</td><td className="px-4 py-3">{totalMontant.toLocaleString("en-US")} $</td><td className="px-4 py-3">{montantMoyen.toLocaleString("en-US")} $</td><td className="px-4 py-3">—</td><td className="px-4 py-3">100%</td></tr></tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
