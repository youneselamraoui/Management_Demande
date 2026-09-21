/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import RootLayout from "./layouts/RootLayout";
import NotFound, { RouteError } from "./views/NotFound";

const Dashboard = lazy(() => import("./views/Dashboard"));
const DemandesPage = lazy(() => import("./views/DemandesPage"));
const SuiviCapex = lazy(() => import("./views/SuiviCapex"));
const DemandesParDepartement = lazy(() => import("./views/DemandesParDepartement"));
const BonCommandesPage = lazy(() => import("./views/BonCommandesPage"));
const FournisseursPage = lazy(() => import("./views/FournisseursPage"));

function SuspenseWrap({ children }) {
  return <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Loading...</p>}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <SuspenseWrap><Dashboard /></SuspenseWrap>, handle: { title: "Dashboard", navKey: "dashboard" } },
      { path: "demandes", element: <SuspenseWrap><DemandesPage /></SuspenseWrap>, handle: { title: "Purchase Requests", navKey: "demandes" } },
      { path: "repartition", element: <SuspenseWrap><DemandesParDepartement /></SuspenseWrap>, handle: { title: "Requests by Department", navKey: "repartition" } },
      { path: "departements", element: <Navigate to="/repartition" replace /> },
      { path: "departements/:nom", element: <SuspenseWrap><DemandesParDepartement /></SuspenseWrap>, handle: { title: "Requests by Department", navKey: "repartition" } },
      { path: "suivi", element: <SuspenseWrap><SuiviCapex /></SuspenseWrap>, handle: { title: "Capex Tracking", navKey: "suivi" } },
      { path: "capex/:id", element: <SuspenseWrap><SuiviCapex /></SuspenseWrap>, handle: { title: "Capex Tracking", navKey: "suivi" } },
      { path: "boncommandes", element: <SuspenseWrap><BonCommandesPage /></SuspenseWrap>, handle: { title: "Purchase Orders", navKey: "boncommandes" } },
      { path: "bons-commandes", element: <Navigate to="/boncommandes" replace /> },
      { path: "fournisseurs", element: <SuspenseWrap><FournisseursPage /></SuspenseWrap>, handle: { title: "Supplier Statistics", navKey: "fournisseurs" } },
      // alias compat anciens onNavigate keys without slash
      { path: "dashboard", element: <Navigate to="/" replace /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
