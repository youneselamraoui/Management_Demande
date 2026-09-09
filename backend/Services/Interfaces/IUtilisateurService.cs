// Services/Interfaces/IUtilisateurService.cs
using backend.Models;

namespace backend.Services.Interfaces;

public interface IUtilisateurService
{
    Task<Utilisateurs?> GetUtilisateurAsync(int id);
    Task<List<Utilisateurs>> GetAllUtilisateursAsync();
    Task<Utilisateurs> CreateUtilisateurAsync(DTOs.CreateUtilisateurDto dto);
}