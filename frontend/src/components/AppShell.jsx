import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Settings,
  ShieldCheck,
  HelpCircle,
  Bell,
  ChevronDown,
  ChevronLeft,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import logo from "../assets/img/ECI_logo1.png";
// ajuste le chemin relatif selon où se trouve réellement AppShell.jsx par rapport à src/assets
const MENU_ITEMS = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "demandes", label: "Suivi demandes d'achat", icon: ClipboardList },
  { key: "suivi", label: "Suivi Capex", icon: BarChart3 },
];
const ACCOUNT_ITEMS = [
  { key: "settings", label: "Paramètres", icon: Settings },
  { key: "security", label: "Sécurité", icon: ShieldCheck },
];
const SUPPORT_ITEMS = [{ key: "help", label: "Aide & Centre", icon: HelpCircle }];

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function SectionLabel({ children }) {
  return (
    <p className="px-3 pt-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function NavItem({ item, active, onNavigate, collapsed }) {
  const Icon = item.icon;
  const isActive = active === item.key;
  return (
    <button
      onClick={() => onNavigate(item.key)}
      title={collapsed ? item.label : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        isActive ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground hover:bg-muted"
      } ${collapsed ? "justify-center px-2" : ""}`}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.8} />
      {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
    </button>
  );
}

export default function AppShell({ active, onNavigate, user, breadcrumb, children }) {
  const activeLabel =
    [...MENU_ITEMS, ...ACCOUNT_ITEMS, ...SUPPORT_ITEMS].find((i) => i.key === active)?.label ??
    "Tableau de bord";

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar:collapsed") === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={`hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:overflow-y-auto scrollbar-hide transition-all duration-300 ${collapsed ? "w-[72px] p-2" : "w-64"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-2"}`}>
          {!collapsed && <img src={logo} alt="" className="w-full h-auto flex-1 min-w-0" />}
          {collapsed && <img src={logo} alt="" className="size-8 object-contain" />}
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Agrandir la barre latérale" : "Réduire la barre latérale"}
            className="grid size-7 shrink-0 place-items-center rounded-md border border-sidebar-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <ChevronLeft className={`size-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
        {!collapsed && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-sm text-muted-foreground">
            <Search className="size-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[8px]">⌘F</kbd>
          </div>
        )}
        {collapsed && (
          <button title="Rechercher" className="mt-4 grid size-9 place-items-center rounded-lg border border-sidebar-border text-muted-foreground hover:bg-muted">
            <Search className="size-4" />
          </button>
        )}

        {!collapsed ? <SectionLabel>Menu</SectionLabel> : <div className="pt-4" />}
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <NavItem key={item.key} item={item} active={active} onNavigate={onNavigate} collapsed={collapsed} />
          ))}
        </nav>

        {!collapsed ? <SectionLabel>Compte</SectionLabel> : <div className="pt-4" />}
        <nav className="space-y-1">
          {ACCOUNT_ITEMS.map((item) => (
            <NavItem key={item.key} item={item} active={active} onNavigate={onNavigate} collapsed={collapsed} />
          ))}
        </nav>

        {!collapsed ? <SectionLabel>Support</SectionLabel> : <div className="pt-4" />}
        <nav className="space-y-1">
          {SUPPORT_ITEMS.map((item) => (
            <NavItem key={item.key} item={item} active={active} onNavigate={onNavigate} collapsed={collapsed} />
          ))}
        </nav>

        {!collapsed ? (
          <div className="mt-auto rounded-2xl bg-primary p-5 text-center text-primary-foreground">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary-foreground/15">
              <HelpCircle className="size-6" />
            </div>
            <p className="mt-3 font-bold">Besoin d'aide ?</p>
            <p className="mt-1 text-xs opacity-80">
              Contactez le support pour toute question sur vos demandes Capex.
            </p>
            <button className="mt-4 w-full rounded-lg bg-primary-foreground/15 py-2 text-sm font-semibold hover:bg-primary-foreground/25">
              Contacter le support
            </button>
          </div>
        ) : (
          <div className="mt-auto flex justify-center pb-2">
            <button title="Besoin d'aide ?" className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <HelpCircle className="size-5" />
            </button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 lg:px-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? "Agrandir" : "Réduire"}
              className="hidden lg:grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer mr-1"
            >
              <ChevronLeft className={`size-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
            </button>
            <span>Capex Manager</span>
            {breadcrumb ? (
              <>
                <span className="text-muted-foreground/60">›</span>
                <button onClick={breadcrumb.onClick} className="hover:text-foreground">
                  {breadcrumb.label}
                </button>
              </>
            ) : null}
            <span className="text-muted-foreground/60">›</span>
            <strong className="font-semibold text-foreground">{activeLabel}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-border p-2.5 text-muted-foreground hover:bg-muted">
              <Bell className="size-4" />
            </button>
            <div className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5">
              <div className="grid size-8 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {initials(user?.name ?? "U")}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight">{user?.name ?? "Utilisateur"}</p>
                <p className="text-[11px] text-muted-foreground">{user?.role ?? ""}</p>
              </div>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 space-y-6 bg-white p-6 lg:p-10">
  {children}
</main>
      </div>
    </div>
  );
}