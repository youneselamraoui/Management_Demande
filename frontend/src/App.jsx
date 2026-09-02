import { useState } from "react";
import DemandesPage from "./views/DemandesPage";
import SuiviCapex from "./views/SuiviCapex";

const CURRENT_USER = { name: "Youssef A.", role: "Finance Dept" }; // à remplacer par ton auth réelle

function App() {
  const [page, setPage] = useState("demandes");

  return page === "demandes" ? (
    <DemandesPage onNavigate={setPage} user={CURRENT_USER} />
  ) : (
    <SuiviCapex onNavigate={setPage} user={CURRENT_USER} />
  );
}

export default App;