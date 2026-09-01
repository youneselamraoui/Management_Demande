// DTOs/CreateUtilisateurDto.cs
namespace backend.DTOs;

public class CreateUtilisateurDto
{
    public string Nom { get; set; } = string.Empty;
    public int DepartementID { get; set; }
}