namespace backend.DTOs;

public class CreateDemandeDto
{
    public int UtilisateurId { get; set; }
    public int CapexId { get; set; }
    public string? RFx { get; set; }
    public List<CreateLigneArticleDto> Articles { get; set; } = new();
}

public class CreateLigneArticleDto
{
    public string Article { get; set; } = string.Empty;
    public int Quantite { get; set; }
    public decimal Prix { get; set; }
    public string? Devis { get; set; }
}