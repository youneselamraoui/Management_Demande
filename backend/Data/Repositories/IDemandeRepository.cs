// Data/Repositories/IDemandeRepository.cs
using backend.Models;

namespace backend.Data.Repositories;

public interface IDemandeRepository
{
    Task<Demande?> GetByIdAsync(int id);
    Task<List<Demande>> GetAllAsync();
    Task<int> AddAsync(Demande demande);
    Task UpdateAsync(Demande demande);
}