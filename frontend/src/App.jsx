import { useState } from "react";
import DemandesPage from "./views/DemandesPage";
import SuiviCapex from "./views/SuiviCapex";
import Dashboard from "./views/Dashboard";

const CURRENT_USER = { name: " A.", role: "Fin" }; // à remplacer par ton auth réelle

const PAGES = {
  dashboard: Dashboard,
  demandes: DemandesPage,
  suivi: SuiviCapex,
};

function App() {
  const [page, setPage] = useState("dashboard");

  const PageComponent = PAGES[page] ?? Dashboard;

  return <PageComponent onNavigate={setPage} user={CURRENT_USER} />;
}

export default App;