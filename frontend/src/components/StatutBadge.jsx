// src/components/StatutBadge.jsx
const STATUT_STYLES = {
  EnAttenteValidationAchat1: { bg: "#FFF4E0", color: "#9A6700", label: "En attente validation achat1" },
  EnAttenteValidationAchat2: { bg: "#FFF4E0", color: "#9A6700", label: "En attente validation achat2" },
  EnAttenteValidationChef: { bg: "#FFF4E0", color: "#9A6700", label: "En attente validation chef" },
  EnAttenteValidationFinance: { bg: "#FFF4E0", color: "#9A6700", label: "En attente validation finance" },
  EnAttenteValidationDirecteur: { bg: "#FFF4E0", color: "#9A6700", label: "En attente validation directeur" },
  BonDeCommande: { bg: "#E3F2E8", color: "#1B6E3C", label: "Bon commande" },
  RefuseeAchat1: { bg: "#FDE8E8", color: "#B3261E", label: "Refusée achat1" },
  RefuseeAchat2: { bg: "#FDE8E8", color: "#B3261E", label: "Refusée achat2" },
  RefuseeChef: { bg: "#FDE8E8", color: "#B3261E", label: "Refusée chef" },
  RefuseeFinance: { bg: "#FDE8E8", color: "#B3261E", label: "Refusée finance" },
  RefuseeDirecteur: { bg: "#FDE8E8", color: "#B3261E", label: "Refusée directeur" },
};

export default function StatutBadge({ statut }) {
  const style = STATUT_STYLES[statut] ?? { bg: "#EEE", color: "#555", label: statut };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "3px 10px",
        borderRadius: 4,
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {style.label}
    </span>
  );
}
