namespace backend.DTOs;

public class CreateUtilisateurDto
{
    public string Nom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MotDePasse { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int DepartementID { get; set; }
    public int? ChefId { get; set; }
    public bool Active { get; set; } = true;
    public bool? DoitChangerMotDePasse { get; set; }
    public string? EmailChef { get; set; }
    public string? NomChef { get; set; }
}