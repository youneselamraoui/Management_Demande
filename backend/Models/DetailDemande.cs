namespace backend.Models;

public class DetailDemande
{
    public int Id { get; set; }
    public int DemandeId { get; set; }
    public string Article { get; set; } = string.Empty;
    public int Quantite { get; set; }
    public decimal Prix { get; set; }
    public string? Devis { get; set; }
}