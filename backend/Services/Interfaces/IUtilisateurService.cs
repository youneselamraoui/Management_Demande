// Services/Interfaces/IUtilisateurService.cs
using backend.Models;

namespace backend.Services.Interfaces;

public interface IUtilisateurService
{
    Task<Utilisateur?> GetUtilisateurAsync(int id);
    Task<List<Utilisateur>> GetAllUtilisateursAsync();
    Task<Utilisateur> CreateUtilisateurAsync(DTOs.CreateUtilisateurDto dto);
}