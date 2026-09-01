// Data/Repositories/IDepartementRepository.cs
using backend.Models;

namespace backend.Data.Repositories;

public interface IDetailDemandeRepository
{
    Task<DetailDemande?> GetByIdAsync(int id);
    Task<List<DetailDemande>> GetByDemandeIdAsync(int demandeId);
    Task<int> AddAsync(DetailDemande detail);
    Task<bool> UpdateAsync(DetailDemande detail);
    Task<bool> DeleteAsync(int id);
}