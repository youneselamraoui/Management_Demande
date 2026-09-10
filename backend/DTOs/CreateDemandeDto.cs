namespace backend.DTOs;
using System.Text.Json.Serialization;

public class CreateDemandeDto
{
    public int UtilisateurId { get; set; }
    public int Id { get; set; }
    public string? RFX { get; set; }
    [JsonIgnore]
    public string? RFx { get => RFX; set => RFX = value; }
    public List<CreateLigneArticleDto> Articles { get; set; } = new();
}

public class CreateLigneArticleDto
{
    public string Article { get; set; } = string.Empty;
    public int Quantite { get; set; }
    public double? Prix { get; set; }
    public string? Devis { get; set; }
}