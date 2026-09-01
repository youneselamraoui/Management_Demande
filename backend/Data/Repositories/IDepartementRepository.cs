// Data/Repositories/IDepartementRepository.cs
using backend.Models;

namespace backend.Data.Repositories;

public interface IDepartementRepository
{
    Task<Departement?> GetByIdAsync(int id);
    Task<List<Departement>> GetAllAsync();
    Task<int> AddAsync(Departement departement);
}