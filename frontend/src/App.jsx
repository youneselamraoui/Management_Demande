import { useState } from "react";
import DemandesPage from "./views/DemandesPage";
import SuiviCapex from "./views/SuiviCapex";
import Dashboard from "./views/Dashboard";
import BonCommandesPage from "./views/BonCommandesPage";
import DemandesParDepartement from "./views/DemandesParDepartement";

const CURRENT_USER = { name: "ECI", role: "" }; // à remplacer par ton auth réelle

const PAGES = {
  dashboard: Dashboard,
  demandes: DemandesPage,
  suivi: SuiviCapex,
  boncommandes: BonCommandesPage,
  repartition: DemandesParDepartement,
};

function App() {
  const [route, setRoute] = useState({ name: "dashboard", params: {} });

  function navigate(name, params = {}) {
    setRoute({ name, params });
  }

  const PageComponent = PAGES[route.name] ?? Dashboard;

  return <PageComponent onNavigate={navigate} params={route.params} user={CURRENT_USER} />;
}

export default App;