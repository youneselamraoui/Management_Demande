namespace backend.Models;

public class Utilisateurs
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int DepartementID { get; set; }
    public int? ChefId { get; set; }
    public bool Active { get; set; } = true;
    public bool? DoitChangerMotDePasse { get; set; }
    public string? EmailChef { get; set; }
    public string? NomChef { get; set; }

    // Optionnel : rempli seulement si on fait une jointure explicite
    public string? DepartementNom { get; set; }
}