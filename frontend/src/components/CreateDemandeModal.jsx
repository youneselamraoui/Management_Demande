import { useEffect, useState } from "react";
import { ShoppingCart, X, User, Calendar, FileText, Plus, Trash2, Info, CheckCircle2 } from "lucide-react";
import { createDemande, getUtilisateurs, getCapex } from "../api/client";

const EMPTY_LIGNE = { article: "", quantite: 1, prix: "", devis: "" };

export default function CreateDemandeModal({ onClose, onCreated }) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [capexList, setCapexList] = useState([]);
  const [form, setForm] = useState({ utilisateurId: "", capexId: "", rFx: "" });
  const [lignes, setLignes] = useState([{ ...EMPTY_LIGNE }]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getUtilisateurs(), getCapex()])
      .then(([u, c]) => { setUtilisateurs(u); setCapexList(c); })
      .catch((e) => setError(e.message));
  }, []);

  function updateLigne(i, field, value) {
    setLignes((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }
  function addLigne() { setLignes((prev) => [...prev, { ...EMPTY_LIGNE }]); }
  function removeLigne(i) { setLignes((prev) => prev.filter((_, idx) => idx !== i)); }

  const total = lignes.reduce((sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prix) || 0), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createDemande({
        utilisateurId: Number(form.utilisateurId),
        capexId: Number(form.capexId),
        rFx: form.rFx || null,
        articles: lignes.map((l) => ({
          article: l.article,
          quantite: Number(l.quantite),
          prix: Number(l.prix),
          devis: l.devis || null,
        })),
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={onClose}>
      <div className="card-panel" style={{ width: 640, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="icon-chip" style={{ background: "var(--blue-bg)", color: "var(--blue-fg)" }}>
              <ShoppingCart size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Nouvelle demande d'achat</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                Remplissez les détails pour soumettre votre investissement.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--border-soft)" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
                <User size={13} /> Demandeur
              </label>
              <select required className="select-pill" style={{ width: "100%" }} value={form.utilisateurId} onChange={(e) => setForm({ ...form, utilisateurId: e.target.value })}>
                <option value="" disabled>Sélectionner</option>
                {utilisateurs.map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
                <Calendar size={13} /> Capex (Période)
              </label>
              <select required className="select-pill" style={{ width: "100%" }} value={form.capexId} onChange={(e) => setForm({ ...form, capexId: e.target.value })}>
                <option value="" disabled>Sélectionner</option>
                {capexList.map((c) => <option key={c.capexId} value={c.capexId}>{c.nomCapex}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
                <FileText size={13} /> RFx (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: RFT-2026-001"
                value={form.rFx}
                onChange={(e) => setForm({ ...form, rFx: e.target.value })}
                style={{ width: "100%", border: "1px solid var(--border-soft)", borderRadius: 10, padding: "9px 12px", fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15 }}>
              Articles
              <span className="badge-pill" style={{ background: "var(--gray-bg)", color: "var(--text-secondary)" }}>{lignes.length}</span>
            </div>
            <button type="button" className="btn-outline" onClick={addLigne}>
              <Plus size={14} /> Ajouter une ligne
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", fontSize: 11, color: "var(--text-secondary)", padding: "0 6px 6px", fontWeight: 600 }}>Article / Désignation</th>
                <th style={{ textAlign: "left", fontSize: 11, color: "var(--text-secondary)", padding: "0 6px 6px", fontWeight: 600, width: 60 }}>Qté</th>
                <th style={{ textAlign: "left", fontSize: 11, color: "var(--text-secondary)", padding: "0 6px 6px", fontWeight: 600, width: 100 }}>Prix Unitaire</th>
                <th style={{ textAlign: "left", fontSize: 11, color: "var(--text-secondary)", padding: "0 6px 6px", fontWeight: 600, width: 100 }}>Réf. Devis</th>
                <th style={{ width: 30 }} />
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={i}>
                  <td style={{ padding: "4px 6px" }}>
                    <input required type="text" placeholder="Nom de l'article" value={l.article} onChange={(e) => updateLigne(i, "article", e.target.value)}
                      style={{ width: "100%", border: "1px solid var(--border-soft)", borderRadius: 8, padding: "8px 10px", fontSize: 13 }} />
                  </td>
                  <td style={{ padding: "4px 6px" }}>
                    <input required type="number" min="1" value={l.quantite} onChange={(e) => updateLigne(i, "quantite", e.target.value)}
                      style={{ width: "100%", border: "1px solid var(--border-soft)", borderRadius: 8, padding: "8px 10px", fontSize: 13 }} />
                  </td>
                  <td style={{ padding: "4px 6px" }}>
                    <input required type="number" min="0" step="0.01" value={l.prix} onChange={(e) => updateLigne(i, "prix", e.target.value)}
                      style={{ width: "100%", border: "1px solid var(--border-soft)", borderRadius: 8, padding: "8px 10px", fontSize: 13 }} />
                  </td>
                  <td style={{ padding: "4px 6px" }}>
                    <input type="text" placeholder="Réf. devis" value={l.devis} onChange={(e) => updateLigne(i, "devis", e.target.value)}
                      style={{ width: "100%", border: "1px solid var(--border-soft)", borderRadius: 8, padding: "8px 10px", fontSize: 13 }} />
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>
                    {lignes.length > 1 && (
                      <button type="button" onClick={() => removeLigne(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red-fg)" }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Nombre d'articles : <strong style={{ color: "var(--text-primary)" }}>{lignes.length}</strong></div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", marginTop: 4 }}>
              Total estimé : {total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} MAD
            </div>
          </div>

          <div className="info-box" style={{ marginBottom: 18 }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Vérification de conformité</strong>
              Cette demande sera soumise à l'approbation du département finance. Assurez-vous d'avoir joint les devis correspondants aux références saisies.
            </div>
          </div>

          {error && <p style={{ color: "var(--red-fg)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" className="btn-outline" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-navy" disabled={submitting}>
              <CheckCircle2 size={16} /> {submitting ? "Création..." : "Créer la demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}