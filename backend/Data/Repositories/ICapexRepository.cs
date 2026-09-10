using backend.Models;
namespace backend.DTOs;

public interface ICapexRepository
{
    Task<Capex?> GetByIdAsync(int id);
    Task<List<Capex>> GetAllAsync();
    Task<int> AddAsync(Capex capex);
    Task<bool> DecrementerResteBudgetAsync(int Id, double montant);
    Task<List<ConsommationDepartementDto>> GetConsommationParDepartementAsync(int Id);

    Task<double> GetMontantEnAttenteAsync(int Id);
    }