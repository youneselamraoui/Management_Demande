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

    public async Task<Utilisateurs?> GetUtilisateurAsync(int id)
    {
        var entity = await _context.Utilisateurs
            .Include(u => u.Departement)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        return entity is null ? null : MapToModel(entity);
    }

    public async Task<List<Utilisateurs>> GetAllUtilisateursAsync()
    {
        var entities = await _context.Utilisateurs
            .Include(u => u.Departement)
            .AsNoTracking()
            .ToListAsync();

        return entities.Select(MapToModel).ToList();
    }

    public async Task<Utilisateurs> CreateUtilisateurAsync(CreateUtilisateurDto dto)
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
            Email = string.IsNullOrWhiteSpace(dto.Email) ? $"{dto.Nom}@local" : dto.Email,
            MotDePasse = dto.MotDePasse ?? string.Empty,
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "User" : dto.Role,
            DepartementId = dto.DepartementID,
            ChefId = dto.ChefId,
            Active = dto.Active,
            DoitChangerMotDePasse = dto.DoitChangerMotDePasse,
            EmailChef = dto.EmailChef,
            NomChef = dto.NomChef
        };

        _context.Utilisateurs.Add(entity);
        await _context.SaveChangesAsync();

        return new Utilisateurs
        {
            Id = entity.Id,
            Nom = entity.Nom,
            Email = entity.Email,
            Role = entity.Role,
            DepartementID = entity.DepartementId,
            ChefId = entity.ChefId,
            Active = entity.Active,
            DoitChangerMotDePasse = entity.DoitChangerMotDePasse,
            EmailChef = entity.EmailChef,
            NomChef = entity.NomChef,
            DepartementNom = departement.Nom
        };
    }

    private static Utilisateurs MapToModel(EfUtilisateur entity) => new()
    {
        Id = entity.Id,
        Nom = entity.Nom,
        Email = entity.Email,
        Role = entity.Role,
        DepartementID = entity.DepartementId,
        ChefId = entity.ChefId,
        Active = entity.Active,
        DoitChangerMotDePasse = entity.DoitChangerMotDePasse,
        EmailChef = entity.EmailChef,
        NomChef = entity.NomChef,
        DepartementNom = entity.Departement?.Nom ?? string.Empty
    };
}
