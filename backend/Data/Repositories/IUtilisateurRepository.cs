// Data/Repositories/IUtilisateurRepository.cs
using backend.Models;

namespace backend.Data.Repositories;

public interface IUtilisateurRepository
{
    Task<Utilisateur?> GetByIdAsync(int id);
    Task<List<Utilisateur>> GetAllAsync();
    Task<int> AddAsync(Utilisateur utilisateur);
}