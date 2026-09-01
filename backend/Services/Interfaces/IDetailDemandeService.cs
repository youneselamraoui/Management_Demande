using backend.Models;

namespace backend.Services.Interfaces;

public interface IDetailDemandeService
{
    Task<DetailDemande?> GetDetailAsync(int id);
    Task<List<DetailDemande>> GetByDemandeIdAsync(int demandeId);
    Task<DetailDemande> CreateDetailAsync(DTOs.CreateDetailDemandeDto dto);
}