namespace backend.Models;
using System.Text.Json.Serialization;

public class Demande
{
    public int Id { get; set; }
    [JsonIgnore]
    public int IdDemande { get => Id; set => Id = value; }
    public int UtilisateurId { get; set; }
    public string? UtilisateurNom { get; set; }
    public StatutDemande Statut { get; set; }
    public int CapexId { get; set; }
    public string? CapexNom { get; set; }
    public string? DepartementNom { get; set; }
    public string? RFX { get; set; }
    [JsonIgnore]
    public string? RFx { get => RFX; set => RFX = value; }
    public DateTime CreatedAt { get; set; }
    [JsonIgnore]
    public DateTime CreateAt { get => CreatedAt; set => CreatedAt = value; }
    public DateTime? DateValidationAchat1 { get; set; }
    [JsonIgnore]
    public DateTime? DateValidation1 { get => DateValidationAchat1; set => DateValidationAchat1 = value; }
    public DateTime? DateValidationAchat2 { get; set; }
    [JsonIgnore]
    public DateTime? DateValidation2 { get => DateValidationAchat2; set => DateValidationAchat2 = value; }
    public DateTime? DateValidateChef { get; set; }
    public DateTime? DateValidateFinance { get; set; }
    public DateTime? DateValidateDirecteur { get; set; }
}
