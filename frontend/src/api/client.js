const API_URL = import.meta.env.PROD ? "/api" : "http://localhost:5058/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Erreur ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const getDemandes = () => request("/demandes");
export const getDetailsDemande = (id) => request(`/detaildemandes/demande/${id}`);
export const createDemande = (data) =>
  request("/demandes", { method: "POST", body: JSON.stringify(data) });
export const getUtilisateurs = () => request("/utilisateurs");
export const getCapex = () => request("/capex");
export const getConsommationCapex = (capexId) =>
  request(`/capex/${capexId}/consommation-departements`);