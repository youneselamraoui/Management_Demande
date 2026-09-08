using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using EfDepartement = backend.Data.EfModels.Departement;

namespace backend.Services;

public class DepartementService : IDepartementService
{
    private readonly backend.Data.EfModels.ProjetDbContext _context;
    public DepartementService(backend.Data.EfModels.ProjetDbContext context) => _context = context;

    public async Task<Departements?> GetDepartementAsync(int id)
    {
        var entity = await _context.Departements.FindAsync(id);
        return entity is null ? null : MapToModel(entity);
    }

    public async Task<List<Departements>> GetAllDepartementsAsync()
    {
        var entities = await _context.Departements.AsNoTracking().ToListAsync();
        return entities.Select(MapToModel).ToList();
    }

    public async Task<Departements> CreateDepartementAsync(CreateDepartementDto dto)
    {
        var entity = new EfDepartement { Nom = dto.Nom };

        _context.Departements.Add(entity);
        await _context.SaveChangesAsync();

        return MapToModel(entity);
    }

    private static Departements MapToModel(EfDepartement entity) => new()
    {
        Id = entity.Id,
        Nom = entity.Nom
    };
}