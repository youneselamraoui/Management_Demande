import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DemandesPage from './components/DemandesPage';
import ConsommationCapex from './views/ConsommationCapex';
import CapexGraphes from "./views/CapexGraphes.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DemandesPage />} />
        <Route path="/consommation-capex" element={<ConsommationCapex />} />
        <Route path="/capex-graphes" element={<CapexGraphes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
