const API_URL = import.meta.env.PROD ? "/api" : "http://localhost:5058/api";

function normalizeDemande(d) {
  if (!d || typeof d !== 'object') return d;
  const id = d.idDemande ?? d.id ?? d.Id ?? d.ID;
  const rfx = d.rFx ?? d.RFX ?? d.rfx ?? d.Rfx ?? d.RFX;
  const createdAt = d.createAt ?? d.CreatedAt ?? d.createdAt ?? d.CreateAt;
  const dv1 = d.dateValidation1 ?? d.DateValidationAchat1 ?? d.dateValidationAchat1;
  const dv2 = d.dateValidation2 ?? d.DateValidationAchat2 ?? d.dateValidationAchat2;
  const dept = d.departementNom ?? d.DepartementNom ?? d.departement ?? d.Departement ?? d.department ?? "";
  return {
    ...d,
    id, Id: id, idDemande: id,
    rFx: rfx, RFX: rfx, rfx: rfx,
    createAt: createdAt, CreatedAt: createdAt, createdAt: createdAt,
    dateValidation1: dv1, DateValidationAchat1: dv1, dateValidationAchat1: dv1,
    dateValidation2: dv2, DateValidationAchat2: dv2, dateValidationAchat2: dv2,
    departementNom: dept, DepartementNom: dept, departement: dept,
  };
}
function normalizeCapex(c) {
  if (!c || typeof c !== 'object') return c;
  const rb = c.resteBudget ?? c.budgetRestant ?? c.BudgetRestant ?? c.resteBudget;
  const id = c.capexId ?? c.CapexId ?? c.id ?? c.Id ?? c.ID;
  return {
    ...c,
    capexId: id, CapexId: id, id: id, Id: id,
    resteBudget: rb, budgetRestant: rb, ResteBudget: rb, BudgetRestant: rb,
  };
}
function normalizeConsommation(co) {
  if (!co || typeof co !== 'object') return co;
  const rb = co.resteBudget ?? co.budgetRestant ?? co.BudgetRestant ?? co.BudgetRestantStocke ?? co.budgetRestantStocke;
  const me = co.montantEnAttente ?? co.MontantEnAttente ?? co.montantEnAttente ?? 0;
  const bt = co.budgetTotal ?? co.BudgetTotal ?? 0;
  const pd = co.parDepartement ?? co.ParDepartement ?? [];
  return {
    ...co,
    budgetTotal: bt, BudgetTotal: bt,
    montantEnAttente: me, MontantEnAttente: me,
    resteBudget: rb, budgetRestant: rb, ResteBudget: rb, BudgetRestant: rb,
    parDepartement: pd, ParDepartement: pd,
  };
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
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
export const validerDemande = (id) => request(`/demandes/${id}/valider`, { method: "PUT" });
export const refuserDemande = (id) => request(`/demandes/${id}/refuser`, { method: "PUT" });
export const getUtilisateurs = () => request("/utilisateurs");
export const getCapex = () => request("/capex");
export const getConsommationCapex = (Id, from, to) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const q = params.toString() ? `?${params}` : "";
  return request(`/capex/${Id}/consommation-departements${q}`);
};
export const getBonCommandes = () => request("/boncommandes");
export const createBonCommande = (data) =>
  request("/boncommandes", { method: "POST", body: JSON.stringify(data) });
export const updateBonCommandeCheminFinance = (id, cheminFinance) =>
  request(`/boncommandes/${id}/chemin-finance`, { method: "PUT", body: JSON.stringify({ cheminFinance }) });
export const uploadBonCommandeCheminFinance = (id, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return request(`/boncommandes/${id}/chemin-finance/upload`, { method: "POST", body: formData });
};
export const getFournisseurs = () => request("/fournisseurs");
export const getFournisseurStats = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const q = params.toString() ? `?${params}` : "";
  return request(`/fournisseurs/stats${q}`);
};
export const getFournisseurStatsById = (id, from, to) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const q = params.toString() ? `?${params}` : "";
  return request(`/fournisseurs/${id}/stats${q}`);
};
export const createFournisseur = (data) =>
  request("/fournisseurs", { method: "POST", body: JSON.stringify(data) });
export const fileUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_URL.replace(/\/api$/, "");
  return `${base}${path}`;
};
