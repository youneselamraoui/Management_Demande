using backend.Models;

namespace backend.Services.Interfaces;

public interface ICapexService
{
    Task<Capex?> GetCapexAsync(int id);
    Task<List<Capex>> GetAllCapexAsync();
    Task<Capex> CreateCapexAsync(DTOs.CreateCapexDto dto);
}