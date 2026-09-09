// Services/Interfaces/IDepartementService.cs
using backend.Models;

namespace backend.Services.Interfaces;

public interface IDepartementService
{
    Task<Departements?> GetDepartementAsync(int id);
    Task<List<Departements>> GetAllDepartementsAsync();
    Task<Departements> CreateDepartementAsync(DTOs.CreateDepartementDto dto);
}