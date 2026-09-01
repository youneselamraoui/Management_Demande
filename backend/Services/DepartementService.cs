// Services/DepartementService.cs
using backend.Data.Repositories;
using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;

namespace backend.Services;

public class DepartementService : IDepartementService
{
    private readonly IDepartementRepository _repo;
    public DepartementService(IDepartementRepository repo) => _repo = repo;

    public Task<Departement?> GetDepartementAsync(int id) => _repo.GetByIdAsync(id);
    public Task<List<Departement>> GetAllDepartementsAsync() => _repo.GetAllAsync();

    public async Task<Departement> CreateDepartementAsync(CreateDepartementDto dto)
    {
        var departement = new Departement { Nom = dto.Nom };
        var newId = await _repo.AddAsync(departement);
        departement.Id = newId;
        return departement;
    }
}