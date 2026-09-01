// DTOs/CreateDemandeDto.cs
namespace backend.DTOs;

public class CreateDemandeDto
{
    public int UtilisateurId { get; set; }
    public int CapexId { get; set; }
    public string? RFx { get; set; }
}