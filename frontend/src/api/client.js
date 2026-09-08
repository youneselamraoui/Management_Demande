const API_URL = import.meta.env.PROD ? "/api" : "http://localhost:5058/api";

function normalizeDemande(d) {
  if (!d || typeof d !== 'object') return d;
  const id = d.idDemande ?? d.id ?? d.Id ?? d.ID;
  const rfx = d.rFx ?? d.RFX ?? d.rfx ?? d.Rfx ?? d.RFX;
  const createdAt = d.createAt ?? d.CreatedAt ?? d.createdAt ?? d.CreateAt;
  const dv1 = d.dateValidation1 ?? d.DateValidationAchat1 ?? d.dateValidationAchat1;
  const dv2 = d.dateValidation2 ?? d.DateValidationAchat2 ?? d.dateValidationAchat2;
  return {
    ...d,
    id, Id: id, idDemande: id,
    rFx: rfx, RFX: rfx, rfx: rfx,
    createAt: createdAt, CreatedAt: createdAt, createdAt: createdAt,
    dateValidation1: dv1, DateValidationAchat1: dv1, dateValidationAchat1: dv1,
    dateValidation2: dv2, DateValidationAchat2: dv2, dateValidationAchat2: dv2,
  };
}
function normalizeCapex(c) {
  if (!c || typeof c !== 'object') return c;
  const rb = c.resteBudget ?? c.budgetRestant ?? c.BudgetRestant ?? c.resteBudget;
  return {
    ...c,
    resteBudget: rb, budgetRestant: rb, ResteBudget: rb, BudgetRestant: rb,
  };
}
function normalizeConsommation(co) {
  if (!co || typeof co !== 'object') return co;
  const rb = co.resteBudget ?? co.budgetRestant ?? co.BudgetRestant;
  return {
    ...co,
    resteBudget: rb, budgetRestant: rb, ResteBudget: rb, BudgetRestant: rb,
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Erreur ${res.status}`);
  }
  if (res.status === 204) return null;
  const data = await res.json();
  // Normalize pour compat ancien/nouveau noms (Id/RFX/CreatedAt/BudgetRestant)
  if (Array.isArray(data)) {
    if (path.includes('/demandes')) return data.map(normalizeDemande);
    if (path.includes('/capex') && !path.includes('consommation')) return data.map(normalizeCapex);
    return data;
  }
  if (path.includes('/demandes')) return normalizeDemande(data);
  if (path.includes('consommation')) return normalizeConsommation(data);
  if (path.startsWith('/capex')) return normalizeCapex(data);
  return data;
}

export const getDemandes = () => request("/demandes");
export const getDetailsDemande = (id) => request(`/detaildemandes/demande/${id}`);
export const createDemande = (data) =>
  request("/demandes", { method: "POST", body: JSON.stringify(data) });
export const getUtilisateurs = () => request("/utilisateurs");
export const getCapex = () => request("/capex");
export const getConsommationCapex = (capexId) =>
  request(`/capex/${capexId}/consommation-departements`);