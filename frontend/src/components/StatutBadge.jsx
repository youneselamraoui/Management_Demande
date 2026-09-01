const STATUT_STYLES = {
  EnAttente: { bg: "#FFF4E0", color: "#9A6700", label: "En attente" },
  ValideChef: { bg: "#E3F2E8", color: "#1B6E3C", label: "Validé chef" },
  ValideFinance: { bg: "#E3F2E8", color: "#1B6E3C", label: "Validé finance" },
  ValideDirecteur: { bg: "#DFF0FF", color: "#0B5FA8", label: "Validé directeur" },
  Rejetee: { bg: "#FDE8E8", color: "#B3261E", label: "Rejetée" },
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