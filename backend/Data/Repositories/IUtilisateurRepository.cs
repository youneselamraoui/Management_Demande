// Data/Repositories/IUtilisateurRepository.cs
using backend.Models;

namespace backend.Data.Repositories;

public interface IUtilisateurRepository
{
    Task<Utilisateurs?> GetByIdAsync(int id);
    Task<List<Utilisateurs>> GetAllAsync();
    Task<int> AddAsync(Utilisateurs utilisateur);
}