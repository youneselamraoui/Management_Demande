import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Settings,
  ShieldCheck,
  HelpCircle,
  Bell,
  ChevronDown,
  Search,
} from "lucide-react";

const MENU_ITEMS = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "demandes", label: "Demandes d'achat", icon: ClipboardList },
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

export default function AppShell({ active, onNavigate, user, breadcrumb, children }) {
  const activeLabel =
    [...MENU_ITEMS, ...ACCOUNT_ITEMS, ...SUPPORT_ITEMS].find((i) => i.key === active)?.label ??
    "Tableau de bord";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <LayoutDashboard size={18} />
          </div>
          <span>Capex Manager</span>
        </div>

        <div className="sidebar-search">
          <Search size={15} color="var(--text-muted)" />
          <input type="text" placeholder="Rechercher..." />
          <span className="sidebar-search-kbd">⌘F</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {MENU_ITEMS.map((item) => (
            <SidebarLink key={item.key} item={item} active={active} onNavigate={onNavigate} />
          ))}

          <div className="sidebar-section-label">Compte</div>
          {ACCOUNT_ITEMS.map((item) => (
            <SidebarLink key={item.key} item={item} active={active} onNavigate={onNavigate} />
          ))}

          <div className="sidebar-section-label">Support</div>
          {SUPPORT_ITEMS.map((item) => (
            <SidebarLink key={item.key} item={item} active={active} onNavigate={onNavigate} />
          ))}
        </nav>

        <div className="sidebar-footer-card">
          <div className="sidebar-footer-icon">
            <HelpCircle size={22} />
          </div>
          <div className="sidebar-footer-title">Besoin d'aide ?</div>
          <p className="sidebar-footer-text">
            Contactez le support pour toute question sur vos demandes Capex.
          </p>
          <button className="sidebar-footer-btn">Contacter le support</button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span>Capex Manager</span>
            <span className="crumb-sep">›</span>
            {breadcrumb ? (
              <>
                <button className="crumb-link" onClick={breadcrumb.onClick}>
                  {breadcrumb.label}
                </button>
                <span className="crumb-sep">›</span>
              </>
            ) : null}
            <strong>{activeLabel}</strong>
          </div>

          <div className="topbar-right">
            <button className="icon-btn">
              <Bell size={18} />
            </button>
            <div className="topbar-user">
              <div className="topbar-user-text">
                <div className="topbar-user-name">{user?.name ?? "Utilisateur"}</div>
                <div className="topbar-user-role">{user?.role ?? ""}</div>
              </div>
              <div className="avatar-circle" style={{ background: "var(--navy)" }}>
                {initials(user?.name ?? "U")}
              </div>
              <ChevronDown size={16} color="var(--text-secondary)" />
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ item, active, onNavigate }) {
  const Icon = item.icon;
  const isActive = active === item.key;
  return (
    <button
      className={`sidebar-link${isActive ? " active" : ""}`}
      onClick={() => onNavigate(item.key)}
    >
      <Icon size={17} />
      <span>{item.label}</span>
    </button>
  );
}