namespace backend.DTOs;
using System.Text.Json.Serialization;

public class CreateDemandeDto
{
    public int UtilisateurId { get; set; }
    public int? CapexId { get; set; }
    [JsonIgnore]
    public int? Id { get => CapexId; set => CapexId = value; }
    public string? RFX { get; set; }
    [JsonIgnore]
    public string? RFx { get => RFX; set => RFX = value; }
    public string? Commentaire { get; set; }
    public double? MontantReserve { get; set; }
    public string? CheminDevis { get; set; }
    public string? CheminSAP { get; set; }
    public string? CheminFinance { get; set; }
    public string? FichierPath { get; set; }
    public string? Justification { get; set; }
    public int? Sta1 { get; set; }
    public int? Sta2 { get; set; }
    public int? Stc { get; set; }
    public int? Stf { get; set; }
    public int? Std { get; set; }
    public int? Stu { get; set; }
    public int? Stp { get; set; }
    public List<CreateLigneArticleDto> Articles { get; set; } = new();
}

public class CreateLigneArticleDto
{
    public string Article { get; set; } = string.Empty;
    public int Quantite { get; set; }
    public double? Prix { get; set; }
    public string? Devis { get; set; }
}