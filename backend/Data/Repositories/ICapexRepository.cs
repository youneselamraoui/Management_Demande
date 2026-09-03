using backend.Models;
namespace backend.DTOs;

public interface ICapexRepository
{
    Task<Capex?> GetByIdAsync(int id);
    Task<List<Capex>> GetAllAsync();
    Task<int> AddAsync(Capex capex);
    Task<bool> DecrementerResteBudgetAsync(int capexId, decimal montant);
    Task<List<ConsommationDepartementDto>> GetConsommationParDepartementAsync(int capexId);

    Task<decimal> GetMontantEnAttenteAsync(int capexId);
    }