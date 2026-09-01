using backend.Models;

namespace backend.Data.Repositories;

public interface IDemandeRepository
{
    Task<Demande?> GetByIdAsync(int id);
    Task<List<Demande>> GetAllAsync();
    Task<int> AddWithDetailsAsync(Demande demande, List<DetailDemande> details);
}