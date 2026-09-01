// Services/Interfaces/IDemandeService.cs
using backend.DTOs;
using backend.Models;

namespace backend.Services.Interfaces;

public interface IDemandeService
{
    Task<Demande?> GetDemandeAsync(int id);
    Task<List<Demande>> GetAllDemandesAsync();
    Task<Demande> CreateDemandeAsync(CreateDemandeDto dto);
    Task ValiderParChefAsync(int demandeId);
    Task ValiderParFinanceAsync(int demandeId);
    Task ValiderParDirecteurAsync(int demandeId);
    Task RejeterAsync(int demandeId);
}