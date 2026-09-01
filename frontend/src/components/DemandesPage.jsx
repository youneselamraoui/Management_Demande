import { useEffect, useState } from "react";
import { getDemandes, getDetailsDemande } from "../api/client";
import StatutBadge from "./StatutBadge";
import CreateDemandeModal from "./CreateDemandeModal";
import "./DemandesPage.css";

export default function DemandesPage() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadDemandes();
  }, []);

  function loadDemandes() {
    setLoading(true);
    getDemandes()
      .then(setDemandes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  async function toggleExpand(id) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!detailsCache[id]) {
      try {
        const details = await getDetailsDemande(id);
        setDetailsCache((prev) => ({ ...prev, [id]: details }));
      } catch (e) {
        setDetailsCache((prev) => ({ ...prev, [id]: { error: e.message } }));
      }
    }
  }

  function handleCreated(newDemande) {
    setDemandes((prev) => [newDemande, ...prev]);
  }

  return (
    <div className="demandes-page">
      <div className="demandes-header">
        <h1>Demandes d'achat</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Nouvelle demande
        </button>
      </div>

      {loading && <p className="demandes-info">Chargement...</p>}
      {error && <p className="demandes-error">{error}</p>}

      {!loading && !error && demandes.length === 0 && (
        <p className="demandes-info">Aucune demande pour le moment.</p>
      )}

      {!loading && demandes.length > 0 && (
        <div className="demandes-card">
        <table className="demandes-table">
          <thead>
            <tr>
              <th />
              <th>N°</th>
              <th>Demandeur</th>
              <th>Capex</th>
              <th>Statut</th>
              <th>RFx</th>
              <th>Créée le</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((d) => (
              <DemandeRow
                key={d.idDemande}
                demande={d}
                expanded={expandedId === d.idDemande}
                onToggle={() => toggleExpand(d.idDemande)}
                details={detailsCache[d.idDemande]}
              />
            ))}
          </tbody>
        </table>
       </div>
)}

      {showModal && (
        <CreateDemandeModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function DemandeRow({ demande, expanded, onToggle, details }) {
  return (
    <>
      <tr className="demande-row" onClick={onToggle}>
        <td className="demande-arrow">
          <span className={expanded ? "arrow arrow-open" : "arrow"}>▶</span>
        </td>
        <td>#{demande.idDemande}</td>
        <td>{demande.utilisateurNom}</td>
        <td>{demande.capexNom}</td>
        <td><StatutBadge statut={demande.statut} /></td>
        <td>{demande.rFx || "—"}</td>
        <td>{new Date(demande.createAt).toLocaleDateString("fr-FR")}</td>
      </tr>

      {expanded && (
        <tr className="demande-details-row">
          <td colSpan={7}>
            <DemandeDetails details={details} />
          </td>
        </tr>
      )}
    </>
  );
}

function DemandeDetails({ details }) {
  if (!details) return <p className="demandes-info">Chargement des articles...</p>;
  if (details.error) return <p className="demandes-error">{details.error}</p>;
  if (details.length === 0) return <p className="demandes-info">Aucun article sur cette demande.</p>;

  const total = details.reduce((sum, d) => sum + d.quantite * d.prix, 0);

  return (
    <table className="details-table">
      <thead>
        <tr>
          <th>Article</th>
          <th>Quantité</th>
          <th>Prix unitaire</th>
          <th>Sous-total</th>
          <th>Devis</th>
        </tr>
      </thead>
      <tbody>
        {details.map((line) => (
          <tr key={line.id}>
            <td>{line.article}</td>
            <td>{line.quantite}</td>
            <td>{line.prix.toLocaleString("fr-FR")} MAD</td>
            <td>{(line.quantite * line.prix).toLocaleString("fr-FR")} MAD</td>
            <td>{line.devis || "—"}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3}><strong>Total</strong></td>
          <td colSpan={2}><strong>{total.toLocaleString("fr-FR")} MAD</strong></td>
        </tr>
      </tfoot>
    </table>
  );
}