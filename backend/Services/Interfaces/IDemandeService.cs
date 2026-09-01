using backend.Models;

namespace backend.Services.Interfaces;

public interface IDemandeService
{
    Task<Demande?> GetDemandeAsync(int id);
    Task<List<Demande>> GetAllDemandesAsync();
    Task<Demande> CreateDemandeAsync(DTOs.CreateDemandeDto dto);
}