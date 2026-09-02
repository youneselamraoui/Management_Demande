import { FileText, ClipboardList, BarChart3, Bell, ChevronLeft } from "lucide-react";

export default function AppShell({ active, onNavigate, breadcrumb, user, children }) {
  return (
    <div className="page-shell">
      <div className="topnav">
        <div className="topnav-brand">
          <div className="topnav-brand-icon"><FileText size={18} /></div>
          Capex Manager
        </div>

        <div className="topnav-links">
          <button
            className={`topnav-link ${active === "demandes" ? "active" : ""}`}
            onClick={() => onNavigate("demandes")}
          >
            <ClipboardList size={16} /> Demandes d'achat
          </button>
          <button
            className={`topnav-link ${active === "suivi" ? "active" : ""}`}
            onClick={() => onNavigate("suivi")}
          >
            <BarChart3 size={16} /> Suivi Capex
          </button>
        </div>

        <div className="topnav-right">
          <Bell size={18} color="var(--text-secondary)" />
          {user && (
            <div className="topnav-user">
              <div>
                <div className="topnav-user-name">{user.name}</div>
                <div className="topnav-user-role">{user.role}</div>
              </div>
              <Avatar name={user.name} />
            </div>
          )}
        </div>
      </div>

      <div className="page-content">
        {breadcrumb && (
          <button className="breadcrumb-pill" onClick={breadcrumb.onClick}>
            <ChevronLeft size={14} /> {breadcrumb.label}
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

import { Avatar } from "./ui/Primitives";