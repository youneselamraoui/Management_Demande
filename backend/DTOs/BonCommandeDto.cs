namespace backend.DTOs;

public class BonCommandeDto
{
    public int Id { get; set; }
    public int DemandeId { get; set; }
    public string? Po { get; set; }
    public DateTime DateCreation { get; set; }
    public int FournisseurId { get; set; }
    public string FournisseurNom { get; set; } = string.Empty;
    public string StatutDemande { get; set; } = string.Empty;
    public bool EstIncoherent => StatutDemande != "BonDeCommande";
}

public class CreateBonCommandeDto
{
    public int DemandeId { get; set; }
    public string? Po { get; set; }
    public int FournisseurId { get; set; }
}
