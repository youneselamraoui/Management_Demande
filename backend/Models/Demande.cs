namespace backend.Models;
using backend.Models; 


public class Demande
{
    public int IdDemande { get; set; }
    public int UtilisateurId { get; set; }
    public string? UtilisateurNom { get; set; }
    public StatutDemande Statut { get; set; }
    public int CapexId { get; set; }
    public string? CapexNom { get; set; }
    public string? RFx { get; set; }
    public DateTime CreateAt { get; set; }
    public DateTime? DateValidation1 { get; set; }
    public DateTime? DateValidation2 { get; set; }
    public DateTime? DateValidateChef { get; set; }
    public DateTime? DateValidateFinance { get; set; }
    public DateTime? DateValidateDirecteur { get; set; }
}
