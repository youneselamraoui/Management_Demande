// Services/Interfaces/IDepartementService.cs
using backend.Models;

namespace backend.Services.Interfaces;

public interface IDepartementService
{
    Task<Departement?> GetDepartementAsync(int id);
    Task<List<Departement>> GetAllDepartementsAsync();
    Task<Departement> CreateDepartementAsync(DTOs.CreateDepartementDto dto);
}