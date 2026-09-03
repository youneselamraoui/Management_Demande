using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using EfUtilisateur = backend.Data.EfModels.Utilisateur;

namespace backend.Services;

public class UtilisateurService : IUtilisateurService
{
    private readonly backend.Data.EfModels.ProjetDbContext _context;
    public UtilisateurService(backend.Data.EfModels.ProjetDbContext context) => _context = context;

    public async Task<Utilisateur?> GetUtilisateurAsync(int id)
    {
        var entity = await _context.Utilisateurs
            .Include(u => u.Departement)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        return entity is null ? null : MapToModel(entity);
    }

    public async Task<List<Utilisateur>> GetAllUtilisateursAsync()
    {
        var entities = await _context.Utilisateurs
            .Include(u => u.Departement)
            .AsNoTracking()
            .ToListAsync();

        return entities.Select(MapToModel).ToList();
    }

    public async Task<Utilisateur> CreateUtilisateurAsync(CreateUtilisateurDto dto)
    {
        // Règle métier : vérifier que le département existe avant d'insérer
        var departement = await _context.Departements
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == dto.DepartementID);

        if (departement is null)
            throw new BusinessException($"Le département {dto.DepartementID} n'existe pas.");

        var entity = new EfUtilisateur
        {
            Nom = dto.Nom,
            DepartementId = dto.DepartementID
        };

        _context.Utilisateurs.Add(entity);
        await _context.SaveChangesAsync();

        return new Utilisateur
        {
            Id = entity.Id,
            Nom = entity.Nom,
            DepartementID = entity.DepartementId,
            DepartementNom = departement.Nom
        };
    }

    private static Utilisateur MapToModel(EfUtilisateur entity) => new()
    {
        Id = entity.Id,
        Nom = entity.Nom,
        DepartementID = entity.DepartementId,
        DepartementNom = entity.Departement?.Nom ?? string.Empty
    };
}