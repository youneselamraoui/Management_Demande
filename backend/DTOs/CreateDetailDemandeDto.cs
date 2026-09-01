namespace backend.DTOs;

public class CreateDetailDemandeDto
{
    public int DemandeId { get; set; }
    public string Article { get; set; } = string.Empty;
    public int Quantite { get; set; }
    public decimal Prix { get; set; }
    public string? Devis { get; set; }
}