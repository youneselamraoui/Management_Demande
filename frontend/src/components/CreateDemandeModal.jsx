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
        capexId: form.capexId ? Number(form.capexId) : null,
        rFx: form.rFx || null,
        articles: lignes.map((l) => ({
          article: l.article,
          quantite: Number(l.quantite),
          prix: l.prix === "" || l.prix == null ? null : Number(l.prix),
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

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";
  const selectClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";
  const labelClass =
    "mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-[680px] max-w-full overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">New purchase request</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Fill in the details to submit your investment.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Main fields */}
          <div className="mb-5 grid grid-cols-1 gap-3.5 border-b border-border pb-5 sm:grid-cols-3">
            <div>
              <label className={labelClass}>
                <User size={13} /> Requester
              </label>
              <select
                required
                className={selectClass}
                value={form.utilisateurId}
                onChange={(e) => setForm({ ...form, utilisateurId: e.target.value })}
              >
                <option value="" disabled>Select</option>
                {utilisateurs.map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                <Calendar size={13} /> Capex (Period) <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <select
                className={selectClass}
                value={form.capexId}
                onChange={(e) => setForm({ ...form, capexId: e.target.value })}
              >
                <option value="">— None (empty)</option>
                {capexList.map((c) => <option key={c.id ?? c.Id ?? c.capexId} value={c.id ?? c.Id ?? c.capexId}>{c.nomCapex}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                <FileText size={13} /> RFx (optional)
              </label>
              <input
                type="text"
                placeholder="Ex: RFT-2026-001"
                value={form.rFx}
                onChange={(e) => setForm({ ...form, rFx: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Items */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[15px] font-bold text-foreground">
              Items
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {lignes.length}
              </span>
            </div>
            <button
              type="button"
              onClick={addLigne}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Plus size={14} /> Add line
            </button>
          </div>

          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-1.5 pb-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                    Item / Description
                  </th>
                  <th className="w-16 px-1.5 pb-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                    Qty
                  </th>
                  <th className="w-28 px-1.5 pb-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                    Unit Price
                  </th>
                  <th className="w-28 px-1.5 pb-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                    Quote Ref.
                  </th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, i) => (
                  <tr key={i}>
                    <td className="px-1.5 py-1">
                      <input
                        required
                        type="text"
                        placeholder="Item name"
                        value={l.article}
                        onChange={(e) => updateLigne(i, "article", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <input
                        required
                        type="number"
                        min="1"
                        value={l.quantite}
                        onChange={(e) => updateLigne(i, "quantite", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="— (empty)"
                        value={l.prix}
                        onChange={(e) => updateLigne(i, "prix", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <input
                        type="text"
                        placeholder="Quote ref."
                        value={l.devis}
                        onChange={(e) => updateLigne(i, "devis", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      {lignes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLigne(i)}
                          className="rounded-md p-1 text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="mb-4 text-right">
            <div className="text-sm text-muted-foreground">
              Number of items: <strong className="text-foreground">{lignes.length}</strong>
            </div>
            <div className="mt-1 text-xl font-bold text-primary">
              Estimated total: {total.toLocaleString("en-US", { minimumFractionDigits: 2 })} $
            </div>
          </div>

          {/* Info box */}
          <div className="mb-5 flex gap-3 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
            <Info size={16} className="mt-0.5 shrink-0" />
            <div>
              <strong className="block">Compliance check</strong>
              This request will be submitted for finance department approval. Please ensure
              you have attached the corresponding quotes for the entered references.
            </div>
          </div>

          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <CheckCircle2 size={16} /> {submitting ? "Creating..." : "Create request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}