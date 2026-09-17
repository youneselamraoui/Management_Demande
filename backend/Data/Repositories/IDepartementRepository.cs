using backend.Models;

namespace backend.Data.Repositories;

public interface IDepartementRepository
{
    Task<Departements?> GetByIdAsync(int id);
    Task<List<Departements>> GetAllAsync();
    Task<int> AddAsync(Departements departement);
}