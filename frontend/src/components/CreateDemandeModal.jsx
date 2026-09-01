import { useEffect, useState } from "react";
import { createDemande, getUtilisateurs, getCapex } from "../api/client";
import "./CreateDemandeModal.css";

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

  function updateLigne(index, field, value) {
    setLignes((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  }

  function addLigne() {
    setLignes((prev) => [...prev, { ...EMPTY_LIGNE }]);
  }

  function removeLigne(index) {
    setLignes((prev) => prev.filter((_, i) => i !== index));
  }

  const total = lignes.reduce(
    (sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prix) || 0),
    0
  );

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-panel-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nouvelle demande</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-row">
            <label>
              Demandeur
              <select
                required
                value={form.utilisateurId}
                onChange={(e) => setForm({ ...form, utilisateurId: e.target.value })}
              >
                <option value="" disabled>Sélectionner</option>
                {utilisateurs.map((u) => (
                  <option key={u.id} value={u.id}>{u.nom}</option>
                ))}
              </select>
            </label>

            <label>
              Capex
              <select
                required
                value={form.capexId}
                onChange={(e) => setForm({ ...form, capexId: e.target.value })}
              >
                <option value="" disabled>Sélectionner</option>
                {capexList.map((c) => (
                  <option key={c.capexId} value={c.capexId}>
                    {c.nomCapex} — reste {c.resteBudget.toLocaleString("fr-FR")} MAD
                  </option>
                ))}
              </select>
            </label>

            <label>
              RFx (optionnel)
              <input
                type="text"
                value={form.rFx}
                onChange={(e) => setForm({ ...form, rFx: e.target.value })}
              />
            </label>
          </div>

          <div className="lignes-section">
            <div className="lignes-header">
              <span>Articles</span>
              <button type="button" className="btn-link" onClick={addLigne}>
                + Ajouter une ligne
              </button>
            </div>

            <table className="lignes-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Qté</th>
                  <th>Prix unitaire</th>
                  <th>Devis</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        required
                        type="text"
                        value={ligne.article}
                        onChange={(e) => updateLigne(i, "article", e.target.value)}
                        placeholder="Nom de l'article"
                      />
                    </td>
                    <td>
                      <input
                        required
                        type="number"
                        min="1"
                        value={ligne.quantite}
                        onChange={(e) => updateLigne(i, "quantite", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={ligne.prix}
                        onChange={(e) => updateLigne(i, "prix", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={ligne.devis}
                        onChange={(e) => updateLigne(i, "devis", e.target.value)}
                        placeholder="Réf. devis"
                      />
                    </td>
                    <td>
                      {lignes.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => removeLigne(i)}
                          aria-label="Supprimer la ligne"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="lignes-total">
              Total : <strong>{total.toLocaleString("fr-FR")} MAD</strong>
            </p>
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Création..." : "Créer la demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}