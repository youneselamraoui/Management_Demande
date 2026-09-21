namespace backend.DTOs;

public class FournisseurDeptDto
{
    public string DepartementNom { get; set; } = string.Empty;
    public int NombreCommandes { get; set; }
    public double MontantTotal { get; set; }
}

public class FournisseurCommandeDetailDto
{
    public int BonCommandeId { get; set; }
    public int DemandeId { get; set; }
    public string Po { get; set; } = string.Empty;
    public DateTime DateCreation { get; set; }
    public string DepartementNom { get; set; } = string.Empty;
    public string DemandeurNom { get; set; } = string.Empty;
    public double Montant { get; set; }
}

public class FournisseurStatDto
{
    public int FournisseurId { get; set; }
    public string FournisseurNom { get; set; } = string.Empty;
    public int NombreBonCommandes { get; set; }
    public double MontantTotal { get; set; }
    public double MontantMoyen { get; set; }
    public DateTime? DerniereCommande { get; set; }
    // Répartition par département (nombre + montant)
    public List<FournisseurDeptDto> ParDepartement { get; set; } = new();
    // Commandes détaillées groupées par département (tous sont BonDeCommande)
    public List<FournisseurCommandeDetailDto> Commandes { get; set; } = new();
}

public class FournisseurStatsResponseDto
{
    public List<FournisseurStatDto> ParFournisseur { get; set; } = new();
    public int TotalFournisseurs { get; set; }
    public int TotalBonCommandes { get; set; }
    public double MontantGlobal { get; set; }
    public double MontantMoyenGlobal { get; set; }
}

public class CreateFournisseurDto
{
    public string Nom { get; set; } = string.Empty;
}
