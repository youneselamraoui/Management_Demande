using backend.Models;

namespace backend.Data.Repositories;

public interface ICapexRepository
{
    Task<Capex?> GetByIdAsync(int id);
    Task<List<Capex>> GetAllAsync();
    Task<int> AddAsync(Capex capex);
    Task<bool> DecrementerResteBudgetAsync(int capexId, decimal montant);
}