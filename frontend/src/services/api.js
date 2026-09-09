import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:5058/api',
});

// Normalize pour compat (si axios utilisé)
api.interceptors.response.use((res) => {
  const data = res.data;
  if (Array.isArray(data) && res.config.url?.includes('/demandes')) {
    res.data = data.map((d) => ({ ...d, idDemande: d.idDemande ?? d.id, rFx: d.rFx ?? d.RFX, createAt: d.createAt ?? d.CreatedAt }));
  }
  return res;
});

export default api;