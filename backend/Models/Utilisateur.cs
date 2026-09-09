// Models/Utilisateur.cs
namespace backend.Models;

public class Utilisateurs
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public int DepartementID { get; set; }

    // Optionnel : rempli seulement si on fait une jointure explicite
    public string? DepartementNom { get; set; }
}