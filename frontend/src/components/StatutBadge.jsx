// src/components/StatutBadge.jsx
const STATUT_STYLES = {
  EnAttenteValidationAchat1: { bg: "#FFF4E0", color: "#9A6700", label: "Pending purchase validation 1" },
  EnAttenteValidationAchat2: { bg: "#FFF4E0", color: "#9A6700", label: "Pending purchase validation 2" },
  EnAttenteValidationChef: { bg: "#FFF4E0", color: "#9A6700", label: "Pending manager validation" },
  EnAttenteValidationFinance: { bg: "#FFF4E0", color: "#9A6700", label: "Pending finance validation" },
  EnAttenteValidationDirecteur: { bg: "#FFF4E0", color: "#9A6700", label: "Pending director validation" },
  EnAttenteConfirmationFinance: { bg: "#FFF4E0", color: "#9A6700", label: "Pending finance confirmation" },
  EnAttenteInsertionSAP: { bg: "#E0F2FF", color: "#0B5394", label: "Pending SAP insertion" },
  EnAttenteValidationEMEA: { bg: "#FFF4E0", color: "#9A6700", label: "Pending EMEA validation" },
  EnAttenteInformationsComplementaires: { bg: "#E0F2FF", color: "#0B5394", label: "Pending additional info" },
  BonDeCommande: { bg: "#E3F2E8", color: "#1B6E3C", label: "Purchase Order" },
  RefuseeAchat1: { bg: "#FDE8E8", color: "#B3261E", label: "Rejected purchase 1" },
  RefuseeAchat2: { bg: "#FDE8E8", color: "#B3261E", label: "Rejected purchase 2" },
  RefuseeChef: { bg: "#FDE8E8", color: "#B3261E", label: "Rejected by manager" },
  RefuseeFinance: { bg: "#FDE8E8", color: "#B3261E", label: "Rejected by finance" },
  RefuseeDirecteur: { bg: "#FDE8E8", color: "#B3261E", label: "Rejected by director" },
  RefuseeEMEA: { bg: "#FDE8E8", color: "#B3261E", label: "Rejected by EMEA" },
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
